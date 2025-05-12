
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useReactToPdf } from '@/hooks/use-pdf';
import MainLayout from '@/layouts/MainLayout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Quote } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, Quote as QuoteIcon, Download, Plus, Trash2 } from 'lucide-react';
import QuoteForm from '@/components/QuoteForm';
import QuoteDocument from '@/components/QuoteDocument';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuotes, getClients, deleteQuote, getCompanySettings } from '@/services/supabaseService';
import { Skeleton } from '@/components/ui/skeleton';

const QuotesPage = () => {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data from Supabase
  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotes
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients
  });

  const { data: companySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings
  });

  // Delete quote mutation
  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: 'Quote deleted',
        description: `Quote has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
    },
    onError: (error) => {
      console.error('Error deleting quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the quote. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // PDF generation setup
  const { toPDF, targetRef, loading } = useReactToPdf({
    filename: selectedQuote ? `quote-${selectedQuote.quoteNumber}.pdf` : 'quote.pdf',
  });

  // Open quote form for editing
  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsFormOpen(true);
  };

  // Open quote viewer
  const handleView = (quote: Quote) => {
    setSelectedQuote(quote);
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

  // Create a new quote
  const handleCreate = () => {
    setSelectedQuote(null);
    setIsFormOpen(true);
  };

  // Handle quote deletion
  const handleDeleteQuote = () => {
    if (!selectedQuote) return;
    deleteMutation.mutate(selectedQuote.id);
  };

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'quoteNumber',
      header: 'Quote #',
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
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }: { row: any }) => {
        return format(new Date(row.original.expiryDate), 'dd MMM yyyy');
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
        return <StatusBadge status={row.original.status} type="quote" />;
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
                setSelectedQuote(row.original);
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

  if (quotesLoading || clientsLoading || settingsLoading) {
    return (
      <MainLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={quotes || []} 
        searchField="quoteNumber" 
      />

      {/* Quote Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedQuote ? 'Edit Quote' : 'Create Quote'}
            </DialogTitle>
          </DialogHeader>
          {companySettings && clients && (
            <QuoteForm
              quote={selectedQuote || undefined}
              clients={clients}
              onSave={() => {
                setIsFormOpen(false);
                queryClient.invalidateQueries({ queryKey: ['quotes'] });
              }}
              onCancel={() => setIsFormOpen(false)}
              companySettings={{
                quotePrefix: companySettings.quotePrefix,
                quoteTerms: companySettings.quoteTerms,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quote View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center">
              <QuoteIcon className="mr-2 h-5 w-5" />
              {selectedQuote?.quoteNumber}
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
          <div ref={targetRef}>
            {selectedQuote && <QuoteDocument quote={selectedQuote} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete quote {selectedQuote?.quoteNumber}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteQuote}
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

export default QuotesPage;
