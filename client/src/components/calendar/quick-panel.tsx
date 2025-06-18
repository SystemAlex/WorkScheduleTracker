import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit3, Trash2, User, Clock } from 'lucide-react';
import { formatDate, getShiftColor } from '@/lib/utils';
import type { ShiftWithDetails, Employee } from '@shared/schema';
import { cn } from '@/lib/utils';

interface QuickPanelProps {
  selectedDate?: Date;
  shifts: ShiftWithDetails[];
  employees: Employee[];
  onAddShift?: () => void;
  onEditShift?: (shift: ShiftWithDetails) => void;
  onDeleteShift?: (shiftId: number) => void;
}

export function QuickPanel({
  selectedDate,
  shifts,
  employees,
  onAddShift,
  onEditShift,
  onDeleteShift,
}: QuickPanelProps) {
  const dayShifts = selectedDate
    ? shifts.filter((shift) => shift.date === formatDate(selectedDate))
    : [];

  const availableEmployees = employees.filter(
    (emp) =>
      emp.status === 'active' &&
      !dayShifts.some((shift) => shift.employee.id === emp.id),
  );

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  return (
    <>
      {/* Panel Header */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900">Panel Rápido</h3>
        <p className="text-sm text-neutral-500 mt-1">
          {selectedDate
            ? 'Información del día seleccionado'
            : 'Selecciona un día'}
        </p>
      </div>

      {/* Selected Day Info */}
      {selectedDate && (
        <div className="p-4 border-b border-neutral-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {selectedDate.getDate()}
            </div>
            <div className="text-sm text-neutral-500">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </div>
            <div className="text-sm font-medium text-neutral-700 mt-1">
              {dayNames[selectedDate.getDay()]}
            </div>
          </div>
        </div>
      )}

      {/* Today Shifts */}
      <div className="flex-1 p-4 overflow-auto">
        {selectedDate && (
          <>
            <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
              Turnos Asignados
            </h4>

            <div className="space-y-4">
              {dayShifts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-neutral-400 mb-2">
                    <Clock className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-sm text-neutral-500">
                    No hay turnos asignados
                  </p>
                </div>
              ) : (
                dayShifts.map((shift) => {
                  const color = getShiftColor(shift.shiftType.code);
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'border rounded-lg p-4',
                        color === 'blue' && 'bg-blue-50 border-blue-200',
                        color === 'green' && 'bg-green-50 border-green-200',
                        color === 'orange' && 'bg-orange-50 border-orange-200',
                        color === 'purple' && 'bg-purple-50 border-purple-200',
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full',
                              color === 'blue' && 'bg-blue-500',
                              color === 'green' && 'bg-green-500',
                              color === 'orange' && 'bg-orange-500',
                              color === 'purple' && 'bg-purple-500',
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              color === 'blue' && 'text-blue-900',
                              color === 'green' && 'text-green-900',
                              color === 'orange' && 'text-orange-900',
                              color === 'purple' && 'text-purple-900',
                            )}
                          >
                            {shift.shiftType.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            color === 'blue' && 'text-blue-700 bg-blue-100',
                            color === 'green' && 'text-green-700 bg-green-100',
                            color === 'orange' &&
                              'text-orange-700 bg-orange-100',
                            color === 'purple' &&
                              'text-purple-700 bg-purple-100',
                          )}
                        >
                          {shift.shiftType.startTime} -{' '}
                          {shift.shiftType.endTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              color === 'blue' && 'bg-blue-200',
                              color === 'green' && 'bg-green-200',
                              color === 'orange' && 'bg-orange-200',
                              color === 'purple' && 'bg-purple-200',
                            )}
                          >
                            <User
                              className={cn(
                                'w-4 h-4',
                                color === 'blue' && 'text-blue-600',
                                color === 'green' && 'text-green-600',
                                color === 'orange' && 'text-orange-600',
                                color === 'purple' && 'text-purple-600',
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {shift.employee.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {shift.position.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditShift?.(shift)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteShift?.(shift.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 space-y-3">
              <Button
                onClick={onAddShift}
                className="w-full bg-primary hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Turno
              </Button>
            </div>

            {/* Available Employees */}
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
                Empleados Disponibles
              </h4>
              <div className="space-y-3">
                {availableEmployees.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4">
                    No hay empleados disponibles
                  </p>
                ) : (
                  availableEmployees.slice(0, 5).map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {employee.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          Disponible
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
