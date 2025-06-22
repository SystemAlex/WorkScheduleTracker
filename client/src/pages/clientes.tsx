import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Building, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertClienteSchema } from '@shared/schema';
import type { Cliente, InsertCliente } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Clientes() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
  });

  const createClienteMutation = useMutation({
    mutationFn: async (data: InsertCliente) => {
      const response = await apiRequest('POST', '/api/clientes', data);
      return response.json();
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el cliente.',
        variant: 'destructive',
      });
    },
  });

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, ...data }: InsertCliente & { id: number }) => {
      const response = await apiRequest('PUT', `/api/clientes/${id}`, data);
      return response.json();
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cliente.',
        variant: 'destructive',
      });
    },
  });

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<InsertCliente>({
    resolver: zodResolver(insertClienteSchema),
    defaultValues: {
      empresa: '',
      direccion: '',
      localidad: '',
      nombreContacto: '',
      telefono: '',
      email: '',
    },
  });

  const handleSubmit = (data: InsertCliente) => {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Clientes"
        subtitle="Administra los clientes de tu organización"
      />

      <LayoutContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Clientes ({clientes.length})
            </h3>
            <p className="text-sm text-neutral-500">
              Lista de empresas y contactos asociados
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {cliente.empresa}
                      </CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {cliente.localidad}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cliente.direccion && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <span>{cliente.direccion}</span>
                    </div>
                  )}
                  {cliente.nombreContacto && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <User className="w-4 h-4" />
                      <span>{cliente.nombreContacto}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Mail className="w-4 h-4" />
                      <span>{cliente.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Agregar Cliente'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="localidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Localidad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nombreContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de contacto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createClienteMutation.isPending ||
                    updateClienteMutation.isPending
                  }
                >
                  {editingCliente ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
