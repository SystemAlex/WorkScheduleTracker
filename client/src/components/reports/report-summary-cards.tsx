import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, Users } from 'lucide-react';
import { getMonthName } from '@shared/utils';

interface ReportSummaryCardsProps {
  totalHours: number;
  totalShifts: number;
  reportLength: number;
  selectedMonth: number;
  selectedYear: number;
}

export function ReportSummaryCards({
  totalHours,
  totalShifts,
  reportLength,
  selectedMonth,
  selectedYear,
}: ReportSummaryCardsProps) {
  return (
    <div className="grid-cols-1 md:grid-cols-3 gap-2 mb-4 hidden md:grid">
      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours}</div>
          <p className="text-xs text-muted-foreground">
            horas trabajadas en {getMonthName(selectedMonth - 1)} {selectedYear}
          </p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalShifts}</div>
          <p className="text-xs text-muted-foreground">turnos asignados</p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Promedio por Empleado
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {reportLength > 0 ? Math.round(totalHours / reportLength) : 0}
          </div>
          <p className="text-xs text-muted-foreground">horas promedio</p>
        </CardContent>
      </Card>
    </div>
  );
}
