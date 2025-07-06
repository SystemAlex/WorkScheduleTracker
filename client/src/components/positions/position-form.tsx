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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { insertPositionSchema } from '@shared/schema';
import type { Cliente, Position } from '@shared/schema';

type FormValues = z.infer<typeof insertPositionSchema>;

interface PositionFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingPosition?: Position;
  clientes: Cliente[];
}

export function PositionForm({
  onSubmit,
  onCancel,
  isLoading,
  editingPosition,
  clientes,
}: PositionFormProps) {
  const form = useFormContext<FormValues>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  value={field.value || ''}
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
                  value={field.value || ''}
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
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
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
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              : editingPosition
                ? 'Actualizar'
                : 'Agregar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
