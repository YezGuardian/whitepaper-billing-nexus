
import { format } from 'date-fns';
import { Invoice } from '@/types';
import Logo from './Logo';
import { companySettings } from '@/data/mockData';

interface InvoiceDocumentProps {
  invoice: Invoice;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ invoice }) => {
  return (
    <div className="pdf-content bg-white p-8 shadow-lg rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-4">
            <img 
              src="/lovable-uploads/a5faa576-4cfa-4071-863c-5cfac82a795f.png" 
              alt="White Paper Systems Logo" 
              className="h-16 w-auto" 
              crossOrigin="anonymous" // Add crossOrigin attribute for CORS images
            />
          </div>
          <div className="mt-4">
            <div className="font-bold">{companySettings.name}</div>
            <div className="text-sm text-gray-500 whitespace-pre-line">{companySettings.address}</div>
            <div className="text-sm text-gray-500">{companySettings.phone}</div>
            <div className="text-sm text-gray-500">{companySettings.email}</div>
            <div className="text-sm text-gray-500">{companySettings.website}</div>
            <div className="text-sm text-gray-500">VAT: {companySettings.vatNumber}</div>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-wps-blue">INVOICE</h1>
          <div className="mt-1 text-gray-500">#{invoice.invoiceNumber}</div>
          <div className="mt-4">
            <div className="text-sm">
              <span className="font-medium">Issue Date:</span>{' '}
              {format(new Date(invoice.issueDate), 'dd MMM yyyy')}
            </div>
            <div className="text-sm">
              <span className="font-medium">Due Date:</span>{' '}
              {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
            </div>
            <div className="text-sm font-medium mt-1">
              Status: <span className="uppercase">{invoice.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-wps-blue">Bill To</h2>
        <div className="mt-2">
          <div className="font-medium">{invoice.client.name}</div>
          {invoice.client.contactPerson && (
            <div className="text-sm text-gray-500">Attn: {invoice.client.contactPerson}</div>
          )}
          <div className="text-sm text-gray-500 whitespace-pre-line">{invoice.client.address}</div>
          <div className="text-sm text-gray-500">{invoice.client.email}</div>
          {invoice.client.phone && (
            <div className="text-sm text-gray-500">{invoice.client.phone}</div>
          )}
          {invoice.client.vatNumber && (
            <div className="text-sm text-gray-500">VAT: {invoice.client.vatNumber}</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-wps-blue text-white">
              <th className="py-2 px-4 text-left">Description</th>
              <th className="py-2 px-4 text-right">Quantity</th>
              <th className="py-2 px-4 text-right">Unit Price</th>
              <th className="py-2 px-4 text-right">Tax</th>
              <th className="py-2 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 text-left">{item.description}</td>
                <td className="py-2 px-4 text-right">{item.quantity}</td>
                <td className="py-2 px-4 text-right">R {item.unitPrice.toFixed(2)}</td>
                <td className="py-2 px-4 text-right">{item.taxRate}%</td>
                <td className="py-2 px-4 text-right">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t">
            <tr>
              <td colSpan={4} className="py-2 px-4 text-right font-medium">Subtotal</td>
              <td className="py-2 px-4 text-right">R {invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="py-2 px-4 text-right font-medium">VAT</td>
              <td className="py-2 px-4 text-right">R {invoice.taxTotal.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-100">
              <td colSpan={4} className="py-2 px-4 text-right font-bold">Total</td>
              <td className="py-2 px-4 text-right font-bold">R {invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="mt-8 space-y-4">
          {invoice.notes && (
            <div>
              <h3 className="font-medium text-wps-blue">Notes</h3>
              <p className="text-sm text-gray-500 mt-1">{invoice.notes}</p>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h3 className="font-medium text-wps-blue">Terms & Conditions</h3>
              <p className="text-sm text-gray-500 mt-1">{invoice.terms}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-medium text-wps-blue">Payment Details</h3>
        <div className="mt-1 text-sm text-gray-500">
          <div>Bank: {companySettings.bankDetails.bankName}</div>
          <div>Account Number: {companySettings.bankDetails.accountNumber}</div>
          <div>Branch Code: {companySettings.bankDetails.branchCode}</div>
          <div>Account Type: {companySettings.bankDetails.accountType}</div>
          <div className="mt-2">Please use the invoice number as reference when making payment.</div>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-gray-500">
        Thank you for your business!
      </div>
      
      <div className="mt-4 text-center">
        <img 
          src="/lovable-uploads/904b88b4-0095-4691-a6d5-af01f553ac8e.png" 
          alt="Signature" 
          className="inline-block h-12" 
          crossOrigin="anonymous" // Add crossOrigin attribute for CORS images
        />
      </div>
    </div>
  );
};

export default InvoiceDocument;
