
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
import { Edit, Eye, Quote as QuoteIcon, Download, Plus, Trash2, Loader } from 'lucide-react';
import QuoteForm from '@/components/QuoteForm';
import QuoteDocument from '@/components/QuoteDocument';
import { 
  getQuotes, 
  getClients, 
  getCompanySettings, 
  saveQuote, 
  deleteQuote 
} from '@/services/supabaseService';

const QuotesPage = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // PDF generation setup with our enhanced hook
  const { toPDF, targetRef, loading } = useReactToPdf({
    filename: selectedQuote ? `quote-${selectedQuote.quoteNumber}.pdf` : 'quote.pdf',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch data in sequence rather than parallel to avoid race conditions
        const clientsData = await getClients();
        setClients(clientsData);
        
        const settings = await getCompanySettings();
        setCompanySettings(settings);
        
        const quotesData = await getQuotes();
        setQuotes(quotesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Failed to load data',
          description: 'There was an error loading quotes data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle form submission
  const handleSaveQuote = async (quote: Quote) => {
    try {
      const savedQuote = await saveQuote(quote);
      
      if (quotes.some(q => q.id === quote.id)) {
        // Update existing quote
        setQuotes(quotes.map(q => (q.id === quote.id ? savedQuote : q)));
        toast({
          title: 'Quote updated',
          description: `Quote ${quote.quoteNumber} has been updated.`,
        });
      } else {
        // Add new quote
        setQuotes([...quotes, savedQuote]);
        toast({
          title: 'Quote created',
          description: `Quote ${quote.quoteNumber} has been created.`,
        });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle quote deletion
  const handleDeleteQuote = async () => {
    if (!selectedQuote) return;
    
    try {
      await deleteQuote(selectedQuote.id);
      setQuotes(quotes.filter(q => q.id !== selectedQuote.id));
      toast({
        title: 'Quote deleted',
        description: `Quote ${selectedQuote.quoteNumber} has been deleted.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  // Handle download PDF with our enhanced function
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
        const date = new Date(row.original.issueDate);
        return isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy');
      },
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }: { row: any }) => {
        const date = new Date(row.original.expiryDate);
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
        <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      <DataTable columns={columns} data={quotes} searchField="quoteNumber" />

      {/* Quote Form Dialog */}
      {companySettings && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedQuote ? 'Edit Quote' : 'Create Quote'}
              </DialogTitle>
            </DialogHeader>
            <QuoteForm
              quote={selectedQuote || undefined}
              clients={clients}
              onSave={handleSaveQuote}
              onCancel={() => setIsFormOpen(false)}
              companySettings={{
                quotePrefix: companySettings.quotePrefix,
                quoteTerms: companySettings.quoteTerms,
              }}
            />
          </DialogContent>
        </Dialog>
      )}

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
            <Button variant="destructive" onClick={handleDeleteQuote}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default QuotesPage;
