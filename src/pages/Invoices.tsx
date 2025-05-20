
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReactToPdf } from '@/hooks/use-pdf';
import MainLayout from '@/layouts/MainLayout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, FileText, Download, Plus, Trash2, Loader, User, Calendar, Clock, Repeat } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceDocument from '@/components/InvoiceDocument';
import { 
  getInvoices, 
  getClients, 
  saveInvoice, 
  deleteInvoice, 
  getCompanySettings 
} from '@/services/supabaseService';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // PDF generation setup - ensure targetRef is passed to InvoiceDocument
  const { toPDF, targetRef, loading } = useReactToPdf({
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
      const savedInvoice = await saveInvoice(invoice);
      
      if (invoices.some(inv => inv.id === invoice.id)) {
        // Update existing invoice
        setInvoices(invoices.map(inv => (inv.id === invoice.id ? savedInvoice : inv)));
        toast({
          title: 'Invoice updated',
          description: `Invoice ${invoice.invoiceNumber} has been updated.`,
        });
      } else {
        // Add new invoice
        setInvoices([...invoices, savedInvoice]);
        toast({
          title: 'Invoice created',
          description: `Invoice ${invoice.invoiceNumber} has been created.`,
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to save invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      await deleteInvoice(selectedInvoice.id);
      setInvoices(invoices.filter(inv => inv.id !== selectedInvoice.id));
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

  // Open invoice form for editing
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsFormOpen(true);
  };

  // Open invoice viewer
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewOpen(true);
  };

  // Handle download PDF using our updated approach
  const handleDownload = async () => {
    try {
      const url = await toPDF();
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

  // Create a new invoice
  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  // Filter invoices based on active tab
  const filteredInvoices = useMemo(() => {
    if (activeTab === 'all') return invoices;
    
    if (activeTab.startsWith('client-')) {
      const clientId = activeTab.replace('client-', '');
      return invoices.filter(invoice => invoice.client.id === clientId);
    }
    
    if (activeTab.startsWith('recurrence-')) {
      const recurrence = activeTab.replace('recurrence-', '');
      return invoices.filter(invoice => invoice.recurrence === recurrence);
    }

    if (activeTab.startsWith('due-')) {
      const duePeriod = activeTab.replace('due-', '');
      const today = new Date();
      
      switch (duePeriod) {
        case 'overdue':
          return invoices.filter(invoice => 
            new Date(invoice.dueDate) < today && invoice.status !== 'paid');
        case 'this-week': {
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
          return invoices.filter(invoice => 
            new Date(invoice.dueDate) >= today && 
            new Date(invoice.dueDate) <= endOfWeek);
        }
        case 'this-month': {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return invoices.filter(invoice => 
            new Date(invoice.dueDate) >= today && 
            new Date(invoice.dueDate) <= endOfMonth);
        }
        default:
          return invoices;
      }
    }

    // Filter by status
    return invoices.filter(invoice => invoice.status === activeTab);
  }, [activeTab, invoices]);

  // Generate unique client list for tabs
  const clientTabs = useMemo(() => {
    const uniqueClients = Array.from(new Set(invoices.map(invoice => invoice.client.id)))
      .map(clientId => {
        const invoice = invoices.find(inv => inv.client.id === clientId);
        return {
          id: clientId,
          name: invoice?.client.name || 'Unknown Client'
        };
      });
    return uniqueClients;
  }, [invoices]);

  // Generate unique recurrence options for tabs
  const recurrenceTabs = useMemo(() => {
    const recurrenceTypes = Array.from(new Set(
      invoices
        .filter(invoice => invoice.recurrence && invoice.recurrence !== 'none')
        .map(invoice => invoice.recurrence)
    ));
    return recurrenceTypes;
  }, [invoices]);

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
    },
    {
      accessorKey: 'client.name',
      header: 'Client',
    },
    {
      accessorKey: 'issueDate',
      header: 'Issue Date',
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.original.issueDate);
        return isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy');
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.original.dueDate);
        return isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy');
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: any }) => {
        return `R ${Number(row.original.total).toFixed(2)}`;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        return <StatusBadge status={row.original.status} />;
      },
    },
    {
      accessorKey: 'recurrence',
      header: 'Recurrence',
      cell: ({ row }: { row: any }) => {
        return row.original.recurrence === 'none' ? '-' : row.original.recurrence;
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: any }) => {
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleView(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setSelectedInvoice(row.original);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

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
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">View All</h2>
          <TabsList className="mb-2 w-full md:w-auto">
            <TabsTrigger value="all">All Invoices</TabsTrigger>
          </TabsList>
        </div>

        {/* Status tabs */}
        <div className="mb-4">
          <h2 className="flex items-center text-sm font-medium text-gray-500 mb-2">
            <Clock className="h-4 w-4 mr-1" />
            By Status
          </h2>
          <TabsList className="mb-2 w-full overflow-x-auto">
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </div>

        {/* Client tabs */}
        {clientTabs.length > 0 && (
          <div className="mb-4">
            <h2 className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <User className="h-4 w-4 mr-1" />
              By Client
            </h2>
            <TabsList className="mb-2 w-full overflow-x-auto">
              {clientTabs.map((client) => (
                <TabsTrigger key={client.id} value={`client-${client.id}`}>
                  {client.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}

        {/* Recurrence tabs */}
        {recurrenceTabs.length > 0 && (
          <div className="mb-4">
            <h2 className="flex items-center text-sm font-medium text-gray-500 mb-2">
              <Repeat className="h-4 w-4 mr-1" />
              By Recurrence
            </h2>
            <TabsList className="mb-2 w-full overflow-x-auto">
              {recurrenceTabs.map((recurrence) => (
                <TabsTrigger key={recurrence} value={`recurrence-${recurrence}`}>
                  {recurrence.charAt(0).toUpperCase() + recurrence.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}

        {/* Due Date tabs */}
        <div className="mb-4">
          <h2 className="flex items-center text-sm font-medium text-gray-500 mb-2">
            <Calendar className="h-4 w-4 mr-1" />
            By Due Date
          </h2>
          <TabsList className="mb-2 w-full overflow-x-auto">
            <TabsTrigger value="due-overdue">Overdue</TabsTrigger>
            <TabsTrigger value="due-this-week">Due This Week</TabsTrigger>
            <TabsTrigger value="due-this-month">Due This Month</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <DataTable 
            columns={columns} 
            data={filteredInvoices} 
            searchField="invoiceNumber" 
          />
        </TabsContent>
      </Tabs>

      {/* Invoice Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </DialogTitle>
          </DialogHeader>
          {companySettings && (
            <InvoiceForm
              invoice={selectedInvoice || undefined}
              clients={clients}
              onSave={handleSaveInvoice}
              onCancel={() => setIsFormOpen(false)}
              companySettings={{
                invoicePrefix: companySettings.invoicePrefix,
                invoiceTerms: companySettings.invoiceTerms,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {selectedInvoice?.invoiceNumber}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center"
              disabled={loading}
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Generating...' : 'Download PDF'}
            </Button>
          </DialogHeader>
          <div ref={targetRef} className="bg-white">
            {selectedInvoice && <InvoiceDocument invoice={selectedInvoice} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete invoice {selectedInvoice?.invoiceNumber}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default InvoicesPage;
