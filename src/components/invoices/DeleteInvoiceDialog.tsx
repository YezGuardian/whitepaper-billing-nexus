
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Invoice } from '@/types';

interface DeleteInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onConfirm: () => Promise<void>;
}

const DeleteInvoiceDialog = ({ 
  isOpen, 
  onClose, 
  invoice, 
  onConfirm 
}: DeleteInvoiceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Invoice</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the invoice.
          </DialogDescription>
        </DialogHeader>
        <p>
          Are you sure you want to delete invoice {invoice?.invoiceNumber}?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteInvoiceDialog;
