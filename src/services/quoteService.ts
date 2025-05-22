
import { supabase } from "@/integrations/supabase/client";
import { Quote, InvoiceItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

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
      const client = {
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
