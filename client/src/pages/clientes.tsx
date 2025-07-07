import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertClienteSchema } from '@shared/schema';
import type { Cliente, InsertCliente, Position } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SearchInput } from '@/components/common/search-input';
import { base } from '@/lib/paths';
import { ClientForm } from '@/components/clients/client-form';
import { ClientCard } from '@/components/clients/client-card';
import { z } from 'zod';

const formSchema = insertClienteSchema;
type FormValues = z.infer<typeof formSchema>;

export default function Clientes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente>();
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allClientes = [], isLoading: clientsLoading } = useQuery<
    Cliente[]
  >({
    queryKey: ['/api/clientes'],
    queryFn: async ({ queryKey }) => {
      const [path] = queryKey;
      const response = await fetch(base(path as string));
      if (!response.ok) throw new Error('Failed to fetch clientes');
      return response.json();
    },
  });

  const { data: allPositions = [], isLoading: positionsLoading } = useQuery<
    Position[]
  >({
    queryKey: ['/api/positions'],
    queryFn: async ({ queryKey }) => {
      const [path] = queryKey;
      const response = await fetch(base(path as string));
      if (!response.ok) throw new Error('Failed to fetch positions');
      return response.json();
    },
  });

  const filteredClientes = React.useMemo(() => {
    if (!searchTerm) {
      return allClientes;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allClientes.filter(
      (cliente) =>
        cliente.empresa.toLowerCase().includes(lowercasedSearchTerm) ||
        (cliente.localidad &&
          cliente.localidad.toLowerCase().includes(lowercasedSearchTerm)) ||
        (cliente.nombreContacto &&
          cliente.nombreContacto.toLowerCase().includes(lowercasedSearchTerm)),
    );
  }, [allClientes, searchTerm]);

  const createClienteMutation = useMutation({
    mutationFn: async (data: InsertCliente) => {
      const response = await apiRequest('POST', '/api/clientes', data);
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      setModalOpen(false);
      setEditingCliente(undefined);
      toast({
        title: 'Cliente creado',
        description: 'El cliente ha sido creado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el cliente.',
        variant: 'destructive',
      });
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, ...data }: InsertCliente & { id: number }) => {
      const response = await apiRequest('PUT', `/api/clientes/${id}`, data);
      const responseBody = await response.json();
      if (!response.ok) {
        if (response.status === 404 && responseBody.code === 'NOT_FOUND') {
          throw new Error(responseBody.message || 'Cliente no encontrado');
        }
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      setModalOpen(false);
      setEditingCliente(undefined);
      toast({
        title: 'Cliente actualizado',
        description: 'El cliente ha sido actualizado correctamente.',
      });
    },
    onError: (error: Error) => {
      let description = 'No se pudo actualizar el cliente.';
      if (error.message.includes('Cliente no encontrado')) {
        description = 'El cliente que intentas actualizar no existe.';
      } else {
        description = error.message;
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/clientes/${id}`);
      if (!response.ok) {
        const responseBody = await response.json();
        if (response.status === 404 && responseBody.code === 'NOT_FOUND') {
          throw new Error(responseBody.message || 'Cliente no encontrado');
        }
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado correctamente.',
      });
    },
    onError: (error: Error) => {
      let description = 'No se pudo eliminar el cliente.';
      if (error.message.includes('Cliente no encontrado')) {
        description = 'El cliente que intentas eliminar no existe.';
      } else {
        description = error.message;
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empresa: '',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
  });

  const handleSubmit = (data: FormValues) => {
    if (editingCliente) {
      updateClienteMutation.mutate({ ...data, id: editingCliente.id });
    } else {
      createClienteMutation.mutate(data);
    }
  };

  const handleAdd = () => {
    setEditingCliente(undefined);
    form.reset({
      empresa: '',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    form.reset(cliente);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      deleteClienteMutation.mutate(id);
    }
  };

  if (clientsLoading || positionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">
            Cargando clientes y puestos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Clientes"
        subtitle="Administra los clientes de tu organización"
        onAddClient={handleAdd}
      />

      <LayoutContent>
        <div className="sticky top-0 z-10 flex justify-between items-center p-2 bg-background">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Total <span className="hidden md:inline">Clientes</span>(
              {filteredClientes.length})
            </h3>
          </div>
          <div className="w-full max-w-56 md:max-w-xs">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar cliente..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 p-2">
          {filteredClientes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-neutral-500 mb-4">
                Comienza agregando clientes a tu organización
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Cliente
              </Button>
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const clientPositions = allPositions.filter(
                (position) => position.clienteId === cliente.id,
              );

              return (
                <ClientCard
                  key={cliente.id}
                  cliente={cliente}
                  clientPositions={clientPositions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteClienteMutation.isPending}
                />
              );
            })
          )}
        </div>
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Agregar Cliente'}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <ClientForm
              onSubmit={handleSubmit}
              onCancel={() => setModalOpen(false)}
              isLoading={
                createClienteMutation.isPending ||
                updateClienteMutation.isPending
              }
              editingCliente={editingCliente}
            />
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}