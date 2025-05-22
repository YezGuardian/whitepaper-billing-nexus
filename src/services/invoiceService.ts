
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { getCompanySettings } from './companyService';
import { getClients } from './clientService';

export { getCompanySettings, getClients };

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (*)
      `);
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform data to match the frontend model
    const invoices: Invoice[] = [];
    
    for (const invoice of data) {
      // Fetch items for this invoice
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);
        
      if (itemsError) {
        console.error('Error fetching invoice items:', itemsError);
        continue;
      }
      
      // Transform items to match frontend model
      const items: InvoiceItem[] = itemsData ? itemsData.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        taxRate: Number(item.tax_rate || 0),
        taxAmount: (item.quantity * Number(item.unit_price) * Number(item.tax_rate || 0)) / 100,
        total: Number(item.amount)
      })) : [];
      
      // Calculate subtotal and tax total
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
      
      // Handle the case where client might be null
      if (!invoice.client) {
        console.error('Client data missing for invoice:', invoice.id);
        continue;
      }
      
      // Convert client from database model to frontend model
      const client = {
        id: invoice.client.id,
        name: invoice.client.name,
        contactPerson: invoice.client.contact_person || undefined,
        email: invoice.client.email,
        phone: invoice.client.phone || undefined,
        address: invoice.client.address,
        vatNumber: invoice.client.vat_number || undefined
      };
      
      // Create the invoice object
      invoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        client,
        issueDate: new Date(invoice.issue_date),
        dueDate: new Date(invoice.due_date),
        items,
        notes: invoice.notes || undefined,
        terms: invoice.terms || undefined,
        subtotal,
        taxTotal,
        total: Number(invoice.total_amount),
        status: invoice.status as any,
        recurrence: (invoice.recurrence as "none" | "weekly" | "monthly" | "quarterly" | "yearly") || "none",
        // Removed the nextGenerationDate field that was causing issues
      });
    }
    
    return invoices;
  } catch (error) {
    console.error('Error in getInvoices:', error);
    return [];
  }
};

export const saveInvoice = async (invoice: Invoice): Promise<Invoice> => {
  try {
    console.log("saveInvoice function called with:", JSON.stringify(invoice, null, 2));
    
    // Determine if this is a new invoice or an update
    const isNewInvoice = !invoice.id;
    const invoiceId = isNewInvoice ? uuidv4() : invoice.id;
    
    console.log("Invoice ID:", invoiceId, "Is new invoice:", isNewInvoice);
    
    // Convert dates to ISO string format for database storage
    const issueDate = invoice.issueDate instanceof Date 
      ? invoice.issueDate.toISOString().split('T')[0] 
      : new Date(invoice.issueDate).toISOString().split('T')[0];
      
    const dueDate = invoice.dueDate instanceof Date 
      ? invoice.dueDate.toISOString().split('T')[0] 
      : new Date(invoice.dueDate).toISOString().split('T')[0];
    
    // Prepare the invoice data for database
    // IMPORTANT: Remove the next_generation_date field that's causing errors
    const invoiceData = {
      id: invoiceId,
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.client.id,
      issue_date: issueDate,
      due_date: dueDate,
      total_amount: invoice.total,
      notes: invoice.notes || null,
      terms: invoice.terms || null,
      status: invoice.status,
      recurrence: invoice.recurrence || 'none',
      // Remove the next_generation_date field that's causing the error
    };
    
    console.log("Prepared invoice data:", invoiceData);
    
    // Save the invoice
    if (isNewInvoice) {
      const { data, error: insertError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select();
      
      if (insertError) {
        console.error('Error creating invoice:', insertError);
        throw insertError;
      }
      
      console.log("Insert response:", data);
    } else {
      // Delete existing items for this invoice to recreate them
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      
      if (deleteError) {
        console.error('Error deleting invoice items:', deleteError);
        throw deleteError;
      }

      const { data, error: updateError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId)
        .select();
      
      if (updateError) {
        console.error('Error updating invoice:', updateError);
        throw updateError;
      }
      
      console.log("Update response:", data);
    }
    
    console.log("Saving invoice items...");
    
    // Save the invoice items
    for (const item of invoice.items) {
      // Calculate the correct item total
      const itemTotal = item.quantity * item.unitPrice;
      const taxAmount = (itemTotal * item.taxRate) / 100;
      const total = itemTotal + taxAmount;
      
      const itemData = {
        id: item.id || uuidv4(),
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate || 0,
        amount: total
      };
      
      console.log("Saving item:", itemData);
      
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert([itemData]);
      
      if (itemError) {
        console.error('Error saving invoice item:', itemError);
        throw itemError;
      }
    }
    
    console.log("All invoice items saved successfully");
    
    // Return the saved invoice with updated ID
    return {
      ...invoice,
      id: invoiceId
    };
  } catch (error) {
    console.error('Error in saveInvoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    // First delete the invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (itemsError) {
      console.error('Error deleting invoice items:', itemsError);
      throw itemsError;
    }
    
    // Then delete the invoice itself
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    throw error;
  }
};
