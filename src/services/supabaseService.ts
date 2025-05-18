import { supabase } from '@/integrations/supabase/client';
import { Client, Invoice, InvoiceItem, Quote, CompanySettings, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ----- Client Services -----
export const getClients = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*');
  
  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
  
  // Convert database model to frontend model
  const clients: Client[] = data.map(client => ({
    id: client.id,
    name: client.name,
    contactPerson: client.contact_person || undefined,
    email: client.email,
    phone: client.phone || undefined,
    address: client.address,
    vatNumber: client.vat_number || undefined
  }));
  
  return clients;
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
  
  // Convert database model to frontend model
  const client: Client = {
    id: data.id,
    name: data.name,
    contactPerson: data.contact_person || undefined,
    email: data.email,
    phone: data.phone || undefined,
    address: data.address,
    vatNumber: data.vat_number || undefined
  };
  
  return client;
};

export const createClient = async (client: Omit<Client, 'id'> & { id?: string }) => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      id: client.id || uuidv4(),
      name: client.name,
      contact_person: client.contactPerson || null,
      email: client.email,
      phone: client.phone || null,
      address: client.address,
      vat_number: client.vatNumber || null
    })
    .select();
  
  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }
  
  // Convert database model to frontend model
  const createdClient: Client = {
    id: data[0].id,
    name: data[0].name,
    contactPerson: data[0].contact_person || undefined,
    email: data[0].email,
    phone: data[0].phone || undefined,
    address: data[0].address,
    vatNumber: data[0].vat_number || undefined
  };
  
  return createdClient;
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: updates.name,
      contact_person: updates.contactPerson || null,
      email: updates.email,
      phone: updates.phone || null,
      address: updates.address,
      vat_number: updates.vatNumber || null
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }
  
  // Convert database model to frontend model
  const updatedClient: Client = {
    id: data[0].id,
    name: data[0].name,
    contactPerson: data[0].contact_person || undefined,
    email: data[0].email,
    phone: data[0].phone || undefined,
    address: data[0].address,
    vatNumber: data[0].vat_number || undefined
  };
  
  return updatedClient;
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
    const items: InvoiceItem[] = itemsData.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      taxRate: Number(item.tax_rate || 0),
      taxAmount: (item.quantity * Number(item.unit_price) * Number(item.tax_rate || 0)) / 100,
      total: Number(item.amount)
    }));
    
    // Calculate subtotal and tax total
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
    
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
      recurrence: invoice.recurrence as any || 'none',
      nextGenerationDate: invoice.recurrence && invoice.recurrence !== 'none' ? new Date() : undefined
    });
  }
  
  return invoices;
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
  
  // Fetch items for this invoice
  const { data: itemsData, error: itemsError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id);
    
  if (itemsError) {
    console.error('Error fetching invoice items:', itemsError);
    throw itemsError;
  }
  
  // Transform items to match frontend model
  const items: InvoiceItem[] = itemsData.map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity,
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate || 0),
    taxAmount: (item.quantity * Number(item.unit_price) * Number(item.tax_rate || 0)) / 100,
    total: Number(item.amount)
  }));
  
  // Calculate subtotal and tax total
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
  
  // Convert client from database model to frontend model
  const client: Client = {
    id: data.client.id,
    name: data.client.name,
    contactPerson: data.client.contact_person || undefined,
    email: data.client.email,
    phone: data.client.phone || undefined,
    address: data.client.address,
    vatNumber: data.client.vat_number || undefined
  };
  
  // Create the invoice object
  const invoice: Invoice = {
    id: data.id,
    invoiceNumber: data.invoice_number,
    client,
    issueDate: new Date(data.issue_date),
    dueDate: new Date(data.due_date),
    items,
    notes: data.notes || undefined,
    terms: data.terms || undefined,
    subtotal,
    taxTotal,
    total: Number(data.total_amount),
    status: data.status as any,
    recurrence: data.recurrence as any || 'none',
    nextGenerationDate: data.recurrence && data.recurrence !== 'none' ? new Date() : undefined
  };
  
  return invoice;
};

