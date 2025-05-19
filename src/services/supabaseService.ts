
export const getQuotes = async () => {
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
