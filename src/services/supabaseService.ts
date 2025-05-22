
import { supabase } from "@/integrations/supabase/client";
import { Client, CompanySettings, Invoice, InvoiceItem, Quote } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Company Settings
export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
    
    if (!data) {
      // Return default settings if no data found
      return {
        name: '',
        email: '',
        phone: '',
        address: '',
        vatNumber: '',
        website: '',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          branchCode: '',
          accountType: '',
        },
        invoicePrefix: 'INV',
        quotePrefix: 'QT',
        invoiceTerms: '',
        quoteTerms: ''
      };
    }
    
    return {
      name: data.company_name,
      email: data.company_email,
      phone: data.company_phone || '',
      address: data.company_address,
      vatNumber: data.company_vat_number || '',
      website: data.company_website || '',
      bankDetails: {
        bankName: data.bank_name || '',
        accountNumber: data.bank_account_number || '',
        branchCode: data.bank_branch_code || '',
        accountType: data.bank_account_type || '',
      },
      invoicePrefix: data.invoice_prefix,
      quotePrefix: data.quote_prefix,
      invoiceTerms: data.invoice_terms || '',
      quoteTerms: data.quote_terms || ''
    };
  } catch (error) {
    console.error('Error in getCompanySettings:', error);
    throw error;
  }
};

export const updateCompanySettings = async (settings: CompanySettings): Promise<CompanySettings> => {
  try {
    const { data: existingData } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    const dbData = {
      company_name: settings.name,
      company_email: settings.email,
      company_phone: settings.phone,
      company_address: settings.address,
      company_vat_number: settings.vatNumber,
      company_website: settings.website,
      bank_name: settings.bankDetails?.bankName,
      bank_account_number: settings.bankDetails?.accountNumber,
      bank_branch_code: settings.bankDetails?.branchCode,
      bank_account_type: settings.bankDetails?.accountType,
      invoice_prefix: settings.invoicePrefix,
      quote_prefix: settings.quotePrefix,
      invoice_terms: settings.invoiceTerms,
      quote_terms: settings.quoteTerms
    };

    let result;
    
    if (existingData) {
      // Update existing settings
      const { data, error } = await supabase
        .from('company_settings')
        .update(dbData)
        .eq('id', existingData.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating company settings:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('company_settings')
        .insert([dbData])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting company settings:', error);
        throw error;
      }
      
      result = data;
    }
    
    return settings;
  } catch (error) {
    console.error('Error in updateCompanySettings:', error);
    throw error;
  }
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform data to match the frontend model
    return data.map(client => ({
      id: client.id,
      name: client.name,
      contactPerson: client.contact_person || undefined,
      email: client.email,
      phone: client.phone || undefined,
      address: client.address,
      vatNumber: client.vat_number || undefined
    }));
  } catch (error) {
    console.error('Error in getClients:', error);
    return [];
  }
};

export const createClient = async (client: Client): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        id: client.id,
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        vat_number: client.vatNumber
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address,
      vatNumber: data.vat_number || undefined
    };
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
};

export const updateClient = async (id: string, client: Client): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        vat_number: client.vatNumber
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person || undefined,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address,
      vatNumber: data.vat_number || undefined
    };
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteClient:', error);
    throw error;
  }
};

// Quotes
export const getQuotes = async (): Promise<Quote[]> => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:client_id (*)
      `);
    
    if (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform data to match the frontend model
    const quotes: Quote[] = [];
    
    for (const quote of data) {
      // Fetch items for this quote
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', quote.id);
        
      if (itemsError) {
        console.error('Error fetching quote items:', itemsError);
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
      if (!quote.client) {
        console.error('Client data missing for quote:', quote.id);
        continue;
      }
      
      // Convert client from database model to frontend model
      const client: Client = {
        id: quote.client.id,
        name: quote.client.name,
        contactPerson: quote.client.contact_person || undefined,
        email: quote.client.email,
        phone: quote.client.phone || undefined,
        address: quote.client.address,
        vatNumber: quote.client.vat_number || undefined
      };
      
      // Create the quote object
      quotes.push({
        id: quote.id,
        quoteNumber: quote.quote_number,
        client,
        issueDate: new Date(quote.issue_date),
        expiryDate: new Date(quote.expiry_date),
        items,
        notes: quote.notes || undefined,
        terms: quote.terms || undefined,
        subtotal,
        taxTotal,
        total: Number(quote.total_amount),
        status: quote.status as any
      });
    }
    
    return quotes;
  } catch (error) {
    console.error('Error in getQuotes:', error);
    return [];
  }
};

export const saveQuote = async (quote: Quote): Promise<Quote> => {
  try {
    // Determine if this is a new quote or an update
    const isNewQuote = !quote.id;
    const quoteId = isNewQuote ? uuidv4() : quote.id;
    
    // Prepare the quote data for database
    const quoteData = {
      id: quoteId,
      quote_number: quote.quoteNumber,
      client_id: quote.client.id,
      issue_date: new Date(quote.issueDate).toISOString().split('T')[0],
      expiry_date: new Date(quote.expiryDate).toISOString().split('T')[0],
      total_amount: quote.total,
      notes: quote.notes || null,
      terms: quote.terms || null,
      status: quote.status
    };
    
    // Save the quote
    if (isNewQuote) {
      const { error: insertError } = await supabase
        .from('quotes')
        .insert([quoteData]);
      
      if (insertError) {
        console.error('Error creating quote:', insertError);
        throw insertError;
      }
    } else {
      const { error: updateError } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', quoteId);
      
      if (updateError) {
        console.error('Error updating quote:', updateError);
        throw updateError;
      }
      
      // Delete existing items for this quote to recreate them
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', quoteId);
      
      if (deleteError) {
        console.error('Error deleting quote items:', deleteError);
        throw deleteError;
      }
    }

    console.log('Quote saved successfully, now saving items...');
    
    // Save the quote items one by one to avoid batch issues
    for (const item of quote.items) {
      const itemData = {
        id: item.id || uuidv4(),
        invoice_id: quoteId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate,
        amount: item.total || (item.quantity * item.unitPrice * (1 + item.taxRate / 100))
      };
      
      // Insert each item individually
      const { error } = await supabase
        .from('invoice_items')
        .insert([itemData]);
      
      if (error) {
        console.error('Error saving quote item:', error);
        throw error;
      }
    }
    
    console.log('All quote items saved successfully');
    
    // Return the saved quote with updated ID
    return {
      ...quote,
      id: quoteId
    };
  } catch (error) {
    console.error('Error in saveQuote:', error);
    throw error;
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  try {
    // First delete the quote items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);
    
    if (itemsError) {
      console.error('Error deleting quote items:', itemsError);
      throw itemsError;
    }
    
    // Then delete the quote itself
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteQuote:', error);
    throw error;
  }
};

// Invoices
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
      const client: Client = {
        id: invoice.client.id,
        name: invoice.client.name,
        contactPerson: invoice.client.contact_person || undefined,
        email: invoice.client.email,
        phone: invoice.client.phone || undefined,
        address: invoice.client.address,
        vatNumber: invoice.client.vat_number || undefined
      };
      
      // Cast the invoice to include any to handle potential type mismatches
      const invoiceData = invoice as any;
      
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
        // Remove the nextGenerationDate since it's causing issues
        nextGenerationDate: undefined
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
