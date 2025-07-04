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
import type { Employee, InsertEmployee, ShiftWithDetails } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { addMonths, format } from 'date-fns';
import { base } from '@/lib/paths';
import { SearchInput } from '@/components/common/search-input';
import { EmployeeForm } from '@/components/employees/employee-form'; // Import new form component
import { EmployeeCard } from '@/components/employees/employee-card'; // Import new card component

const formSchema = insertEmployeeSchema;
type FormValues = z.infer<typeof formSchema>;

export default function Employees() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee>();
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();
  const threeMonthsLater = addMonths(today, 3); // Fetch shifts for next 3 months

  // Fetch all employees initially
  const { data: allEmployees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async ({ queryKey }) => {
      const [path] = queryKey;
      const response = await fetch(base(path as string));
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  // Filter employees on the frontend based on searchTerm
  const filteredEmployees = React.useMemo(() => {
    if (!searchTerm) {
      return allEmployees;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return allEmployees.filter(employee =>
      employee.name.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [allEmployees, searchTerm]);


  const { data: allShifts = [], isLoading: shiftsLoading } = useQuery<
    ShiftWithDetails[]
  >({
    queryKey: [
      '/api/shifts',
      format(today, 'yyyy-MM-dd'), // startDate
      format(threeMonthsLater, 'yyyy-MM-dd'), // endDate
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
      return response.json();
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo crear el empleado.',
        variant: 'destructive',
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertEmployee }) => {
      const response = await apiRequest('PUT', `/api/employees/${id}`, data);
      return response.json();
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
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el empleado.',
        variant: 'destructive',
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: 'Empleado eliminado',
        description: 'El empleado ha sido eliminado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el empleado.',
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Cargando empleados y turnos...</p>
        </div>
      </div>
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
        <div className="flex justify-between items-center p-2">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Total Empleados ({filteredEmployees.length})
            </h3>
          </div>
          <div className="w-full max-w-xs">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar empleado..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
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
                    new Date(shift.date) >= today
                )
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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