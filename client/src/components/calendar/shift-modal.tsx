import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { insertShiftSchema } from '@shared/schema';
import type { Employee, Position, ShiftWithDetails } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const formSchema = insertShiftSchema.extend({
  employeeId: z.number().min(1, 'El empleado es requerido'),
  positionId: z.number().min(1, 'El puesto es requerido'),
  date: z.string().min(1, 'La fecha es requerida'),
});

type FormValues = z.infer<typeof formSchema>;

interface ShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  positions: Position[];
  selectedEmployee?: Employee | null;
  selectedDate?: Date;
  editingShift?: ShiftWithDetails;
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
}

export function ShiftModal({
  open,
  onOpenChange,
  employees,
  positions,
  selectedEmployee,
  selectedDate,
  editingShift,
  onSubmit,
  isLoading = false,
}: ShiftModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: 0,
      positionId: 0,
      date: selectedDate ? formatDate(selectedDate) : '',
      notes: '',
    },
  });
  const { isDirty } = form.formState;

  const employeeTriggerRef = React.useRef<HTMLButtonElement>(null);
  const positionTriggerRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editingShift) {
      form.reset({
        employeeId: editingShift.employeeId,
        positionId: editingShift.positionId,
        date: editingShift.date,
        notes: editingShift.notes || '',
      });
    } else if (selectedDate || selectedEmployee) {
      form.reset({
        employeeId: selectedEmployee ? selectedEmployee.id : 0,
        positionId: 0,
        date: selectedDate ? formatDate(selectedDate) : '',
        notes: '',
      });
    } else {
      // Caso: todo vacío
      form.reset({
        employeeId: 0,
        positionId: 0,
        date: '',
        notes: '',
      });
    }
  }, [editingShift, selectedDate, selectedEmployee, form]);

  const handleSubmit = (data: FormValues) => {
    if (
      editingShift &&
      data.employeeId === editingShift.employeeId &&
      data.positionId === editingShift.positionId &&
      data.date === editingShift.date &&
      (data.notes || '') === (editingShift.notes || '')
    ) {
      // No hay cambios, cerrar el modal
      onOpenChange(false);
      form.reset();
      return;
    }
    onSubmit(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const handleInvalid = (errors: any) => {
    setTimeout(() => {
      if (errors.employeeId && employeeTriggerRef.current) {
        employeeTriggerRef.current.focus();
      } else if (errors.positionId && positionTriggerRef.current) {
        positionTriggerRef.current.focus();
      } else if (errors.date) {
        form.setFocus('date');
      }
    }, 1); // 50ms suele ser suficiente, puedes ajustar si lo ves necesario
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingShift ? 'Editar Turno' : 'Asignar Nuevo Turno'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
            className="space-y-4"
          >
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ''}
                    disabled={!!editingShift}
                  >
                    <FormControl>
                      <SelectTrigger ref={employeeTriggerRef}>
                        <SelectValue placeholder="Seleccionar empleado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees
                        .filter((emp) => emp.status === 'active')
                        .map((employee) => (
                          <SelectItem
                            key={employee.id}
                            value={employee.id.toString()}
                          >
                            {employee.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Position Selection */}
            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puesto</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ''}
                  >
                    <FormControl>
                      <SelectTrigger ref={positionTriggerRef}>
                        <SelectValue placeholder="Seleccionar puesto..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem
                          key={position.id}
                          value={position.id.toString()}
                        >
                          {position.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!!editingShift} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales sobre el turno..."
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (editingShift && !isDirty)}
              >
                {isLoading
                  ? 'Guardando...'
                  : editingShift
                    ? 'Actualizar'
                    : 'Asignar Turno'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
