import * as React from 'react';
import { format, getDaysInMonth, getDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type {
  ShiftWithDetails,
  Employee,
  Cliente,
  Position,
} from '@shared/schema';
import { getDayName, formatDate, lighten } from '@/lib/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface EmployeeCalendarGridProps {
  currentDate: Date;
  shifts: ShiftWithDetails[];
  employees: Employee[];
  positions: Position[];
  clientes: Cliente[];
  selectedDate?: Date;
  onDateSelect?: (date: Date, employee?: Employee) => void;
  selectedEmployee?: Employee;
  onAddShift?: (date: Date, employee: Employee) => void;
  onEditShift?: (shift: ShiftWithDetails) => void;
  viewMode?: 'month' | 'week' | 'day';
}

export function EmployeeCalendarGrid({
  currentDate,
  shifts,
  employees,
  positions,
  clientes,
  selectedDate,
  selectedEmployee,
  onDateSelect,
  onAddShift,
  onEditShift,
  viewMode = 'month',
}: EmployeeCalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);

  // Agrupar empleados por cliente
  const empleadosPorCliente: Record<number, Employee[]> = {};

  employees.forEach((emp) => {
    const position = positions.find((p) => p.name === emp.position);
    if (position && position.clienteId) {
      if (!empleadosPorCliente[position.clienteId]) {
        empleadosPorCliente[position.clienteId] = [];
      }
      empleadosPorCliente[position.clienteId].push(emp);
    }
  });

  // Ordenar empleados alfabéticamente por nombre en cada cliente
  Object.values(empleadosPorCliente).forEach((arr) =>
    arr.sort((a, b) => a.name.localeCompare(b.name)),
  );

  // Generate array of dates based on view mode
  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        weekDays.push(day);
      }
      return weekDays;
    } else {
      return Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, month, i + 1),
      );
    }
  };

  const daysToShow = getDaysToShow();

  // Get shifts for a specific employee and date
  const getShiftForEmployeeAndDate = (employeeId: number, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
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

  const handleCellClick = (date: Date, employee: Employee) => {
    onDateSelect?.(date, employee);
  };

  const handleAddClick = (
    e: React.MouseEvent,
    date: Date,
    employee: Employee,
  ) => {
    e.stopPropagation();
    onAddShift?.(date, employee);
  };

  // Estado para controlar qué Accordions están abiertos
  const [openAccordions, setOpenAccordions] = React.useState(
    clientes.map((c) => `cliente-${c.id}`),
  );

  // Sincroniza Accordions abiertos si cambia la lista de clientes
  React.useEffect(() => {
    setOpenAccordions(clientes.map((c) => `cliente-${c.id}`));
  }, [clientes]);

  return (
    <div className="w-full overflow-y-hidden overflow-x-auto p-2 h-full">
      <div className="min-w-fit overflow-auto relative h-full">
        {/* Header with day names and numbers */}
        <div
          className="sticky top-0 z-10 grid grid-cols-[200px_repeat(var(--days),minmax(40px,1fr))] gap-1 p-1 bg-neutral-100 rounded-t-md"
          style={{ '--days': daysToShow.length } as React.CSSProperties}
        >
          <div className="font-medium text-sm p-2 truncate bg-neutral-50 rounded-md">
            Empleado
          </div>
          {daysToShow.map((date) => {
            const dayOfWeek = getDay(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const dayAbbr = getDayName(dayOfWeek).toUpperCase();
            const isSelected =
              selectedDate &&
              selectedDate.toDateString() === date.toDateString();

            let dayColor = 'bg-sky-100 text-sky-800 border-sky-800';
            if (dayOfWeek === 6)
              dayColor = 'bg-yellow-100 text-yellow-800 border-yellow-800';
            if (dayOfWeek === 0)
              dayColor = 'bg-red-100 text-red-800 border-red-800';

            if (isToday)
              dayColor =
                'bg-primary text-primary-foreground border-primary-foreground';

            return (
              <div
                key={date.toISOString()}
                className={`min-h-[40px] text-center p-1 border text-xs font-medium rounded-md cursor-pointer transition-colors ${dayColor} ${
                  isSelected ? 'ring-2 ring-green-600 ring-offset-0' : ''
                }`}
                onClick={() => onDateSelect?.(date)}
                title="Seleccionar este día"
              >
                <div className="font-bold text-[10px] leading-tight">
                  {dayAbbr}
                </div>
                <div className="font-bold text-sm leading-tight">
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee rows */}
        <div className="space-y-2 border-t rounded-b-md overflow-hidden">
          <Accordion
            type="multiple"
            value={openAccordions}
            onValueChange={setOpenAccordions}
          >
            {clientes.map((cliente) => (
              <AccordionItem key={cliente.id} value={`cliente-${cliente.id}`}>
                <AccordionTrigger className="p-1 bg-neutral-200">
                  <span className="font-semibold text-base">
                    {cliente.empresa}
                    <span className="ml-2 text-xs text-neutral-500 font-normal">
                      ({empleadosPorCliente[cliente.id]?.length || 0})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-1 p-1 bg-neutral-100">
                  {empleadosPorCliente[cliente.id]?.length ? (
                    empleadosPorCliente[cliente.id].map((employee) => (
                      <div
                        key={employee.id}
                        className={`grid grid-cols-[200px_repeat(var(--days),minmax(40px,1fr))] gap-1 items-center`}
                        style={
                          { '--days': daysToShow.length } as React.CSSProperties
                        }
                      >
                        {/* Employee name */}
                        <div
                          className={`min-h-[40px] font-medium text-sm p-2 truncate bg-neutral-50 rounded-md ${
                            selectedEmployee?.id === employee.id
                              ? 'ring-2 ring-green-600 ring-offset-0'
                              : ''
                          }`}
                        >
                          {employee.name}
                        </div>

                        {/* Days */}
                        {daysToShow.map((date) => {
                          const shift = shifts.find(
                            (s) =>
                              s.employeeId === employee.id &&
                              s.date === formatDate(date),
                          );
                          const dayOfWeek = getDay(date);
                          const isSelected =
                            selectedDate &&
                            selectedDate.toDateString() === date.toDateString();

                          // Match the header colors exactly
                          let dayColor = 'bg-sky-50';
                          if (dayOfWeek === 6) dayColor = 'bg-yellow-50';
                          if (dayOfWeek === 0) dayColor = 'bg-red-50';

                          return (
                            <div
                              key={`${employee.id}-${date.toISOString()}`}
                              className={`
                                min-h-[40px] p-0 rounded-md border cursor-pointer flex items-stretch justify-center
                                transition-colors duration-150 relative group
                                ${dayColor}
                                ${
                                  isSelected
                                    ? 'ring-2 ring-green-600 ring-offset-0'
                                    : selectedEmployee?.id === employee.id
                                      ? 'ring-2 ring-green-600 ring-offset-0'
                                      : 'hover:opacity-80'
                                }
                              `}
                              onClick={() => handleCellClick(date, employee)}
                            >
                              {shift ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0.5 w-full justify-center font-medium cursor-pointer"
                                  style={{
                                    backgroundColor: lighten(
                                      shift.position.color,
                                      0.9,
                                    ),
                                    color: shift.position.color,
                                    borderColor: shift.position.color,
                                    outline: `2px solid ${shift.position.color}`,
                                    outlineOffset: '-1px',
                                  }}
                                  onClick={() => onEditShift?.(shift)}
                                  title="Editar turno"
                                >
                                  {getPositionSiglas(shift)}
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 group-hover:bg-primary self-center w-fit h-full p-1 hover:text-primary-foreground"
                                  onClick={(e) =>
                                    handleAddClick(e, date, employee)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-400 text-sm px-4 py-2">
                      Sin empleados asignados
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
