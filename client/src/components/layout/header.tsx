import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMonthName, getWeekRange, getDayDisplay } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentDate?: Date;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  onAddShift?: () => void;
  viewMode?: 'month' | 'week' | 'day';
  onViewModeChange?: (mode: 'month' | 'week' | 'day') => void;
}

export function Header({
  title,
  subtitle,
  currentDate,
  onPreviousMonth,
  onNextMonth,
  onAddShift,
  viewMode = 'month',
  onViewModeChange,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Month Selector */}
        {currentDate && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPreviousMonth}
              className="p-2 text-neutral-400 hover:text-neutral-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold text-neutral-900 min-w-[200px] text-center">
              {viewMode === 'month' &&
                `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`}
              {viewMode === 'week' && getWeekRange(currentDate)}
              {viewMode === 'day' && getDayDisplay(currentDate)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextMonth}
              className="p-2 text-neutral-400 hover:text-neutral-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* View Toggle */}
        {onViewModeChange && (
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange(mode)}
                className={
                  viewMode === mode
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Semana' : 'Día'}
              </Button>
            ))}
          </div>
        )}

        {/* Add Shift Button */}
        {onAddShift && (
          <Button onClick={onAddShift} className="bg-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Asignar Turno
          </Button>
        )}
      </div>
    </div>
  );
}
