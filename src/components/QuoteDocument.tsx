
import { format } from 'date-fns';
import { Quote } from '@/types';
import Logo from './Logo';
import { getCompanySettings } from '@/services/supabaseService';
import { useState, useEffect } from 'react';
import { CompanySettings } from '@/types';

interface QuoteDocumentProps {
  quote: Quote;
}

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getCompanySettings();
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  if (!quote) {
    return <div className="p-8">Loading quote data...</div>;
  }
  
  if (!companySettings) {
    return <div className="p-8">Loading company information...</div>;
  }

  return (
    <div className="pdf-content bg-white p-8 shadow-lg rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-4">
            <img 
              src="/lovable-uploads/a5faa576-4cfa-4071-863c-5cfac82a795f.png" 
              alt="Company Logo" 
              className="h-16 w-auto" 
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
          <h1 className="text-2xl font-bold text-wps-blue">QUOTATION</h1>
          <div className="mt-1 text-gray-500">#{quote.quoteNumber}</div>
          <div className="mt-4">
            <div className="text-sm">
              <span className="font-medium">Issue Date:</span>{' '}
              {format(new Date(quote.issueDate), 'dd MMM yyyy')}
            </div>
            <div className="text-sm">
              <span className="font-medium">Expiry Date:</span>{' '}
              {format(new Date(quote.expiryDate), 'dd MMM yyyy')}
            </div>
            <div className="text-sm font-medium mt-1">
              Status: <span className="uppercase">{quote.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-wps-blue">Prepared For</h2>
        <div className="mt-2">
          <div className="font-medium">{quote.client?.name}</div>
          {quote.client?.contactPerson && (
            <div className="text-sm text-gray-500">Attn: {quote.client.contactPerson}</div>
          )}
          <div className="text-sm text-gray-500 whitespace-pre-line">{quote.client?.address}</div>
          <div className="text-sm text-gray-500">{quote.client?.email}</div>
          {quote.client?.phone && (
            <div className="text-sm text-gray-500">{quote.client.phone}</div>
          )}
          {quote.client?.vatNumber && (
            <div className="text-sm text-gray-500">VAT: {quote.client.vatNumber}</div>
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
            {quote.items && quote.items.map((item, index) => (
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
              <td className="py-2 px-4 text-right">R {quote.subtotal?.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={4} className="py-2 px-4 text-right font-medium">VAT</td>
              <td className="py-2 px-4 text-right">R {quote.taxTotal?.toFixed(2)}</td>
            </tr>
            <tr className="bg-gray-100">
              <td colSpan={4} className="py-2 px-4 text-right font-bold">Total</td>
              <td className="py-2 px-4 text-right font-bold">R {quote.total?.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(quote.notes || quote.terms) && (
        <div className="mt-8 space-y-4">
          {quote.notes && (
            <div>
              <h3 className="font-medium text-wps-blue">Notes</h3>
              <p className="text-sm text-gray-500 mt-1">{quote.notes}</p>
            </div>
          )}
          {quote.terms && (
            <div>
              <h3 className="font-medium text-wps-blue">Terms & Conditions</h3>
              <p className="text-sm text-gray-500 mt-1">{quote.terms}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm text-gray-500">
          To accept this quotation, please sign below and return to {companySettings.email} or contact us at {companySettings.phone}.
        </p>
      </div>

      <div className="mt-8 border-t pt-4">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-sm font-medium">Accepted By:</div>
            <div className="mt-4 border-b border-gray-300 pb-1"></div>
            <div className="mt-2 text-sm text-gray-500">Signature & Date</div>
          </div>
          <div>
            <div className="text-sm font-medium">For {companySettings.name}:</div>
            <div className="mt-2">
              <img 
                src="/lovable-uploads/904b88b4-0095-4691-a6d5-af01f553ac8e.png" 
                alt="Signature" 
                className="h-12" 
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {format(new Date(), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-sm text-gray-500">
        Thank you for your business!
      </div>
    </div>
  );
};

export default QuoteDocument;
