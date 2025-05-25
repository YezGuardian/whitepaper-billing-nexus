import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

const InvoiceList = ({ invoices, onView, onEdit, onDelete }: InvoiceListProps) => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  const invoicesByClient = useMemo(() => {
    const grouped = invoices.reduce((acc, invoice) => {
      const clientId = invoice.client.id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client: invoice.client,
          invoices: [],
          statusCounts: {
            draft: 0,
            sent: 0,
            paid: 0,
            overdue: 0,
            cancelled: 0
          }
        };
      }
      acc[clientId].invoices.push(invoice);
      acc[clientId].statusCounts[invoice.status as keyof typeof acc[typeof clientId]['statusCounts']]++;
      return acc;
    }, {} as Record<string, {
      client: Invoice['client'];
      invoices: Invoice[];
      statusCounts: Record<string, number>;
    }>);

    return Object.values(grouped)
      .sort((a, b) => a.client.name.localeCompare(b.client.name))
      .map(group => ({
        ...group,
        invoices: group.invoices.sort((a, b) => 
          new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
        )
      }));
  }, [invoices]);

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
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
              onClick={() => onView(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-6">
        {invoicesByClient.map(({ client, invoices: clientInvoices, statusCounts }) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {client.email} • {clientInvoices.length} invoice{clientInvoices.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    count > 0 && (
                      <div key={status} className="flex items-center gap-1">
                        <StatusBadge status={status} />
                        <span>{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all" onClick={() => setSelectedStatus('all')}>All</TabsTrigger>
                  <TabsTrigger value="draft" onClick={() => setSelectedStatus('draft')}>Draft</TabsTrigger>
                  <TabsTrigger value="sent" onClick={() => setSelectedStatus('sent')}>Sent</TabsTrigger>
                  <TabsTrigger value="paid" onClick={() => setSelectedStatus('paid')}>Paid</TabsTrigger>
                  <TabsTrigger value="overdue" onClick={() => setSelectedStatus('overdue')}>Overdue</TabsTrigger>
                  <TabsTrigger value="cancelled" onClick={() => setSelectedStatus('cancelled')}>Cancelled</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <DataTable 
                    columns={columns} 
                    data={selectedStatus === 'all' 
                      ? clientInvoices 
                      : clientInvoices.filter(invoice => invoice.status === selectedStatus)
                    } 
                    searchField="invoiceNumber" 
                  />
                </TabsContent>
                {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(status => (
                  <TabsContent key={status} value={status} className="mt-4">
                    <DataTable 
                      columns={columns} 
                      data={clientInvoices.filter(invoice => invoice.status === status)} 
                      searchField="invoiceNumber" 
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default InvoiceList;
