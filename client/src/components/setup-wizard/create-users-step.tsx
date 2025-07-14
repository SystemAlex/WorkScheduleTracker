import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserForm, formSchema, FormValues } from '@/components/users/user-form';
import { UserList } from '@/components/users/user-list';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';
import { useAuth } from '@/context/auth-context';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface CreateUsersStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function CreateUsersStep({ onNext, onSkip }: CreateUsersStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', role: 'supervisor' },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest('POST', '/api/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Usuario Creado',
        description: 'El nuevo usuario ha sido añadido a la lista.',
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
        <h3 className="text-lg font-medium">Usuarios Actuales</h3>
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <UserList
            users={users}
            currentUser={currentUser}
            onEdit={() => {}}
            onDelete={() => {}}
            onResetPassword={() => {}}
            isDeleting={false}
            isResettingPassword={false}
          />
        )}
      </div>

      <div className="p-4 border rounded-lg bg-neutral-50">
        <h3 className="text-lg font-medium mb-2">Agregar Nuevo Usuario</h3>
        <p className="text-sm text-neutral-600 mb-4">
          La contraseña por defecto será &quot;password123&quot;. El usuario
          deberá cambiarla en su primer inicio de sesión.
        </p>
        <FormProvider {...form}>
          <UserForm
            onSubmit={onSubmit}
            onCancel={() => form.reset()}
            isLoading={createMutation.isPending}
            isEditing={false}
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
