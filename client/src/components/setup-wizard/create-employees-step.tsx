import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmployeeForm } from '@/components/employees/employee-form';
import { insertEmployeeSchema } from '@shared/schema';
import type { Employee } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

const formSchema = insertEmployeeSchema;
type FormValues = z.infer<typeof formSchema>;

interface CreateEmployeesStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CreateEmployeesStep({
  onNext,
  onSkip,
}: CreateEmployeesStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest('POST', '/api/employees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Empleado Creado',
        description: 'El nuevo empleado ha sido añadido a la lista.',
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
          Empleados Actuales ({employees.length})
        </h3>
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Card className="max-h-48 overflow-y-auto p-2">
            {employees.length > 0 ? (
              <ul className="space-y-2">
                {employees.map((employee) => (
                  <li
                    key={employee.id}
                    className="flex items-center space-x-2 p-2 bg-white rounded-md"
                  >
                    <User className="h-4 w-4 text-neutral-500" />
                    <span className="font-medium text-sm">{employee.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-neutral-500 py-4">
                Aún no has agregado empleados.
              </p>
            )}
          </Card>
        )}
      </div>

      <div className="p-4 border rounded-lg bg-neutral-50">
        <h3 className="text-lg font-medium mb-2">Agregar Nuevo Empleado</h3>
        <FormProvider {...form}>
          <EmployeeForm
            onSubmit={onSubmit}
            onCancel={() => form.reset()}
            isLoading={createMutation.isPending}
            editingEmployee={undefined}
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
