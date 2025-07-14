import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z
  .object({
    oldPassword: z.string().min(1, 'Por favor, ingresa tu contraseña actual.'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function SetPasswordPage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const setPasswordMutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiRequest('POST', '/api/auth/set-password', data),
    onSuccess: async () => {
      toast({
        title: 'Contraseña Actualizada',
        description:
          'Tu contraseña ha sido cambiada. Por favor, inicia sesión de nuevo.',
      });
      // Invalidate user query and then log out to force a clean re-login
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      await logout();
    },
    onError: (err: unknown) => {
      let errorMessage = 'Ocurrió un error. Intenta de nuevo.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      toast({
        title: 'Error al cambiar la contraseña',
        description: errorMessage,
        variant: 'destructive',
      });
      if (errorMessage.toLowerCase().includes('actual es incorrecta')) {
        form.setError('oldPassword', { type: 'manual', message: errorMessage });
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    setPasswordMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4">
            <KeyRound className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Establecer Nueva Contraseña
          </CardTitle>
          <CardDescription>
            Por seguridad, debes establecer una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual (predeterminada)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={setPasswordMutation.isPending}
              >
                {setPasswordMutation.isPending
                  ? 'Guardando...'
                  : 'Guardar Contraseña'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
