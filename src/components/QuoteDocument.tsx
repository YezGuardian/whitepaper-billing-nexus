
import React from 'react';
import { format } from 'date-fns';
import { Quote } from '@/types';

interface QuoteDocumentProps {
  quote: Quote;
  companySettings?: any; // Add company settings prop
}

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote, companySettings }) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `R ${amount.toFixed(2)}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  return (
    <div className="bg-white p-8">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          {companySettings ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800">{companySettings.name}</h1>
              <p className="text-gray-600">{companySettings.address}</p>
              <p className="text-gray-600">{companySettings.email}</p>
              <p className="text-gray-600">{companySettings.phone}</p>
              {companySettings.vatNumber && (
                <p className="text-gray-600">VAT: {companySettings.vatNumber}</p>
              )}
              {companySettings.website && (
                <p className="text-gray-600">{companySettings.website}</p>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800">Company Name</h1>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800">QUOTE</h1>
          <p className="text-xl text-gray-600">#{quote.quoteNumber}</p>
        </div>
      </div>

      {/* Client and Quote Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-gray-600 font-semibold mb-2">Bill To:</h2>
          <h3 className="font-bold text-gray-800">{quote.client.name}</h3>
          {quote.client.contactPerson && <p>{quote.client.contactPerson}</p>}
          <p className="text-gray-600">{quote.client.address}</p>
          <p className="text-gray-600">{quote.client.email}</p>
          {quote.client.phone && <p className="text-gray-600">{quote.client.phone}</p>}
          {quote.client.vatNumber && (
            <p className="text-gray-600">VAT: {quote.client.vatNumber}</p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-gray-600 font-semibold">Issue Date:</span>
            <span className="ml-2">{formatDate(quote.issueDate)}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-600 font-semibold">Expiry Date:</span>
            <span className="ml-2">{formatDate(quote.expiryDate)}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-600 font-semibold">Status:</span>
            <span className="ml-2 capitalize">{quote.status}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <table className="min-w-full bg-white mb-8">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-600">
            <th className="py-2 px-4 font-semibold">Description</th>
            <th className="py-2 px-4 font-semibold text-right">Qty</th>
            <th className="py-2 px-4 font-semibold text-right">Unit Price</th>
            <th className="py-2 px-4 font-semibold text-right">Tax</th>
            <th className="py-2 px-4 font-semibold text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {quote.items.map((item) => (
            <tr key={item.id} className="text-gray-800">
              <td className="py-2 px-4">{item.description}</td>
              <td className="py-2 px-4 text-right">{item.quantity}</td>
              <td className="py-2 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-2 px-4 text-right">{item.taxRate}%</td>
              <td className="py-2 px-4 text-right">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Tax:</span>
            <span>{formatCurrency(quote.taxTotal)}</span>
          </div>
          <div className="flex justify-between py-1 font-bold border-t border-gray-200 pt-2">
            <span>Total:</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Terms and Notes */}
      {quote.terms && (
        <div className="mb-4">
          <h3 className="text-gray-600 font-semibold mb-2">Terms & Conditions</h3>
          <p className="text-gray-600 whitespace-pre-line">{quote.terms}</p>
        </div>
      )}

      {quote.notes && (
        <div>
          <h3 className="text-gray-600 font-semibold mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-line">{quote.notes}</p>
        </div>
      )}

      {/* Bank Details */}
      {companySettings && companySettings.bankDetails && companySettings.bankDetails.bankName && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <h3 className="text-gray-600 font-semibold mb-2">Bank Details</h3>
          <p className="text-gray-600">Bank: {companySettings.bankDetails.bankName}</p>
          <p className="text-gray-600">Account Number: {companySettings.bankDetails.accountNumber}</p>
          <p className="text-gray-600">Branch Code: {companySettings.bankDetails.branchCode}</p>
          <p className="text-gray-600">Account Type: {companySettings.bankDetails.accountType}</p>
        </div>
      )}
    </div>
  );
};

export default QuoteDocument;
