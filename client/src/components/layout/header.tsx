import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal } from 'lucide-react';
import { getMonthName, getWeekRange, getDayDisplay } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentDate?: Date;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
  onAddShift?: () => void;
  onAddEmployee?: () => void;
  onAddPosition?: () => void;
  onAddClient?: () => void;
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
  onAddEmployee,
  onAddPosition,
  onAddClient,
  viewMode = 'month',
  onViewModeChange,
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b gap-2 px-2 mt-2">
      <div className="relative overflow-hidden flex-grow ml-16 md:ml-0">
        <h2 className="text-2xl font-bold text-neutral-900 truncate whitespace-nowrap overflow-hidden">
          {title}
        </h2>
        <br />
        {subtitle && (
          <p className="w-full absolute right-0 bottom-0 text-sm text-neutral-500 mt-1 truncate whitespace-nowrap overflow-hidden">
            {subtitle}
          </p>
        )}
      </div>

      <>
        {/* Add Shift Button */}
        {((currentDate && onAddShift && onViewModeChange) ||
          onAddEmployee ||
          onAddPosition ||
          onAddClient) && (
          <>
            {/* Toolbar visible en md+ */}
            <div
              className={`hidden ${onAddEmployee || onAddPosition || onAddClient ? 'md:flex' : 'lg:flex'} items-center space-x-4`}
            >
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
                      {mode === 'month'
                        ? 'Mes'
                        : mode === 'week'
                          ? 'Semana'
                          : 'Día'}
                    </Button>
                  ))}
                </div>
              )}

              {/* Add Shift Button */}
              {onAddShift && (
                <Button onClick={onAddShift}>
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar Turno
                </Button>
              )}

              {/* Add Employee Button */}
              {onAddEmployee && (
                <Button onClick={onAddEmployee}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Empleado
                </Button>
              )}

              {/* Add Employee Button */}
              {onAddPosition && (
                <Button onClick={onAddPosition}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Puesto
                </Button>
              )}

              {/* Add Employee Button */}
              {onAddClient && (
                <Button onClick={onAddClient}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cliente
                </Button>
              )}
            </div>

            {/* Dropdown para móvil */}
            <div
              className={`${onAddEmployee || onAddPosition || onAddClient ? 'md:hidden' : 'flex lg:hidden'}`}
            >
              <DropdownMenu>
                {/* Add Employee Button */}
                {onAddEmployee && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onAddEmployee}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Agregar Empleado</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Add Position Button */}
                {onAddPosition && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onAddPosition}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Agregar Puesto</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Add Client Button */}
                {onAddClient && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={onAddClient}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Agregar Cliente</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Add Shift Button */}
                {onAddShift && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={onAddShift}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Asignar Turno</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Más</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
                <DropdownMenuContent
                  align="end"
                  className="flex flex-col items-center space-x-2"
                >
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
                    <div className="w-fit flex bg-neutral-100 rounded-lg p-1">
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
                          {mode === 'month'
                            ? 'Mes'
                            : mode === 'week'
                              ? 'Semana'
                              : 'Día'}
                        </Button>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </>
    </div>
  );
}