// Create or update an invoice with its items
export const saveInvoice = async (invoice: Omit<Invoice, 'id'> & { id?: string }) => {
  const id = invoice.id || uuidv4();
  
  // Convert dates to ISO string for storage
  const issueDateISO = invoice.issueDate instanceof Date 
    ? invoice.issueDate.toISOString().split('T')[0] 
    : new Date(invoice.issueDate).toISOString().split('T')[0];
    
  const dueDateISO = invoice.dueDate instanceof Date 
    ? invoice.dueDate.toISOString().split('T')[0] 
    : new Date(invoice.dueDate).toISOString().split('T')[0];
  
  // Start a transaction
  const { data: createdInvoice, error: invoiceError } = await supabase
    .from('invoices')
    .upsert({
      id,
      client_id: invoice.client.id,
      invoice_number: invoice.invoiceNumber,
      issue_date: issueDateISO,
      due_date: dueDateISO,
      status: invoice.status,
      notes: invoice.notes || null,
      terms: invoice.terms || null,
      recurrence: invoice.recurrence || 'none',
      total_amount: Number(invoice.total) // Fix: Ensure total is a number
    })
    .select();
  
  if (invoiceError) {
    console.error('Error saving invoice:', invoiceError);
    throw invoiceError;
  }

  // If updating, first delete existing items
  if (invoice.id) {
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoice.id);
    
    if (deleteError) {
      console.error('Error deleting invoice items:', deleteError);
      throw deleteError;
    }
  }
  
  // Insert new items
  if (invoice.items.length > 0) {
    const itemsToInsert = invoice.items.map(item => ({
      id: item.id || uuidv4(),
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || null,
      amount: item.total
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);
      
    if (itemsError) {
      console.error('Error saving invoice items:', itemsError);
      throw itemsError;
    }
  }
  
  // Return the complete invoice with items
  return getInvoiceWithItems(id);
};

export const deleteInvoice = async (id: string) => {
  // Note: We have added ON DELETE CASCADE to the foreign key, so this should delete related items
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
};

export const saveQuote = async (quote: Omit<Quote, 'id'> & { id?: string }) => {
  const id = quote.id || uuidv4();
  
  // Convert dates to ISO string for storage
  const issueDateISO = quote.issueDate instanceof Date 
    ? quote.issueDate.toISOString().split('T')[0] 
    : new Date(quote.issueDate).toISOString().split('T')[0];
    
  const expiryDateISO = quote.expiryDate instanceof Date 
    ? quote.expiryDate.toISOString().split('T')[0] 
    : new Date(quote.expiryDate).toISOString().split('T')[0];
  
  // First save the quote
  const { data, error } = await supabase
    .from('quotes')
    .upsert({
      id,
      client_id: quote.client.id,
      quote_number: quote.quoteNumber,
      issue_date: issueDateISO,
      expiry_date: expiryDateISO,
      status: quote.status,
      notes: quote.notes || null,
      terms: quote.terms || null,
      total_amount: Number(quote.total) // Ensure total is a number
    })
    .select();
  
  if (error) {
    console.error('Error saving quote:', error);
    throw error;
  }
  
  // If updating, first delete existing items
  if (quote.id) {
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', quote.id);
    
    if (deleteError) {
      console.error('Error deleting quote items:', deleteError);
      throw deleteError;
    }
  }
  
  // Insert new items
  if (quote.items.length > 0) {
    const itemsToInsert = quote.items.map(item => ({
      id: item.id || uuidv4(),
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate || null,
      amount: item.total
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);
      
    if (itemsError) {
      console.error('Error saving quote items:', itemsError);
      throw itemsError;
    }
  }
  
  // Return the saved quote with its items
  const savedQuote: Quote = {
    id,
    quoteNumber: quote.quoteNumber,
    client: quote.client,
    issueDate: new Date(issueDateISO),
    expiryDate: new Date(expiryDateISO),
    items: quote.items,
    notes: quote.notes,
    terms: quote.terms,
    subtotal: quote.subtotal,
    taxTotal: quote.taxTotal,
    total: quote.total,
    status: quote.status
  };
  
  return savedQuote;
};

export const deleteQuote = async (id: string) => {
  // First delete related items
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id);
  
  if (itemsError) {
    console.error('Error deleting quote items:', itemsError);
    // Continue anyway to try to delete the quote
  }
  
  // Then delete the quote
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
};

// ----- Company Settings Services -----
export const getCompanySettings = async () => {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*');
    
    if (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
    
    // If no settings exist, create default
    if (data.length === 0) {
      return createDefaultCompanySettings();
    }
    
    // Transform to match frontend model
    const settings: CompanySettings = {
      name: data[0].company_name,
      email: data[0].company_email,
      phone: data[0].company_phone || '',
      address: data[0].company_address,
      vatNumber: data[0].company_vat_number || '',
      website: data[0].company_website || '',
      bankDetails: {
        bankName: data[0].bank_name || '',
        accountNumber: data[0].bank_account_number || '',
        branchCode: data[0].bank_branch_code || '',
        accountType: data[0].bank_account_type || '',
      },
      invoicePrefix: data[0].invoice_prefix,
      quotePrefix: data[0].quote_prefix,
      invoiceTerms: data[0].invoice_terms || '',
      quoteTerms: data[0].quote_terms || '',
    };
    
    return settings;
  } catch (error) {
    console.error('Error in getCompanySettings:', error);
    // Return default settings as fallback
    return {
      name: 'Your Company',
      email: 'contact@yourcompany.com',
      phone: '',
      address: 'Your Company Address',
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
      quoteTerms: '',
    };
  }
};

const createDefaultCompanySettings = async () => {
  try {
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
      .select();
      
    if (error) {
      console.error('Error creating default company settings:', error);
      throw error;
    }
    
    // Transform to match frontend model
    const settings: CompanySettings = {
      name: defaultSettings.company_name,
      email: defaultSettings.company_email,
      phone: '',
      address: defaultSettings.company_address,
      vatNumber: '',
      website: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        branchCode: '',
        accountType: '',
      },
      invoicePrefix: defaultSettings.invoice_prefix,
      quotePrefix: defaultSettings.quote_prefix,
      invoiceTerms: '',
      quoteTerms: '',
    };
    
    return settings;
  } catch (error) {
    console.error('Error in createDefaultCompanySettings:', error);
    // Return default settings object as fallback
    return {
      name: 'Your Company',
      email: 'contact@yourcompany.com',
      phone: '',
      address: 'Your Company Address',
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
      quoteTerms: '',
    };
  }
};

export const updateCompanySettings = async (settings: CompanySettings) => {
  const { data, error } = await supabase
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
    .eq('id', '1')
    .select();
    
  if (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
  
  // Return the updated settings
  return settings;
};
