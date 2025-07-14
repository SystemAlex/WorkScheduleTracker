import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClientForm } from '@/components/clients/client-form';
import { insertClienteSchema } from '@shared/schema';
import type { Cliente } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Building } from 'lucide-react';

const formSchema = insertClienteSchema;
type FormValues = z.infer<typeof formSchema>;

interface CreateClientsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CreateClientsStep({ onNext, onSkip }: CreateClientsStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
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

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest('POST', '/api/clientes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clientes'] });
      toast({
        title: 'Cliente Creado',
        description: 'El nuevo cliente ha sido añadido a la lista.',
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

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium">
          Clientes Actuales ({clientes.length})
        </h3>
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Card className="max-h-48 overflow-y-auto p-2">
            {clientes.length > 0 ? (
              <ul className="space-y-2">
                {clientes.map((cliente) => (
                  <li
                    key={cliente.id}
                    className="flex items-center space-x-2 p-2 bg-white rounded-md"
                  >
                    <Building className="h-4 w-4 text-neutral-500" />
                    <span className="font-medium text-sm">
                      {cliente.empresa}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-neutral-500 py-4">
                Aún no has agregado clientes.
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-neutral-50">
        <h3 className="text-lg font-medium mb-2">Agregar Nuevo Cliente</h3>
        <FormProvider {...form}>
          <ClientForm
            onSubmit={onSubmit}
            onCancel={() => form.reset()}
            isLoading={createMutation.isPending}
            editingCliente={undefined}
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
