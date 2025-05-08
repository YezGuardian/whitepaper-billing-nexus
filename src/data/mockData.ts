
import { Client, Invoice, Quote, User, CompanySettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';

// Mock company settings
export const companySettings: CompanySettings = {
  name: 'White Paper Systems',
  email: 'systems@whitepaperconcepts.co.za',
  phone: '+27 (0) 87 265 1890',
  address: 'South Africa',
  vatNumber: 'ZA123456789',
  website: 'www.whitepaperconcepts.co.za',
  bankDetails: {
    bankName: 'First National Bank',
    accountNumber: '12345678910',
    branchCode: '250655',
    accountType: 'Business Account',
  },
  invoicePrefix: 'INV-',
  quotePrefix: 'QTE-',
  invoiceTerms: 'Payment is due within 30 days from the invoice date.',
  quoteTerms: 'This quote is valid for 30 days from the issue date.',
};

// Mock users
export const users: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@whitepaperconcepts.co.za',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Staff User',
    email: 'staff@whitepaperconcepts.co.za',
    role: 'staff',
  },
];

// Mock clients
export const clients: Client[] = [
  {
    id: '1',
    name: 'ABC Corporation',
    contactPerson: 'John Smith',
    email: 'john@abccorp.co.za',
    phone: '+27 11 123 4567',
    address: '123 Main Street, Johannesburg, 2000, South Africa',
    vatNumber: 'ZA456789012',
  },
  {
    id: '2',
    name: 'XYZ Limited',
    contactPerson: 'Jane Doe',
    email: 'jane@xyzlimited.co.za',
    phone: '+27 21 987 6543',
    address: '456 Oak Avenue, Cape Town, 8001, South Africa',
    vatNumber: 'ZA987654321',
  },
  {
    id: '3',
    name: 'Tech Solutions',
    contactPerson: 'Mike Johnson',
    email: 'mike@techsolutions.co.za',
    phone: '+27 31 456 7890',
    address: '789 Pine Road, Durban, 4001, South Africa',
    vatNumber: 'ZA654321987',
  },
];

// Helper function to create invoice items
const createInvoiceItems = (count: number) => {
  const items = [];
  const taxRate = 15; // 15% VAT in South Africa
  
  for (let i = 0; i < count; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = Math.floor(Math.random() * 1000) + 100;
    const total = quantity * unitPrice;
    const taxAmount = (total * taxRate) / 100;
    
    items.push({
      id: uuidv4(),
      description: `Service Item ${i + 1}`,
      quantity,
      unitPrice,
      taxRate,
      taxAmount,
      total: total + taxAmount,
    });
  }
  
  return items;
};

// Calculate invoice/quote totals
const calculateTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxTotal = items.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + taxTotal;
  
  return { subtotal, taxTotal, total };
};

// Mock invoices
export const invoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2023-001',
    client: clients[0],
    issueDate: new Date('2023-05-01'),
    dueDate: new Date('2023-05-31'),
    items: createInvoiceItems(3),
    notes: 'Thank you for your business.',
    terms: companySettings.invoiceTerms,
    ...calculateTotals(createInvoiceItems(3)),
    status: 'paid',
    recurrence: 'monthly',
    nextGenerationDate: new Date('2023-06-01'),
  },
  {
    id: '2',
    invoiceNumber: 'INV-2023-002',
    client: clients[1],
    issueDate: new Date('2023-05-15'),
    dueDate: new Date('2023-06-14'),
    items: createInvoiceItems(2),
    notes: 'Please pay by the due date.',
    terms: companySettings.invoiceTerms,
    ...calculateTotals(createInvoiceItems(2)),
    status: 'sent',
    recurrence: 'none',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2023-003',
    client: clients[2],
    issueDate: new Date(),
    dueDate: addDays(new Date(), 30),
    items: createInvoiceItems(4),
    terms: companySettings.invoiceTerms,
    ...calculateTotals(createInvoiceItems(4)),
    status: 'draft',
    recurrence: 'quarterly',
    nextGenerationDate: addDays(new Date(), 90),
  },
];

// Mock quotes
export const quotes: Quote[] = [
  {
    id: '1',
    quoteNumber: 'QTE-2023-001',
    client: clients[0],
    issueDate: new Date('2023-05-01'),
    expiryDate: new Date('2023-05-31'),
    items: createInvoiceItems(3),
    notes: 'Please confirm acceptance by the expiry date.',
    terms: companySettings.quoteTerms,
    ...calculateTotals(createInvoiceItems(3)),
    status: 'accepted',
  },
  {
    id: '2',
    quoteNumber: 'QTE-2023-002',
    client: clients[1],
    issueDate: new Date('2023-05-15'),
    expiryDate: new Date('2023-06-14'),
    items: createInvoiceItems(2),
    terms: companySettings.quoteTerms,
    ...calculateTotals(createInvoiceItems(2)),
    status: 'sent',
  },
  {
    id: '3',
    quoteNumber: 'QTE-2023-003',
    client: clients[2],
    issueDate: new Date(),
    expiryDate: addDays(new Date(), 30),
    items: createInvoiceItems(4),
    notes: 'Detailed project scope attached.',
    terms: companySettings.quoteTerms,
    ...calculateTotals(createInvoiceItems(4)),
    status: 'draft',
  },
];
