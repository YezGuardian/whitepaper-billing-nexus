import { supabase } from '@/integrations/supabase/client';
import { Client, Invoice, InvoiceItem, Quote, CompanySettings, User } from '@/types';

// ----- Client Services -----
export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*');
  
  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
  
  return data as Client[];
};

export const getClient = async (id: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
  
  return data as Client;
};

export const createClient = async (client: Omit<Client, 'id'>) => {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select();
  
  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }
  
  return data[0] as Client;
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }
  
  return data[0] as Client;
};

export const deleteClient = async (id: string) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// ----- Invoice Services -----
export const getInvoices = async () => {
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
  
  // Transform data to match the frontend model
  const transformedData = data.map(invoice => ({
    ...invoice,
    client: invoice.client,
    invoiceNumber: invoice.invoice_number,
    items: [], // Will be populated separately
    issueDate: new Date(invoice.issue_date),
    dueDate: new Date(invoice.due_date),
    subtotal: 0, // Will be calculated from items
    taxTotal: 0, // Will be calculated from items
    total: invoice.total_amount,
    notes: invoice.notes || undefined,
    terms: invoice.terms || undefined,
    nextGenerationDate: invoice.recurrence !== 'none' ? new Date() : undefined, // This should be fetched or calculated
  }));
  
  return transformedData as unknown as Invoice[];
};

export const getInvoiceItems = async (invoiceId: string) => {
  const { data, error } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);
  
  if (error) {
    console.error('Error fetching invoice items:', error);
    throw error;
  }
  
  // Transform data to match the frontend model
  const transformedData = data.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    taxRate: item.tax_rate || 0,
    taxAmount: (item.quantity * item.unit_price * (item.tax_rate || 0)) / 100,
    total: item.amount,
  }));
  
  return transformedData as InvoiceItem[];
};

export const getInvoiceWithItems = async (id: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      client:client_id (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
  
  const items = await getInvoiceItems(id);
  
  // Calculate subtotal and tax total
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
  
  // Transform data to match the frontend model
  const transformedData = {
    ...data,
    client: data.client,
    invoiceNumber: data.invoice_number,
    items,
    issueDate: new Date(data.issue_date),
    dueDate: new Date(data.due_date),
    subtotal,
    taxTotal,
    total: data.total_amount,
    notes: data.notes || undefined,
    terms: data.terms || undefined,
    nextGenerationDate: data.recurrence !== 'none' ? new Date() : undefined, // This should be fetched or calculated
  };
  
  return transformedData as unknown as Invoice;
};

// Create or update an invoice with its items
export const saveInvoice = async (invoice: Omit<Invoice, 'id'> & { id?: string }) => {
  // Start a Supabase transaction
  const { data: createdInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .upsert({
      id: invoice.id,
      client_id: invoice.client.id,
      invoice_number: invoice.invoiceNumber,
      issue_date: invoice.issueDate.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      status: invoice.status,
      notes: invoice.notes,
      terms: invoice.terms,
      recurrence: invoice.recurrence,
      total_amount: invoice.total,
    })
    .select()
    .single();
  
  if (invoiceError) {
    console.error('Error saving invoice:', invoiceError);
    throw invoiceError;
  }

  // Save invoice items
  if (invoice.items.length > 0) {
    // If updating, first delete existing items
    if (invoice.id) {
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);
    }
    
    // Insert new items
    const itemsToInsert = invoice.items.map(item => ({
      invoice_id: createdInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      amount: item.total,
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);
      
    if (itemsError) {
      console.error('Error saving invoice items:', itemsError);
      throw itemsError;
    }
  }
  
  return getInvoiceWithItems(createdInvoice.id);
};

export const deleteInvoice = async (id: string) => {
  // First delete associated items due to foreign key constraint
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id);
    
  if (itemsError) {
    console.error('Error deleting invoice items:', itemsError);
    throw itemsError;
  }
  
  // Then delete the invoice
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

// ----- Quote Services -----
export const getQuotes = async () => {
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
  
  // Transform data to match the frontend model (similar to invoices)
  const transformedData = data.map(quote => ({
    ...quote,
    client: quote.client,
    quoteNumber: quote.quote_number,
    items: [], // Would need to be populated if we had a quote_items table
    issueDate: new Date(quote.issue_date),
    expiryDate: new Date(quote.expiry_date),
    subtotal: 0, // Would need to be calculated from items
    taxTotal: 0, // Would need to be calculated from items
    total: quote.total_amount,
    notes: quote.notes || undefined,
    terms: quote.terms || undefined,
  }));
  
  return transformedData as unknown as Quote[];
};

// Similar getQuoteWithItems and saveQuote functions would be needed, 
// following the invoice pattern if we had a quote_items table

// ----- Company Settings Services -----
export const getCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, create default
      return createDefaultCompanySettings();
    }
    console.error('Error fetching company settings:', error);
    throw error;
  }
  
  // Transform to match frontend model
  const settings: CompanySettings = {
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
    quoteTerms: data.quote_terms || '',
  };
  
  return settings;
};

const createDefaultCompanySettings = async () => {
  const defaultSettings = {
    company_name: 'Your Company',
    company_email: 'contact@yourcompany.com',
    company_address: 'Your Company Address',
    invoice_prefix: 'INV',
    quote_prefix: 'QT',
  };
  
  const { data, error } = await supabase
    .from('company_settings')
    .insert(defaultSettings)
    .select()
    .single();
    
  if (error) {
    console.error('Error creating default company settings:', error);
    throw error;
  }
  
  return getCompanySettings();
};

export const updateCompanySettings = async (settings: CompanySettings) => {
  const { error } = await supabase
    .from('company_settings')
    .update({
      company_name: settings.name,
      company_email: settings.email,
      company_phone: settings.phone,
      company_address: settings.address,
      company_vat_number: settings.vatNumber,
      company_website: settings.website,
      bank_name: settings.bankDetails.bankName,
      bank_account_number: settings.bankDetails.accountNumber,
      bank_branch_code: settings.bankDetails.branchCode,
      bank_account_type: settings.bankDetails.accountType,
      invoice_prefix: settings.invoicePrefix,
      quote_prefix: settings.quotePrefix,
      invoice_terms: settings.invoiceTerms,
      quote_terms: settings.quoteTerms,
    })
    .eq('id', '1'); // Convert number to string to match expected type
    
  if (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
  
  return getCompanySettings();
};
