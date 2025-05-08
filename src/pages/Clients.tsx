
import { useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Client } from '@/types';
import ClientForm from '@/components/ClientForm';
import { clients as mockClients } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Trash2, Users } from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Handle form submission
  const handleSaveClient = (client: Client) => {
    if (clients.some(c => c.id === client.id)) {
      // Update existing client
      setClients(clients.map(c => (c.id === client.id ? client : c)));
      toast({
        title: 'Client updated',
        description: `${client.name} has been updated.`,
      });
    } else {
      // Add new client
      setClients([...clients, client]);
      toast({
        title: 'Client created',
        description: `${client.name} has been added.`,
      });
    }
    setIsFormOpen(false);
  };

  // Handle client deletion
  const handleDeleteClient = () => {
    if (!selectedClient) return;
    
    setClients(clients.filter(c => c.id !== selectedClient.id));
    toast({
      title: 'Client deleted',
      description: `${selectedClient.name} has been removed.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedClient(null);
  };

  // Create a new client
  const handleCreate = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  // Edit a client
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  // Table columns configuration
  const columns = [
    {
      accessorKey: 'name',
      header: 'Company Name',
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Person',
      cell: ({ row }: { row: any }) => {
        return row.original.contactPerson || '-';
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }: { row: any }) => {
        return row.original.phone || '-';
      },
    },
    {
      accessorKey: 'vatNumber',
      header: 'VAT Number',
      cell: ({ row }: { row: any }) => {
        return row.original.vatNumber || '-';
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
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setSelectedClient(row.original);
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
        <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      <DataTable columns={columns} data={clients} searchField="name" />

      {/* Client Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {selectedClient ? 'Edit Client' : 'Add Client'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={selectedClient || undefined}
            onSave={handleSaveClient}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete {selectedClient?.name}? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ClientsPage;
