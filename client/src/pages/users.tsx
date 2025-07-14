import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';
import { UserList } from '@/components/users/user-list';
import { UserForm, formSchema, FormValues } from '@/components/users/user-form';
import { useAuth } from '@/context/auth-context';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(
    null,
  );
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      role: 'supervisor',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest('POST', '/api/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsModalOpen(false);
      toast({
        title: 'Usuario Creado',
        description:
          'El nuevo usuario ha sido creado con la contraseña por defecto &quot;password123&quot;.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormValues }) =>
      apiRequest('PUT', `/api/users/${id}`, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsModalOpen(false);
      toast({
        title: 'Usuario Actualizado',
        description: 'El rol del usuario ha sido actualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Usuario Eliminado',
        description: 'El usuario ha sido eliminado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('PUT', `/api/users/${id}/reset-password`),
    onSuccess: () => {
      toast({
        title: 'Contraseña Restablecida',
        description:
          'La contraseña del usuario ha sido restablecida a &quot;password123&quot;.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdd = () => {
    setEditingUser(null);
    form.reset({ username: '', role: 'supervisor' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: UserWithoutPassword) => {
    setEditingUser(user);
    form.reset({ username: user.username, role: user.role });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleResetPassword = (id: number) => {
    resetPasswordMutation.mutate(id);
  };

  const onSubmit = (data: FormValues) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Gestión de Usuarios"
          subtitle="Administra los usuarios de tu empresa"
        />
        <LayoutContent>
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">
                Cargando usuarios...
              </p>
            </div>
          </div>
        </LayoutContent>
      </>
    );
  }

  return (
    <>
      <Header
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios de tu empresa"
      />
      <LayoutContent className="p-4">
        <div className="flex justify-end mb-4">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Usuario
          </Button>
        </div>
        <UserList
          users={users}
          currentUser={currentUser}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          isDeleting={deleteMutation.isPending}
          isResettingPassword={resetPasswordMutation.isPending}
        />
      </LayoutContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
            </DialogTitle>
            {editingUser === null && (
              <DialogDescription>
                La contraseña por defecto para el nuevo usuario será
                &quot;password123&quot;.
              </DialogDescription>
            )}
          </DialogHeader>
          <FormProvider {...form}>
            <UserForm
              onSubmit={onSubmit}
              onCancel={() => setIsModalOpen(false)}
              isLoading={createMutation.isPending || updateMutation.isPending}
              isEditing={!!editingUser}
            />
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
