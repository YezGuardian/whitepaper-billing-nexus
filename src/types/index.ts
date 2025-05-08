
export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address: string;
  vatNumber?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  client: Client;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  recurrence?: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextGenerationDate?: Date;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  client: Client;
  issueDate: Date;
  expiryDate: Date;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  website: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    branchCode: string;
    accountType: string;
  };
  invoicePrefix: string;
  quotePrefix: string;
  invoiceTerms: string;
  quoteTerms: string;
}
