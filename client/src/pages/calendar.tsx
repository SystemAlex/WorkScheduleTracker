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
  ShiftType,
} from '@shared/schema';
import { getApiUrl } from '@/lib/paths';

type ViewMode = 'month' | 'week' | 'day';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftWithDetails>();
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const { toast } = useToast();
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
        getApiUrl(
          `/api/shifts?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`,
        ),
      );
      if (!response.ok) throw new Error('Failed to fetch shifts');
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  const { data: shiftTypes = [] } = useQuery<ShiftType[]>({
    queryKey: ['/api/shift-types'],
  });

  // Mutations
  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/shifts', data);
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
      toast({
        title: 'Error',
        description: error.message || 'No se pudo asignar el turno.',
        variant: 'destructive',
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: number) => {
      await apiRequest('DELETE', `/api/shifts/${shiftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: 'Turno eliminado',
        description: 'El turno ha sido eliminado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el turno.',
        variant: 'destructive',
      });
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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEmployeeDateSelect = (date: Date, employee: Employee) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
  };

  const handleEmployeeAddShift = (date: Date, employee: Employee) => {
    setSelectedDate(date);
    setSelectedEmployee(employee);
    setEditingShift(undefined);
    setModalOpen(true);
  };

  const handleAddShift = () => {
    setEditingShift(undefined);
    setModalOpen(true);
  };

  const handleEditShift = (shift: ShiftWithDetails) => {
    setEditingShift(shift);
    setModalOpen(true);
  };

  const handleDeleteShift = (shiftId: number) => {
    if (confirm('¿Estás seguro de que quieres eliminar este turno?')) {
      deleteShiftMutation.mutate(shiftId);
    }
  };

  const handleShiftSubmit = (data: any) => {
    createShiftMutation.mutate(data);
  };

  if (shiftsLoading) {
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayoutContent>
          <EmployeeCalendarGrid
            currentDate={currentDate}
            shifts={shifts}
            employees={employees}
            selectedDate={selectedDate}
            onDateSelect={handleEmployeeDateSelect}
            onAddShift={handleEmployeeAddShift}
            viewMode={viewMode}
          />
        </LayoutContent>
      </div>

      <ShiftModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employees={employees}
        positions={positions}
        shiftTypes={shiftTypes}
        selectedDate={selectedDate}
        editingShift={editingShift}
        onSubmit={handleShiftSubmit}
        isLoading={createShiftMutation.isPending}
      />
    </>
  );
}
