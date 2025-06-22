import * as React from 'react';
import { generateCalendarDays, formatDate } from '@/lib/utils';
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
          const dayShifts = shifts.filter(
            (shift) => shift.date === formatDate(day.date),
          );
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
                  const color = shift.position.color;
                  return (
                    <div
                      key={shift.id}
                      className="shift-indicator flex items-center space-x-2 rounded-full border px-2 py-1"
                      style={{
                        backgroundColor: `${color}20`, // HEX + transparencia
                        borderColor: color,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium" style={{ color }}>
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
    </div>
  );
}
