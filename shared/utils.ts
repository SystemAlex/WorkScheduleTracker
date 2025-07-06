import { format } from 'date-fns';

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
