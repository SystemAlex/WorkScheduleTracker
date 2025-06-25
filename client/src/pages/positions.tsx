import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Briefcase, Building } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertPositionSchema } from '@shared/schema';
import type { Position, InsertPosition } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Positions() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position>();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: positions = [], isLoading } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

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

  // Obtener clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ['/api/clientes'],
  });

  const form = useForm<InsertPosition>({
    resolver: zodResolver(insertPositionSchema),
    defaultValues: {
      name: '',
      description: '',
      department: '',
      siglas: '',
      color: '#3B82F6',
      totalHoras: 8,
      clienteId: undefined,
    },
  });

  const handleSubmit = (data: InsertPosition) => {
    createPositionMutation.mutate(data);
  };

  const handleAdd = () => {
    setEditingPosition(undefined);
    form.reset({
      name: '',
      description: '',
      department: '',
      siglas: '',
    });
    setModalOpen(true);
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
              Total Puestos ({positions.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center border"
                      style={{ backgroundColor: position.color }}
                    >
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{position.name}</CardTitle>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {position.siglas}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {position.totalHoras}h
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {position.department && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Building className="w-4 h-4" />
                      <span>{position.department}</span>
                    </div>
                  )}
                  {position.description && (
                    <p className="text-sm text-neutral-600">
                      {position.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <span>Cliente:</span>
                    <span className="font-semibold">
                      {clientes.find((c) => c.id === position.clienteId)
                        ?.empresa || '-'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {positions.length === 0 && (
          <div className="text-center py-12">
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
        )}
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Puesto</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del puesto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Recepcionista, Seguridad, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="siglas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Siglas</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: REC, SEG, ADM (máx 3 caracteres)"
                        maxLength={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Administración, Operaciones, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe las responsabilidades del puesto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (HEX)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-3">
                        <Input
                          type="color"
                          className="w-16 h-10 p-1"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="#3B82F6"
                          className="flex-1"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalHoras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Horas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        placeholder="Ej: 6.5"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ''}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem
                            key={cliente.id}
                            value={cliente.id.toString()}
                          >
                            {cliente.empresa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  disabled={createPositionMutation.isPending}
                >
                  {createPositionMutation.isPending ? 'Creando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
