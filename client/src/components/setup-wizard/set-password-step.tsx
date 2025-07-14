import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

interface SetPasswordStepProps {
  onNext: () => void;
}

export function SetPasswordStep({ onNext }: SetPasswordStepProps) {
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
        description: 'Tu contraseña ha sido cambiada exitosamente.',
      });
      // Invalidate user query to update the `mustChangePassword` flag
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      onNext(); // Move to the next step in the wizard
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
    <div>
      <p className="text-center text-neutral-600 mb-6">
        Como primer paso, por favor establece una contraseña segura para tu
        cuenta de administrador. La contraseña por defecto es
        &quot;newCompany1234&quot;.
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 max-w-md mx-auto"
        >
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
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={setPasswordMutation.isPending}>
              {setPasswordMutation.isPending
                ? 'Guardando...'
                : 'Guardar y Continuar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
