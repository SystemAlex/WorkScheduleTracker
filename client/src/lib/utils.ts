import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(time: string): string {
  return time.slice(0, 5); // Remove seconds
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

export function getDayName(dayOfWeek: number): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[dayOfWeek];
}

export function getWeekRange(date: Date): string {
  const startOfWeek = new Date(date);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const startDay = startOfWeek.getDate();
  const endDay = endOfWeek.getDate();
  const startMonth = getMonthName(startOfWeek.getMonth());
  const endMonth = getMonthName(endOfWeek.getMonth());

  if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
    return `${startDay} - ${endDay} ${startMonth} ${startOfWeek.getFullYear()}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startOfWeek.getFullYear()}`;
  }
}

export function getDayDisplay(date: Date): string {
  const dayName = getDayName(date.getDay());
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();

  return `${dayName} ${day} ${month} ${year}`;
}

export function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);

  // Generate 6 weeks (42 days) for consistent calendar grid
  for (let i = 0; i < 42; i++) {
    days.push({
      date: new Date(current),
      isCurrentMonth: current.getMonth() === month,
      isToday: current.toDateString() === new Date().toDateString(),
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getShiftColor(shiftTypeCode: string): string {
  switch (shiftTypeCode) {
    case 'M':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'T':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'N':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'E':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
