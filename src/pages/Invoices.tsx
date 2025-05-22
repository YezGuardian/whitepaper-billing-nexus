
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPdf } from '@/hooks/use-pdf';
import MainLayout from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import { Loader, Plus } from 'lucide-react';
import { 
  getInvoices, 
  getClients, 
  saveInvoice, 
  deleteInvoice, 
  getCompanySettings 
} from '@/services/invoiceService';

// Import the new components
import InvoiceList from '@/components/invoices/InvoiceList';
import DeleteInvoiceDialog from '@/components/invoices/DeleteInvoiceDialog';
import ViewInvoiceDialog from '@/components/invoices/ViewInvoiceDialog';
import InvoiceFormDialog from '@/components/invoices/InvoiceFormDialog';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // PDF generation setup
  const pdfTools = useReactToPdf({
    filename: selectedInvoice ? `invoice-${selectedInvoice.invoiceNumber}.pdf` : 'invoice.pdf',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoicesData, clientsData, settings] = await Promise.all([
          getInvoices(),
          getClients(),
          getCompanySettings()
        ]);
        
        setInvoices(invoicesData);
        setClients(clientsData);
        setCompanySettings(settings);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Failed to load data',
          description: 'There was an error loading invoices data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle form submission
  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      setIsSaving(true);
      console.log("Attempting to save invoice:", JSON.stringify(invoice, null, 2));
      
      // Save the invoice to the database
      const savedInvoice = await saveInvoice(invoice);
      console.log("Response from saveInvoice:", savedInvoice);
      
      // Refresh the list of invoices to ensure we have the latest data
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices);
      
      toast({
        title: invoice.id ? 'Invoice updated' : 'Invoice created',
        description: `Invoice ${invoice.invoiceNumber} has been ${invoice.id ? 'updated' : 'created'}.`,
      });
      
      // Close the form after successful save
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: `Failed to save invoice: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      await deleteInvoice(selectedInvoice.id);
      
      // Refresh the list to ensure we have the latest data
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices);
      
      toast({
        title: 'Invoice deleted',
        description: `Invoice ${selectedInvoice.invoiceNumber} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle download PDF
  const handleDownload = async () => {
    try {
      const url = await pdfTools.toPDF();
      if (url) {
        toast({
          title: 'PDF Generated',
          description: 'PDF has been generated and downloaded successfully.',
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      toast({
        title: 'PDF Generation Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Button onClick={() => {
          setSelectedInvoice(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <InvoiceList 
        invoices={invoices} 
        onView={(invoice) => {
          setSelectedInvoice(invoice);
          setIsViewOpen(true);
        }} 
        onEdit={(invoice) => {
          setSelectedInvoice(invoice);
          setIsFormOpen(true);
        }} 
        onDelete={(invoice) => {
          setSelectedInvoice(invoice);
          setIsDeleteDialogOpen(true);
        }} 
      />

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        invoice={selectedInvoice}
        clients={clients}
        companySettings={companySettings}
        onSave={handleSaveInvoice}
      />

      {/* Invoice View Dialog */}
      <ViewInvoiceDialog 
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        invoice={selectedInvoice}
        pdfTools={pdfTools}
        onDownload={handleDownload}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteInvoiceDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        invoice={selectedInvoice}
        onConfirm={handleDeleteInvoice}
      />
    </MainLayout>
  );
};

export default InvoicesPage;
