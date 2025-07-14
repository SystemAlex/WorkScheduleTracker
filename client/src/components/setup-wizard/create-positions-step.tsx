import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PositionForm } from '@/components/positions/position-form';
import { insertPositionSchema } from '@shared/schema';
import type { Position, Cliente } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';

const formSchema = insertPositionSchema;
type FormValues = z.infer<typeof formSchema>;

interface CreatePositionsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CreatePositionsStep({
  onNext,
  onSkip,
}: CreatePositionsStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: positions = [], isLoading: positionsLoading } = useQuery<
    Position[]
  >({
    queryKey: ['/api/positions'],
  });

  const { data: clientes = [], isLoading: clientsLoading } = useQuery<
    Cliente[]
  >({
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

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest('POST', '/api/positions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({
        title: 'Puesto Creado',
        description: 'El nuevo puesto ha sido añadido a la lista.',
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  if (clientsLoading) {
    return <p>Cargando clientes...</p>;
  }

  if (clientes.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-4">
          Debes crear al menos un cliente antes de poder asignar puestos.
        </p>
        <Button onClick={onNext}>Continuar</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium">
          Puestos Actuales ({positions.length})
        </h3>
        {positionsLoading ? (
          <p>Cargando...</p>
        ) : (
          <Card className="max-h-48 overflow-y-auto p-2">
            {positions.length > 0 ? (
              <ul className="space-y-2">
                {positions.map((position) => (
                  <li
                    key={position.id}
                    className="flex items-center space-x-2 p-2 bg-white rounded-md"
                  >
                    <Briefcase className="h-4 w-4 text-neutral-500" />
                    <span className="font-medium text-sm">{position.name}</span>
                    <span className="text-xs text-neutral-500">
                      (
                      {
                        clientes.find((c) => c.id === position.clienteId)
                          ?.empresa
                      }
                      )
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-neutral-500 py-4">
                Aún no has agregado puestos.
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-neutral-50">
        <h3 className="text-lg font-medium mb-2">Agregar Nuevo Puesto</h3>
        <FormProvider {...form}>
          <PositionForm
            onSubmit={onSubmit}
            onCancel={() => form.reset()}
            isLoading={createMutation.isPending}
            editingPosition={undefined}
            clientes={clientes}
          />
        </FormProvider>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onSkip}>
          Omitir este paso
        </Button>
        <Button onClick={onNext}>Siguiente</Button>
      </div>
    </div>
  );
}
