import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm, FormProvider } from 'react-hook-form'; // Import FormProvider
import { zodResolver } from '@hookform/resolvers/zod';
import { insertPositionSchema } from '@shared/schema';
import type { Position, InsertPosition, Cliente } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SearchInput } from '@/components/common/search-input';
import { base } from '@/lib/paths';
import { PositionForm } from '@/components/positions/position-form'; // Import new form component
import { PositionCard } from '@/components/positions/position-card'; // Import new card component
import { z } from 'zod'; // Import z for formSchema type

const formSchema = insertPositionSchema;
type FormValues = z.infer<typeof formSchema>;

export default function Positions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position>();
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allPositions = [], isLoading } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
    queryFn: async ({ queryKey }) => {
      const [path] = queryKey;
      const response = await fetch(base(path as string));
      if (!response.ok) throw new Error('Failed to fetch positions');
      return response.json();
    },
  });

  const filteredPositions = React.useMemo(() => {
    if (!searchTerm) {
      return allPositions;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allPositions.filter(position =>
      position.name.toLowerCase().includes(lowercasedSearchTerm) ||
      position.siglas.toLowerCase().includes(lowercasedSearchTerm) ||
      (position.department && position.department.toLowerCase().includes(lowercasedSearchTerm))
    );
  }, [allPositions, searchTerm]);

  const createPositionMutation = useMutation({
    mutationFn: async (data: InsertPosition) => {
      const response = await apiRequest('POST', '/api/positions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setModalOpen(false);
      setEditingPosition(undefined);
      toast({
        title: 'Puesto creado',
        description: 'El puesto ha sido creado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el puesto.',
        variant: 'destructive',
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertPosition }) => {
      const response = await apiRequest('PUT', `/api/positions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setModalOpen(false);
      setEditingPosition(undefined);
      toast({
        title: 'Puesto actualizado',
        description: 'El puesto ha sido actualizado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el puesto.',
        variant: 'destructive',
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/positions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: 'Puesto eliminado',
        description: 'El puesto ha sido eliminado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el puesto.',
        variant: 'destructive',
      });
    },
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      department: '',
      siglas: '',
      color: '#3B82F6',
      totalHoras: '8',
      clienteId: undefined,
    },
  });

  const handleSubmit = (data: FormValues) => {
    if (editingPosition) {
      updatePositionMutation.mutate({ id: editingPosition.id, data });
    } else {
      createPositionMutation.mutate(data);
    }
  };

  const handleAdd = () => {
    setEditingPosition(undefined);
    form.reset({
      name: '',
      description: '',
      department: '',
      siglas: '',
      color: '#3B82F6',
      totalHoras: '8',
      clienteId: undefined,
    });
    setModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.reset({
      name: position.name,
      description: position.description || '',
      department: position.department || '',
      siglas: position.siglas,
      color: position.color,
      totalHoras: position.totalHoras,
      clienteId: position.clienteId,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deletePositionMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Cargando puestos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Puestos"
        subtitle="Administra los puestos de trabajo de tu organización"
        onAddPosition={handleAdd}
      />

      <LayoutContent>
        <div className="flex justify-between items-center p-2">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Total Puestos ({filteredPositions.length})
            </h3>
          </div>
          <div className="w-full max-w-xs">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar puesto..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
          {filteredPositions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No hay puestos registrados
              </h3>
              <p className="text-neutral-500 mb-4">
                Comienza creando los puestos de trabajo de tu organización
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Puesto
              </Button>
            </div>
          ) : (
            filteredPositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                clientes={clientes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deletePositionMutation.isPending}
              />
            ))
          )}
        </div>
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Editar Puesto' : 'Agregar Puesto'}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <PositionForm
              onSubmit={handleSubmit}
              onCancel={() => setModalOpen(false)}
              isLoading={
                createPositionMutation.isPending ||
                updatePositionMutation.isPending
              }
              editingPosition={editingPosition}
              clientes={clientes}
            />
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}