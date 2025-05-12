
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReactToPdf } from '@/hooks/use-pdf';
import MainLayout from '@/layouts/MainLayout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, FileText, Download, Plus, Trash2 } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceDocument from '@/components/InvoiceDocument';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, getClients, deleteInvoice, getCompanySettings } from '@/services/supabaseService';
import { Skeleton } from '@/components/ui/skeleton';

const InvoicesPage = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data from Supabase
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: getInvoices
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  const { data: companySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Invoice deleted',
        description: `Invoice has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the invoice. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // PDF generation setup
  const { toPDF, targetRef, loading } = useReactToPdf({
    filename: selectedInvoice ? `invoice-${selectedInvoice.invoiceNumber}.pdf` : 'invoice.pdf',
  });

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

  // Handle download PDF
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

  // Handle invoice deletion
  const handleDeleteInvoice = () => {
    if (!selectedInvoice) return;
    deleteMutation.mutate(selectedInvoice.id);
  };

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
        return format(new Date(row.original.issueDate), 'dd MMM yyyy');
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }: { row: any }) => {
        return format(new Date(row.original.dueDate), 'dd MMM yyyy');
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: { row: any }) => {
        return `R ${row.original.total.toFixed(2)}`;
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

  if (invoicesLoading || clientsLoading || settingsLoading) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
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

      <DataTable 
        columns={columns} 
        data={invoices || []} 
        searchField="invoiceNumber" 
      />

      {/* Invoice Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </DialogTitle>
          </DialogHeader>
          {companySettings && clients && (
            <InvoiceForm
              invoice={selectedInvoice || undefined}
              clients={clients}
              onSave={() => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
              }}
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
            <Button 
              variant="destructive" 
              onClick={handleDeleteInvoice}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default InvoicesPage;
