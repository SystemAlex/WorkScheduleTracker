import * as React from 'react';
import { generateCalendarDays, formatDate, getShiftColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ShiftWithDetails } from '@shared/schema';

interface CalendarGridProps {
  currentDate: Date;
  shifts: ShiftWithDetails[];
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

export function CalendarGrid({
  currentDate,
  shifts,
  selectedDate,
  onDateSelect,
}: CalendarGridProps) {
  const days = generateCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );

  const getShiftsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return shifts.filter((shift) => shift.date === dateStr);
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden mb-4">
        {dayNames.map((day) => (
          <div
            key={day}
            className="bg-neutral-100 p-3 text-center text-sm font-semibold text-neutral-700"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden">
        {days.map((day, index) => {
          const dayShifts = getShiftsForDate(day.date);
          const isSelected =
            selectedDate && formatDate(selectedDate) === formatDate(day.date);

          return (
            <div
              key={index}
              className={cn(
                'calendar-day p-2 h-32',
                !day.isCurrentMonth && 'bg-neutral-50',
                day.isCurrentMonth && 'bg-white',
                day.isToday && 'today',
                isSelected && 'selected',
              )}
              onClick={() => onDateSelect?.(day.date)}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  day.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400',
                  day.isToday && 'text-primary font-bold',
                )}
              >
                {day.date.getDate()}
              </span>

              {/* Shift Indicators */}
              <div className="mt-1 space-y-1">
                {dayShifts.slice(0, 3).map((shift) => {
                  const color = getShiftColor(shift.shiftType.code);
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'shift-indicator',
                        `shift-${
                          color === 'blue'
                            ? 'morning'
                            : color === 'green'
                              ? 'afternoon'
                              : color === 'orange'
                                ? 'night'
                                : 'special'
                        }`,
                      )}
                    >
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full',
                          color === 'blue' && 'bg-blue-500',
                          color === 'green' && 'bg-green-500',
                          color === 'orange' && 'bg-orange-500',
                          color === 'purple' && 'bg-purple-500',
                        )}
                      />
                      <span>
                        {shift.shiftType.code}:{' '}
                        {shift.employee.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
                {dayShifts.length > 3 && (
                  <div className="text-xs text-neutral-500 px-2">
                    +{dayShifts.length - 3} más
                  </div>
                )}
              </div>

              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Leyenda de Turnos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-neutral-700">
              Mañana (M) - 6:00-14:00
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-neutral-700">
              Tarde (T) - 14:00-22:00
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-neutral-700">
              Noche (N) - 22:00-6:00
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-neutral-700">
              Especial (E) - Variable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
