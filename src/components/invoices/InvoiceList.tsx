
import { useState } from 'react';
import { format } from 'date-fns';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { Edit, Eye, Trash2 } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

const InvoiceList = ({ invoices, onView, onEdit, onDelete }: InvoiceListProps) => {
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
    <DataTable columns={columns} data={invoices} searchField="invoiceNumber" />
  );
};

export default InvoiceList;
