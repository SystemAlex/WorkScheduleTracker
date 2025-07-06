import { format } from 'date-fns';
import type { Cliente, Position } from './schema';

export interface ShiftBreakdownItem {
  positionId: number;
  name: string;
  siglas: string;
  color: string;
  totalHoras: number;
}

export interface EmployeeHoursReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalShifts: number;
  shiftBreakdown: ShiftBreakdownItem[];
}

export function getMonthName(month: number): string {
  const months = [
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
  return months[month];
}

export function formatYearMonth(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function getProcessedReportPositions(
  report: EmployeeHoursReport[],
  allPositions: Position[],
  allClientes: Cliente[],
) {
  const activePositionIds = new Set<number>();
  report.forEach((employeeReport) => {
    employeeReport.shiftBreakdown.forEach((item) => {
      activePositionIds.add(item.positionId);
    });
  });

  const activePositions = allPositions.filter((pos) =>
    activePositionIds.has(pos.id),
  );

  const groupedPositionsByClient: Array<[number, Position[]]> = Object.entries(
    activePositions.reduce(
      (acc, pos) => {
        if (!acc[pos.clienteId]) acc[pos.clienteId] = [];
        acc[pos.clienteId].push(pos);
        return acc;
      },
      {} as Record<number, Position[]>,
    ),
  )
    .sort(([clientIdA], [clientIdB]) => {
      const clientA =
        allClientes.find((c) => c.id === Number(clientIdA))?.empresa || '';
      const clientB =
        allClientes.find((c) => c.id === Number(clientIdB))?.empresa || '';
      return clientA.localeCompare(clientB);
    })
    .map(([clientId, posArray]) => [
      Number(clientId),
      posArray.sort((a, b) => a.name.localeCompare(b.name)),
    ]);

  return { activePositionIds, groupedPositionsByClient };
}
