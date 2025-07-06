import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { insertClienteSchema } from '@shared/schema';
import type { Cliente } from '@shared/schema';

type FormValues = z.infer<typeof insertClienteSchema>;

interface ClientFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingCliente?: Cliente;
}

export function ClientForm({
  onSubmit,
  onCancel,
  isLoading,
  editingCliente,
}: ClientFormProps) {
  const form = useFormContext<FormValues>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Input
                  placeholder="Dirección"
                  {...field}
                  value={field.value || ''}
                />
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
                <Input
                  placeholder="Localidad"
                  {...field}
                  value={field.value || ''}
                />
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
                <Input
                  placeholder="Nombre de contacto"
                  {...field}
                  value={field.value || ''}
                />
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
                <Input
                  placeholder="Teléfono"
                  {...field}
                  value={field.value || ''}
                />
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
                <Input
                  placeholder="Email"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Guardando...'
              : editingCliente
                ? 'Actualizar'
                : 'Agregar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
