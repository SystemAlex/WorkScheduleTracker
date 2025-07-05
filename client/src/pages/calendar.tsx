import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { EmployeeCalendarGrid } from '@/components/calendar/employee-calendar-grid';
import { QuickPanel } from '@/components/calendar/quick-panel';
import { ShiftModal } from '@/components/calendar/shift-modal';
import { LayoutContent, LayoutPanel } from '@/components/ui/layout';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type {
  ShiftWithDetails,
  Employee,
  Position,
  Cliente,
  InsertShift, // Import InsertShift type
} from '@shared/schema';
import { base } from '@/lib/paths';
import { subMonths } from 'date-fns'; // Import subMonths
import { formatYearMonth } from '@shared/utils'; // Import formatYearMonth from shared

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftWithDetails>();
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { toast, dismiss } = useToast(); // Destructure toast and dismiss
  const queryClient = useQueryClient();

  // Queries
  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<
    ShiftWithDetails[]
  >({
    queryKey: [
      '/api/shifts',
      currentDate.getMonth() + 1,
      currentDate.getFullYear(),
    ],
    queryFn: async () => {
      const response = await fetch(
        base(
          `/api/shifts?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`,
        ),
      );
      if (!response.ok) throw new Error('Failed to fetch shifts');
      const data = await response.json();
      return data;
    },
  });

  const previousMonthDate = subMonths(currentDate, 1);
  const { data: previousMonthShifts = [], isLoading: previousShiftsLoading } =
    useQuery<ShiftWithDetails[]>({
      queryKey: [
        '/api/shifts',
        previousMonthDate.getMonth() + 1,
        previousMonthDate.getFullYear(),
        'previousMonth', // Add a distinct key part for previous month shifts
      ],
      queryFn: async () => {
        const response = await fetch(
          base(
            `/api/shifts?month=${previousMonthDate.getMonth() + 1}&year=${previousMonthDate.getFullYear()}`,
          ),
        );
        if (!response.ok)
          throw new Error('Failed to fetch previous month shifts');
        return response.json();
      },
    });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (data: InsertShift) => {
      // Use InsertShift type
      const response = await apiRequest('POST', '/api/shifts', data);

      if (response.status === 409) {
        const body = await response.json();
        throw new Error(body.message || 'Conflicto de turno');
      }
      if (response.status === 400) {
        const body = await response.json();
        throw new Error(body.message || 'Datos inválidos');
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Error inesperado');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setModalOpen(false);
      setEditingShift(undefined);
      toast({
        title: 'Turno asignado',
        description: 'El turno ha sido asignado correctamente.',
      });
    },
    onError: (error: any) => {
      let description = 'No se pudo asignar el turno.';
      if (
        error.message?.includes('conflict') ||
        error.message?.includes('Conflicto')
      ) {
        description = 'Ya existe un turno para ese empleado en esa fecha.';
      } else if (
        error.message?.includes('inválidos') ||
        error.message?.includes('Invalid')
      ) {
        description = 'Los datos ingresados no son válidos.';
      } else if (error.message?.includes('not found')) {
        description = 'El turno no existe.';
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InsertShift }) => {
      // Use InsertShift type
      const response = await apiRequest('PUT', `/api/shifts/${id}`, data);

      if (response.status === 409) {
        const body = await response.json();
        throw new Error(body.message || 'Conflicto de turno');
      }
      if (response.status === 400) {
        const body = await response.json();
        throw new Error(body.message || 'Datos inválidos');
      }
      if (response.status === 404) {
        const body = await response.json();
        throw new Error(body.message || 'Turno no encontrado');
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Error inesperado');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      setModalOpen(false);
      setEditingShift(undefined);
      toast({
        title: 'Turno actualizado',
        description: 'El turno ha sido actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      let description = 'No se pudo actualizar el turno.';
      if (
        error.message?.includes('conflict') ||
        error.message?.includes('Conflicto')
      ) {
        description = 'Ya existe un turno para ese empleado en esa fecha.';
      } else if (
        error.message?.includes('inválidos') ||
        error.message?.includes('Invalid')
      ) {
        description = 'Los datos ingresados no son válidos.';
      } else if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        description = 'El turno no existe.';
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      const response = await apiRequest('DELETE', `/api/shifts/${shiftId}`);
      if (response.status === 404) {
        const body = await response.json();
        throw new Error(body.message || 'Turno no encontrado');
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Error inesperado');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      if (editingShift) {
        setSelectedDate(new Date(editingShift.date));
        setSelectedEmployee(
          employees.find((e) => e.id === editingShift.employeeId),
        );
        setEditingShift(undefined);
      }
      toast({
        title: 'Turno eliminado',
        description: 'El turno ha sido eliminado correctamente.',
      });
    },

    onError: (error: any) => {
      let description = 'No se pudo eliminar el turno.';
      if (
        error.message?.includes('not found') ||
        error.message?.includes('no encontrado')
      ) {
        description = 'El turno no existe.';
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    },
  });

  const generateShiftsMutation = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const loadingToastId = toast({
        title: 'Generando turnos...',
        description: 'Esto puede tomar un momento.',
        duration: Infinity, // Keep open until dismissed
      });

      try {
        const response = await apiRequest(
          'POST',
          '/api/shifts/generate-from-previous-month',
          { month, year },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Error al generar turnos.');
        }
        const data = await response.json();
        dismiss(loadingToastId.id); // Use dismiss from useToast hook
        toast({
          title: 'Turnos generados',
          description: `Se generaron ${data.count} turnos para el mes actual.`,
        });
        return data;
      } catch (error: any) {
        dismiss(loadingToastId.id); // Use dismiss from useToast hook
        toast({
          title: 'Error',
          description: error.message || 'No se pudieron generar los turnos.',
          variant: 'destructive',
        });
        throw error; // Re-throw to let React Query handle it
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    },
    onError: () => {
      // Toast is handled within mutationFn
    },
  });

  // Event handlers
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }

    setCurrentDate(newDate);
  };

  const handleEmployeeDateSelect = (date?: Date, employee?: Employee) => {
    setSelectedDate(date);
    if (date) {
      setCurrentDate(date);
    }
    setSelectedEmployee(employee);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  const handleEmployeeAddShift = (date: Date, employee: Employee) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
    setEditingShift(undefined);
    setModalOpen(true);
  };

  const handleAddShift = () => {
    setEditingShift(undefined);
    setSelectedEmployee(undefined);
    setSelectedDate(undefined);
    setModalOpen(true);
  };

  const handleEditShift = (shift: ShiftWithDetails) => {
    setEditingShift(shift);
    setModalOpen(true);
  };

  const handleDeleteShift = (shiftId: number) => {
    deleteShiftMutation.mutate(shiftId);
  };

  const handleShiftSubmit = (data: InsertShift) => {
    // Define handleShiftSubmit
    if (editingShift) {
      updateShiftMutation.mutate({ id: editingShift.id, data });
    } else {
      createShiftMutation.mutate(data);
    }
  };

  const handleGenerateShifts = () => {
    // Pass the current month and year to the mutation
    generateShiftsMutation.mutate({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });
  };

  // Determine if the generate shifts button should be disabled
  const disableGenerateShifts =
    shifts.length > 0 || generateShiftsMutation.isPending;

  if (
    shiftsLoading ||
    previousShiftsLoading ||
    generateShiftsMutation.isPending
  ) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">
            Cargando calendario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Calendario de Turnos"
        subtitle="Gestiona los horarios y asignaciones de tu equipo"
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onAddShift={handleAddShift}
        onGenerateShifts={handleGenerateShifts} // Pass the new handler
        disableGenerateShifts={disableGenerateShifts} // Pass the disable state
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayoutContent>
          <EmployeeCalendarGrid
            currentDate={currentDate}
            shifts={shifts}
            previousMonthShifts={previousMonthShifts} // Pass previous month shifts
            employees={employees}
            positions={positions}
            clientes={clientes}
            selectedDate={selectedDate}
            onDateSelect={handleEmployeeDateSelect}
            onAddShift={handleEmployeeAddShift}
            viewMode={viewMode}
            selectedEmployee={selectedEmployee}
            onEditShift={handleEditShift}
          />
        </LayoutContent>
      </div>

      <ShiftModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employees={employees}
        positions={positions}
        selectedDate={selectedDate}
        selectedEmployee={selectedEmployee}
        editingShift={editingShift}
        onSubmit={handleShiftSubmit}
        isLoading={
          createShiftMutation.isPending ||
          updateShiftMutation.isPending ||
          deleteShiftMutation.isPending ||
          generateShiftsMutation.isPending
        }
        onDelete={editingShift ? handleDeleteShift : undefined}
      />
    </>
  );
}
