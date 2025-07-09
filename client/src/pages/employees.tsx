import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertEmployeeSchema } from '@shared/schema';
import type {
  Employee,
  InsertEmployee,
  ShiftWithDetails,
} from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';
import { base } from '@/lib/paths';
import { SearchInput } from '@/components/common/search-input';
import { EmployeeForm } from '@/components/employees/employee-form';
import { EmployeeCard } from '@/components/employees/employee-card';

const formSchema = insertEmployeeSchema;
type FormValues = z.infer<typeof formSchema>;

export default function Employees() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee>();
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();
  const threeMonthsLater = addMonths(today, 3);

  const { data: allEmployees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async ({ queryKey }) => {
      const [path] = queryKey;
      const response = await fetch(base(path as string));
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const filteredEmployees = React.useMemo(() => {
    if (!searchTerm) {
      return allEmployees;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allEmployees.filter((employee) =>
      employee.name.toLowerCase().includes(lowercasedSearchTerm),
    );
  }, [allEmployees, searchTerm]);

  const { data: allShifts = [], isLoading: shiftsLoading } = useQuery<
    ShiftWithDetails[]
  >({
    queryKey: [
      '/api/shifts',
      format(today, 'yyyy-MM-dd'),
      format(threeMonthsLater, 'yyyy-MM-dd'),
    ],
    queryFn: async ({ queryKey }) => {
      const [path, startDate, endDate] = queryKey;
      const response = await fetch(
        `${base(path as string)}?startDate=${startDate}&endDate=${endDate}`,
      );
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      const response = await apiRequest('POST', '/api/employees', data);
      const responseBody = await response.json();
      if (!response.ok) {
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setModalOpen(false);
      setEditingEmployee(undefined);
      toast({
        title: 'Empleado creado',
        description: 'El empleado ha sido creado correctamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el empleado.',
        variant: 'destructive',
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertEmployee }) => {
      const response = await apiRequest('PUT', `/api/employees/${id}`, data);
      const responseBody = await response.json();
      if (!response.ok) {
        if (response.status === 404 && responseBody.code === 'NOT_FOUND') {
          throw new Error(responseBody.message || 'Empleado no encontrado');
        }
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return responseBody;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setModalOpen(false);
      setEditingEmployee(undefined);
      toast({
        title: 'Empleado actualizado',
        description: 'El empleado ha sido actualizado correctamente.',
      });
    },
    onError: (error: Error) => {
      let description = 'No se pudo actualizar el empleado.';
      if (error.message.includes('Empleado no encontrado')) {
        description = 'El empleado que intentas actualizar no existe.';
      } else {
        description = error.message;
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/employees/${id}`);
      if (!response.ok) {
        const responseBody = await response.json();
        if (response.status === 404 && responseBody.code === 'NOT_FOUND') {
          throw new Error(responseBody.message || 'Empleado no encontrado');
        }
        throw new Error(responseBody.message || 'Error inesperado');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Empleado eliminado',
        description: 'El empleado ha sido eliminado correctamente.',
      });
    },
    onError: (error: Error) => {
      let description = 'No se pudo eliminar el empleado.';
      if (error.message.includes('Empleado no encontrado')) {
        description = 'El empleado que intentas eliminar no existe.';
      } else {
        description = error.message;
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
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

  const handleSubmit = (data: FormValues) => {
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      status: employee.status,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(undefined);
    form.reset({
      name: '',
      email: '',
      phone: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  if (isLoading || shiftsLoading) {
    return (
      <>
        <Header
          title="Gestión de Empleados"
          subtitle="Administra la información de tu equipo de trabajo"
        />

        <LayoutContent>
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">
                Cargando empleados y turnos...
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
        title="Gestión de Empleados"
        subtitle="Administra la información de tu equipo de trabajo"
        onAddEmployee={handleAdd}
      />

      <LayoutContent>
        <div className="sticky top-0 z-10 flex justify-between items-center p-2 bg-background">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Total <span className="hidden md:inline">Empleados</span> (
              {filteredEmployees.length})
            </h3>
          </div>
          <div className="w-full max-w-56 md:max-w-xs">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar empleado..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 p-2">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No hay empleados registrados
              </h3>
              <p className="text-neutral-500 mb-4">
                Comienza agregando empleados a tu organización
              </p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Empleado
              </Button>
            </div>
          ) : (
            filteredEmployees.map((employee) => {
              const employeeUpcomingShifts = allShifts
                .filter(
                  (shift) =>
                    shift.employeeId === employee.id &&
                    new Date(shift.date) >= today,
                )
                .sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
                )
                .slice(0, 5);

              return (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  upcomingShifts={employeeUpcomingShifts}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isDeleting={deleteEmployeeMutation.isPending}
                />
              );
            })
          )}
        </div>
      </LayoutContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editar Empleado' : 'Agregar Empleado'}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <EmployeeForm
              onSubmit={handleSubmit}
              onCancel={() => setModalOpen(false)}
              isLoading={
                createEmployeeMutation.isPending ||
                updateEmployeeMutation.isPending
              }
              editingEmployee={editingEmployee}
            />
          </FormProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}
