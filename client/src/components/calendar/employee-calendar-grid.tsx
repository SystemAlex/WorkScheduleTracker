import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
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
import {
  getDayName,
  formatDate,
  colorLightenDarken,
  formatYearMonth,
} from '@/lib/utils';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

interface EmployeeCalendarGridProps {
  currentDate: Date;
  shifts: ShiftWithDetails[];
  previousMonthShifts: ShiftWithDetails[];
  employees: Employee[];
  positions: Position[];
  clientes: Cliente[];
  selectedDate?: Date;
  onDateSelect?: (date?: Date, employee?: Employee) => void;
  selectedEmployee?: Employee;
  onAddShift?: (date: Date, employee: Employee) => void;
  onEditShift?: (shift: ShiftWithDetails) => void;
  viewMode?: 'month' | 'week' | 'day';
}

// Helper function to group employees by their primary client based on a given set of shifts
function groupEmployeesByPrimaryClient(
  allShifts: ShiftWithDetails[],
  employees: Employee[],
  positions: Position[],
): Record<number, Employee[]> {
  const employeeShiftCounts: Record<number, Record<number, number>> = {}; // employeeId -> clientId -> count

  allShifts.forEach((shift) => {
    const position = positions.find((p) => p.id === shift.positionId);
    if (!position) return;

    const clienteId = position.clienteId;
    const empId = shift.employeeId;

    if (!employeeShiftCounts[empId]) {
      employeeShiftCounts[empId] = {};
    }
    if (!employeeShiftCounts[empId][clienteId]) {
      employeeShiftCounts[empId][clienteId] = 0;
    }
    employeeShiftCounts[empId][clienteId]++;
  });

  const employeePrimaryClientMap: Record<number, number> = {};
  for (const empIdStr in employeeShiftCounts) {
    const empId = Number(empIdStr);
    const clientCounts = employeeShiftCounts[empId];
    let maxClienteId = -1;
    let maxTurnos = -1;
    for (const clienteIdStr in clientCounts) {
      const clienteId = Number(clienteIdStr);
      const count = clientCounts[clienteId];
      if (count > maxTurnos) {
        maxTurnos = count;
        maxClienteId = clienteId;
      }
    }
    employeePrimaryClientMap[empId] = maxClienteId;
  }

  const employeesGroupedByClient: Record<number, Employee[]> = {};
  for (const empIdStr in employeePrimaryClientMap) {
    const empId = Number(empIdStr);
    const primaryClientId = employeePrimaryClientMap[empId];
    if (!employeesGroupedByClient[primaryClientId]) {
      employeesGroupedByClient[primaryClientId] = [];
    }
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      employeesGroupedByClient[primaryClientId].push(emp);
    }
  }

  Object.values(employeesGroupedByClient).forEach((arr) =>
    arr.sort((a, b) => a.name.localeCompare(b.name)),
  );

  return employeesGroupedByClient;
}

