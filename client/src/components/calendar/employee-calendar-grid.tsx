import * as React from 'react';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ShiftWithDetails, Employee } from '@shared/schema';
import { getShiftColor, getDayName } from '@/lib/utils';

interface EmployeeCalendarGridProps {
  currentDate: Date;
  shifts: ShiftWithDetails[];
  employees: Employee[];
  selectedDate?: Date;
  onDateSelect?: (date: Date, employee: Employee) => void;
  onAddShift?: (date: Date, employee: Employee) => void;
  viewMode?: 'month' | 'week' | 'day';
}

export function EmployeeCalendarGrid({
  currentDate,
  shifts,
  employees,
  selectedDate,
  onDateSelect,
  onAddShift,
  viewMode = 'month',
}: EmployeeCalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);

  // Generate array of day numbers based on view mode
  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [currentDate.getDate()];
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        if (day.getMonth() === month) {
          weekDays.push(day.getDate());
        }
      }
      return weekDays;
    } else {
      return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }
  };

  const dayNumbers = getDaysToShow();

  // Get shifts for a specific employee and date
  const getShiftForEmployeeAndDate = (employeeId: number, day: number) => {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
    return shifts.find(
      (shift) =>
        shift.employeeId === employeeId &&
        format(new Date(shift.date), 'yyyy-MM-dd') === dateStr,
    );
  };

  // Get position siglas from shift
  const getPositionSiglas = (shift: ShiftWithDetails) => {
    return (
      shift.position.siglas || shift.position.name.substring(0, 3).toUpperCase()
    );
  };

  const handleCellClick = (day: number, employee: Employee) => {
    const date = new Date(year, month, day);
    onDateSelect?.(date, employee);
  };

  const handleAddClick = (
    e: React.MouseEvent,
    day: number,
    employee: Employee,
  ) => {
    e.stopPropagation();
    const date = new Date(year, month, day);
    onAddShift?.(date, employee);
  };

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-fit">
        {/* Header with day names and numbers */}
        <div
          className="grid grid-cols-[200px_repeat(var(--days),minmax(38px,1fr))] gap-1 mb-2"
          style={{ '--days': dayNumbers.length } as React.CSSProperties}
        >
          <div className="font-semibold text-sm text-neutral-600 p-2">
            Empleado
          </div>
          {dayNumbers.map((day) => {
            const date = new Date(year, month, day);
            const dayOfWeek = getDay(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const dayAbbr = getDayName(dayOfWeek).toUpperCase();

            // Colores según el día de la semana
            let dayColor = 'bg-cyan-100 text-cyan-800'; // Días de semana (lunes-viernes) en celeste
            if (dayOfWeek === 6) dayColor = 'bg-yellow-100 text-yellow-800'; // Sábado en amarillo
            if (dayOfWeek === 0) dayColor = 'bg-red-100 text-red-800'; // Domingo en rojo

            if (isToday) dayColor = 'bg-primary text-primary-foreground';

            return (
              <div
                key={day}
                className={`text-center p-1 text-xs font-medium rounded-md ${dayColor}`}
              >
                <div className="font-bold text-[10px] leading-tight">
                  {dayAbbr}
                </div>
                <div className="font-bold text-sm leading-tight">{day}</div>
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        <div className="space-y-1">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="grid grid-cols-[200px_repeat(var(--days),minmax(38px,1fr))] gap-1 items-center"
              style={{ '--days': dayNumbers.length } as React.CSSProperties}
            >
              {/* Employee name */}
              <div className="font-medium text-sm p-2 truncate bg-neutral-50 rounded-md">
                {employee.name}
              </div>

              {/* Days */}
              {dayNumbers.map((day) => {
                const shift = getShiftForEmployeeAndDate(employee.id, day);
                const date = new Date(year, month, day - 1);
                const dayOfWeek = getDay(date);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSelected =
                  selectedDate &&
                  selectedDate.toDateString() === date.toDateString();

                return (
                  <div
                    key={`${employee.id}-${day}`}
                    className={`
                      min-h-[40px] p-1 rounded-md border cursor-pointer
                      transition-colors duration-150 relative group
                      ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-1'
                          : 'hover:bg-neutral-50'
                      }
                      ${isWeekend ? 'bg-neutral-100' : 'bg-white'}
                    `}
                    onClick={() => handleCellClick(day, employee)}
                  >
                    {shift ? (
                      <Badge
                        variant="secondary"
                        className={`
                          text-xs px-1 py-0.5 w-full justify-center
                          ${getShiftColor(shift.shiftType.code)}
                        `}
                      >
                        {getPositionSiglas(shift)}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 w-full h-full p-0"
                        onClick={(e) => handleAddClick(e, day, employee)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-neutral-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">Leyenda:</h4>
          <div className="text-xs text-neutral-600">
            <p>• Las siglas representan el puesto asignado</p>
            <p>• Haz clic en una celda vacía para asignar un turno</p>
            {/*<p>• Los fines de semana están marcados en gris</p>*/}
          </div>
        </div>
      </div>
    </div>
  );
}
