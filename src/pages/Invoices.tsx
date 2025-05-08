
import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReactToPdf } from 'react-to-pdf';
import MainLayout from '@/layouts/MainLayout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, FileText, Download, Plus, FilePlus, Trash2 } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceDocument from '@/components/InvoiceDocument';
import { companySettings, clients, invoices as mockInvoices } from '@/data/mockData';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // PDF generation setup
  const { toPDF, targetRef } = useReactToPdf({
    filename: selectedInvoice ? `invoice-${selectedInvoice.invoiceNumber}.pdf` : 'invoice.pdf',
  });

  // Handle form submission
  const handleSaveInvoice = (invoice: Invoice) => {
    if (invoices.some(inv => inv.id === invoice.id)) {
      // Update existing invoice
      setInvoices(invoices.map(inv => (inv.id === invoice.id ? invoice : inv)));
      toast({
        title: 'Invoice updated',
        description: `Invoice ${invoice.invoiceNumber} has been updated.`,
      });
    } else {
      // Add new invoice
      setInvoices([...invoices, invoice]);
      toast({
        title: 'Invoice created',
        description: `Invoice ${invoice.invoiceNumber} has been created.`,
      });
    }
    setIsFormOpen(false);
  };

  // Handle invoice deletion
  const handleDeleteInvoice = () => {
    if (!selectedInvoice) return;
    
    setInvoices(invoices.filter(inv => inv.id !== selectedInvoice.id));
    toast({
      title: 'Invoice deleted',
      description: `Invoice ${selectedInvoice.invoiceNumber} has been deleted.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
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

  // Handle download PDF
  const handleDownload = () => {
    if (targetRef.current) {
      toPDF();
    }
  };

  // Create a new invoice
  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsFormOpen(true);
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

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <DataTable columns={columns} data={invoices} searchField="invoiceNumber" />

      {/* Invoice Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Create Invoice'}
            </DialogTitle>
          </DialogHeader>
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
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogHeader>
          <div ref={targetRef}>
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
