import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertShiftSchema } from "@shared/schema";
import type { Employee, Position, ShiftType, ShiftWithDetails } from "@shared/schema";
import { formatDate, getShiftColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

const formSchema = insertShiftSchema.extend({
  date: z.string().min(1, "La fecha es requerida"),
});

type FormValues = z.infer<typeof formSchema>;

interface ShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  positions: Position[];
  shiftTypes: ShiftType[];
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
  shiftTypes,
  selectedDate,
  editingShift,
  onSubmit,
  isLoading = false,
}: ShiftModalProps) {
  const [selectedShiftType, setSelectedShiftType] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: 0,
      positionId: 0,
      shiftTypeId: 0,
      date: selectedDate ? formatDate(selectedDate) : "",
      notes: "",
    },
  });

  useEffect(() => {
    if (editingShift) {
      form.reset({
        employeeId: editingShift.employeeId,
        positionId: editingShift.positionId,
        shiftTypeId: editingShift.shiftTypeId,
        date: editingShift.date,
        notes: editingShift.notes || "",
      });
      setSelectedShiftType(editingShift.shiftTypeId);
    } else if (selectedDate) {
      form.reset({
        employeeId: 0,
        positionId: 0,
        shiftTypeId: 0,
        date: formatDate(selectedDate),
        notes: "",
      });
      setSelectedShiftType(null);
    }
  }, [editingShift, selectedDate, form]);

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setSelectedShiftType(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingShift ? "Editar Turno" : "Asignar Nuevo Turno"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees
                        .filter(emp => emp.status === 'active')
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
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
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

            {/* Shift Type Selection */}
            <FormField
              control={form.control}
              name="shiftTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Turno</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {shiftTypes.map((shiftType) => {
                      const color = getShiftColor(shiftType.code);
                      const isSelected = selectedShiftType === shiftType.id;
                      
                      return (
                        <button
                          key={shiftType.id}
                          type="button"
                          onClick={() => {
                            field.onChange(shiftType.id);
                            setSelectedShiftType(shiftType.id);
                          }}
                          className={cn(
                            "p-3 border-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2",
                            isSelected ? [
                              color === 'blue' && "border-blue-200 bg-blue-50 text-blue-800",
                              color === 'green' && "border-green-200 bg-green-50 text-green-800",
                              color === 'orange' && "border-orange-200 bg-orange-50 text-orange-800",
                              color === 'purple' && "border-purple-200 bg-purple-50 text-purple-800",
                            ] : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            color === 'blue' && "bg-blue-500",
                            color === 'green' && "bg-green-500",
                            color === 'orange' && "bg-orange-500",
                            color === 'purple' && "bg-purple-500"
                          )} />
                          <div className="text-left">
                            <div>{shiftType.name}</div>
                            <div className="text-xs opacity-75">
                              {shiftType.startTime} - {shiftType.endTime}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
                    <Input type="date" {...field} />
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
                      value={field.value || ""}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : editingShift ? "Actualizar" : "Asignar Turno"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
