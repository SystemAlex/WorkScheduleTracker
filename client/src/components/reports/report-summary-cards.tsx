import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, Users, Building, Briefcase } from 'lucide-react'; // Import Building and Briefcase icons
import { getMonthName } from '@shared/utils';

interface ReportSummaryCardsProps {
  totalHours: number;
  totalShifts: number;
  reportLength: number;
  selectedMonth: number;
  selectedYear: number;
  totalClientsInMonth: number; // New prop
  totalPositionsInMonth: number; // New prop
}

export function ReportSummaryCards({
  totalHours,
  totalShifts,
  reportLength,
  selectedMonth,
  selectedYear,
  totalClientsInMonth, // Destructure new prop
  totalPositionsInMonth, // Destructure new prop
}: ReportSummaryCardsProps) {
  return (
    <div className="grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 hidden md:grid">
      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex flex-row items-center justify-start text-sm font-medium">
            <Clock className="w-3 h-3 min-w-3 nin-h-3 text-muted-foreground mr-1" />
            Total Horas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours}</div>
          <p className="text-xs text-muted-foreground">
            horas en {getMonthName(selectedMonth - 1)} {selectedYear}
          </p>
        </CardContent>
      </Card>
      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex flex-row items-center justify-start text-sm font-medium">
            <BarChart3 className="w-3 h-3 min-w-3 nin-h-3 text-muted-foreground mr-1" />
            Total Turnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalShifts}</div>
          <p className="text-xs text-muted-foreground">turnos asignados</p>
        </CardContent>
      </Card>
      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex flex-row items-center justify-start text-sm font-medium">
            <Users className="w-3 h-3 min-w-3 nin-h-3 text-muted-foreground mr-1" />
            Horas Promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {reportLength > 0 ? Math.round(totalHours / reportLength) : 0}
          </div>
          <p className="text-xs text-muted-foreground">horas por empleado</p>
        </CardContent>
      </Card>
      <Card className="border-b-4 border-b-primary hidden lg:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex flex-row items-center justify-start text-sm font-medium">
            <Building className="w-3 h-3 min-w-3 nin-h-3 text-muted-foreground mr-1" />
            Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClientsInMonth}</div>
          <p className="text-xs text-muted-foreground">
            clientes con turnos en {getMonthName(selectedMonth - 1)}
          </p>
        </CardContent>
      </Card>
      <Card className="border-b-4 border-b-primary hidden lg:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex flex-row items-center justify-start text-sm font-medium">
            <Briefcase className="w-3 h-3 min-w-3 nin-h-3 text-muted-foreground mr-1" />
            Puestos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPositionsInMonth}</div>
          <p className="text-xs text-muted-foreground">puestos cubiertos</p>
        </CardContent>
      </Card>
    </div>
  );
}
