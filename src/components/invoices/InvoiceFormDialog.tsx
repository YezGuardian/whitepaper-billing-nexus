
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import InvoiceForm from '@/components/InvoiceForm';
import { Invoice, Client } from '@/types';

interface InvoiceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  clients: Client[];
  companySettings: {
    invoicePrefix: string;
    invoiceTerms: string;
  } | null;
  onSave: (invoice: Invoice) => Promise<void>;
}

const InvoiceFormDialog = ({
  isOpen,
  onClose,
  invoice,
  clients,
  companySettings,
  onSave
}: InvoiceFormDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Edit Invoice' : 'Create Invoice'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to {invoice ? 'update' : 'create'} an invoice.
          </DialogDescription>
        </DialogHeader>
        {companySettings && (
          <InvoiceForm
            invoice={invoice || undefined}
            clients={clients}
            onSave={onSave}
            onCancel={onClose}
            companySettings={{
              invoicePrefix: companySettings.invoicePrefix,
              invoiceTerms: companySettings.invoiceTerms,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
