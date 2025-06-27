import { type ClassValue, clsx } from 'clsx';
import React, { useState } from 'react';
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

/**
 * Aclara u oscurece un color HEX según el factor:
 * - 0.0 → blanco
 * - 1.0 → sin cambios
 * - >1.0 → oscurece proporcionalmente hacia negro
 */
export function colorLightenDarken(hex: string, factor: number): string {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;

  const blend = (channel: number) => {
    if (factor < 1) {
      return channel + (255 - channel) * factor; // aclara hacia blanco
    } else if (factor > 1) {
      return channel * (2 - factor); // oscurece hacia negro
    }
    return channel; // sin cambio
  };

  r = Math.round(Math.min(255, Math.max(0, blend(r))));
  g = Math.round(Math.min(255, Math.max(0, blend(g))));
  b = Math.round(Math.min(255, Math.max(0, blend(b))));

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getCssVarValue(name: string): string {
  if (typeof window === 'undefined') return '';

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (raw.startsWith('hsl')) {
    return hslToHex(raw);
  }

  return raw;
}

export function hslToHex(hsl: string): string {
  const match = hsl.match(
    /hsl\(\s*(\d+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i,
  );

  if (!match) return '#000000';

  const h = parseInt(match[1], 10);
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

// Hook para detectar si la pantalla es menor a md (768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange(); // Estado inicial
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