export function EmployeeCalendarGrid({
  currentDate,
  shifts,
  previousMonthShifts,
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
  const month = currentDate.getMonth(); // 0-indexed
  const daysInMonth = getDaysInMonth(currentDate);

  const currentMonthYearString = formatYearMonth(currentDate);

  // Filter shifts for the current month
  const shiftsInCurrentMonth = shifts.filter((shift) => {
    const shiftMonthYearString = shift.date.substring(0, 7);
    return shiftMonthYearString === currentMonthYearString;
  });

  // Filter shifts for the previous month
  const previousMonthDate = new Date(currentDate);
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthYearString = formatYearMonth(previousMonthDate);

  const shiftsInPreviousMonth = previousMonthShifts.filter((shift) => {
    const shiftMonthYearString = shift.date.substring(0, 7);
    return shiftMonthYearString === previousMonthYearString;
  });

  // Combine all relevant shifts (current and previous month) for overall employee-client mapping
  const allRelevantShifts = React.useMemo(() => {
    return shiftsInCurrentMonth.concat(shiftsInPreviousMonth);
  }, [shiftsInCurrentMonth, shiftsInPreviousMonth]);

  // Group employees by their primary client based on ALL relevant shifts
  const employeesGroupedByPrimaryClient = React.useMemo(
    () =>
      groupEmployeesByPrimaryClient(allRelevantShifts, employees, positions),
    [allRelevantShifts, employees, positions],
  );

  // Determine which clients to show: only those that have at least one employee assigned to them
  const clientsToShow = React.useMemo(() => {
    return clientes
      .filter(
        (cliente) =>
          (employeesGroupedByPrimaryClient[cliente.id]?.length || 0) > 0,
      )
      .sort((a, b) => a.empresa.localeCompare(b.empresa));
  }, [clientes, employeesGroupedByPrimaryClient]);

  // Generate array of dates according to viewMode
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

  // Get position siglas
  const getPositionSiglas = (shift: ShiftWithDetails) => {
    return (
      shift.position.siglas || shift.position.name.substring(0, 3).toUpperCase()
    );
  };

  const handleCellClick = (date: Date, employee: Employee) => {
    onDateSelect?.(date, employee);
  };

  const onEmployeeSelect = (employee: Employee) => {
    onDateSelect?.(undefined, employee);
  };

  const handleAddClick = (
    e: React.MouseEvent,
    date: Date,
    employee: Employee,
  ) => {
    e.stopPropagation();
    onAddShift?.(date, employee);
  };

  // State to control which Accordions are open
  const [openAccordions, setOpenAccordions] = React.useState(
    clientes.map((c) => `cliente-${c.id}`),
  );

  // Synchronize open Accordions if client list changes
  React.useEffect(() => {
    setOpenAccordions(clientsToShow.map((c) => `cliente-${c.id}`));
  }, [clientsToShow]);

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
            {clientsToShow.map((cliente) => {
              const employeesForThisClient =
                employeesGroupedByPrimaryClient[cliente.id] || [];

              return (
                <AccordionItem key={cliente.id} value={`cliente-${cliente.id}`}>
                  <AccordionTrigger className="p-1 bg-neutral-200">
                    <span className="font-semibold text-base">
                      {cliente.empresa}
                      <span className="ml-2 text-xs text-neutral-500 font-normal">
                        ({employeesForThisClient.length || 0})
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-1 p-1 bg-neutral-100">
                    {employeesForThisClient.length ? (
                      employeesForThisClient.map((employee) => (
                        <div
                          key={employee.id}
                          className={`grid grid-cols-[200px_repeat(var(--days),minmax(40px,1fr))] gap-1 items-center`}
                          style={
                            {
                              '--days': daysToShow.length,
                            } as React.CSSProperties
                          }
                        >
                          {/* Employee name */}
                          <div
                            className={`min-h-[40px] font-medium text-sm p-2 cursor-pointer truncate bg-neutral-50 rounded-md ${
                              selectedEmployee?.id === employee.id
                                ? 'ring-2 ring-green-600 ring-offset-0'
                                : ''
                            }`}
                            onClick={() => onEmployeeSelect?.(employee)}
                          >
                            {employee.name}
                          </div>

                          {/* Days */}
                          {daysToShow.map((date) => {
                            const formattedDate = formatDate(date);
                            const shift = shiftsInCurrentMonth.find(
                              (s) =>
                                s.employeeId === employee.id &&
                                s.date === formattedDate,
                            );

                            const dayOfWeek = getDay(date);
                            const isSelected =
                              selectedDate &&
                              selectedDate.toDateString() ===
                                date.toDateString();

                            let dayColor = 'bg-sky-50';
                            if (dayOfWeek === 6) dayColor = 'bg-yellow-50';
                            if (dayOfWeek === 0) dayColor = 'bg-red-50';

                            return (
                              <div
                                key={`${employee.id}-${date.toISOString()}`}
                                className={`
                                  min-h-[40px] p-0 rounded-md border flex items-stretch justify-center
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
                                <Tooltip.Root>
                                  {shift ? (
                                    <>
                                      <Tooltip.Trigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="text-xs px-1 py-0.5 w-full justify-center font-medium cursor-pointer"
                                          style={{
                                            backgroundColor: colorLightenDarken(
                                              shift.position.color,
                                              0.9,
                                            ),
                                            color: shift.position.color,
                                            borderColor: shift.position.color,
                                            outline: `2px solid ${shift.position.color}`,
                                            outlineOffset: '-1px',
                                          }}
                                          onClick={() => onEditShift?.(shift)}
                                        >
                                          {getPositionSiglas(shift)}
                                        </Badge>
                                      </Tooltip.Trigger>
                                      <Tooltip.Portal>
                                        <Tooltip.Content
                                          side="bottom"
                                          sideOffset={4}
                                          className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md z-50"
                                        >
                                          Editar turno
                                        </Tooltip.Content>
                                      </Tooltip.Portal>
                                    </>
                                  ) : (
                                    <>
                                      <Tooltip.Trigger asChild>
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
                                      </Tooltip.Trigger>
                                      <Tooltip.Portal>
                                        <Tooltip.Content
                                          side="bottom"
                                          sideOffset={11}
                                          className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md z-50"
                                        >
                                          Asignar turno
                                        </Tooltip.Content>
                                      </Tooltip.Portal>
                                    </>
                                  )}
                                </Tooltip.Root>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="text-neutral-400 text-sm px-4 py-2">
                        Sin empleados asignados para este cliente en este mes o
                        el anterior.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Leyenda */}
        <div className="mt-4 p-3 bg-neutral-50 rounded-md">
          <h4 className="text-sm font-medium mb-2">Leyenda:</h4>
          <div className="text-xs text-neutral-600">
            <p>
              • Las siglas representan el puesto asignado, haz clic para
              editar/eliminar
            </p>
            <p>• Haz clic en una celda vacía para asignar un turno</p>
          </div>
        </div>
      </div>
    </div>
  );
}
