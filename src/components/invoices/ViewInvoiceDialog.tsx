
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Download, FileText } from 'lucide-react';
import InvoiceDocument from '@/components/InvoiceDocument';
import { Invoice } from '@/types';
import { UseReactToPdfReturn } from '@/hooks/use-pdf';

interface ViewInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  pdfTools: UseReactToPdfReturn;
  onDownload: () => Promise<void>;
}

const ViewInvoiceDialog = ({ 
  isOpen, 
  onClose, 
  invoice, 
  pdfTools, 
  onDownload 
}: ViewInvoiceDialogProps) => {
  const { targetRef, loading } = pdfTools;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {invoice?.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            View your invoice details and download as PDF.
          </DialogDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center"
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Generating...' : 'Download PDF'}
          </Button>
        </DialogHeader>
        <div ref={targetRef} className="bg-white">
          {invoice && <InvoiceDocument invoice={invoice} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoiceDialog;
