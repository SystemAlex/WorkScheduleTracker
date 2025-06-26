import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { BarChart3, Clock, Users, Download } from 'lucide-react';
import type { Employee } from '@shared/schema';
import { getMonthName } from '@/lib/utils';
import { base } from '@/lib/paths';

// ...imports y definiciones iniciales...

interface ShiftBreakdownItem {
  positionId: number;
  name: string;
  siglas: string;
  color: string;
  totalHoras: number;
}

interface EmployeeHoursReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalShifts: number;
  shiftBreakdown: ShiftBreakdownItem[];
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<number>();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: report = [], isLoading } = useQuery<EmployeeHoursReport[]>({
    queryKey: [
      '/api/reports/employee-hours',
      selectedMonth,
      selectedYear,
      selectedEmployee,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee.toString());
      }

      const response = await fetch(
        base(`/api/reports/employee-hours?${params.toString()}`),
      );
      if (!response.ok) throw new Error('Error al obtener el reporte');
      return response.json();
    },
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i),
  }));

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: new Date().getFullYear() - 2 + i,
    label: (new Date().getFullYear() - 2 + i).toString(),
  }));

  const totalHours = report.reduce((sum, emp) => sum + emp.totalHours, 0);
  const totalShifts = report.reduce((sum, emp) => sum + emp.totalShifts, 0);

  const allPositions = Array.from(
    new Set(report.flatMap((e) => e.shiftBreakdown.map((s) => s.positionId))),
  );

  const positionMap: Record<number, ShiftBreakdownItem> = {};
  report.forEach((e) =>
    e.shiftBreakdown.forEach((s) => {
      if (!positionMap[s.positionId]) {
        positionMap[s.positionId] = s;
      }
    }),
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">Generando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Reportes"
        subtitle="Analiza las horas trabajadas y estadísticas del equipo"
      />

      <LayoutContent className="p-2">
        {/* Filters */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filtros de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Mes
                </label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Año
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value.toString()}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Empleado (opcional)
                </label>
                <Select
                  value={selectedEmployee?.toString() || 'all'}
                  onValueChange={(value) =>
                    setSelectedEmployee(
                      value === 'all' ? undefined : parseInt(value),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      {selectedEmployee
                        ? employees.find((e) => e.id === selectedEmployee)?.name
                        : 'Todos los empleados'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los empleados</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid-cols-1 md:grid-cols-3 gap-2 mb-4 hidden md:grid">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours}</div>
              <p className="text-xs text-muted-foreground">
                horas trabajadas en {getMonthName(selectedMonth - 1)}{' '}
                {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Turnos
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">turnos asignados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio por Empleado
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.length > 0 ? Math.round(totalHours / report.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">horas promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            {report.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No hay datos para mostrar
                </h3>
                <p className="text-neutral-500">
                  No se encontraron turnos para el período seleccionado
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-neutral-100">
                        <th className="text-center font-medium text-neutral-700 whitespace-nowrap">
                          Empleado
                        </th>
                        <th className="text-center font-medium text-neutral-700">
                          Total Horas
                        </th>
                        <th className="text-center font-medium text-neutral-700">
                          Total Turnos
                        </th>
                        {allPositions.map((pid) => (
                          <Tooltip.Root key={pid}>
                            <Tooltip.Trigger asChild>
                              <th
                                className="text-center font-medium text-neutral-700 p-2"
                                style={{
                                  backgroundColor:
                                    positionMap[pid].color + '20',
                                  color: positionMap[pid].color,
                                }}
                              >
                                {positionMap[pid].siglas}
                              </th>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
                                sideOffset={5}
                              >
                                {positionMap[pid].name}
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="border-b hover:bg-neutral-50"
                        >
                          <td className="p-2 font-medium text-neutral-900 bg-neutral-300/20 whitespace-nowrap">
                            {employee.employeeName}
                          </td>
                          <td className="text-center font-semibold">
                            {employee.totalHours}
                          </td>
                          <td className="text-center">
                            {employee.totalShifts}
                          </td>
                          {allPositions.map((pid) => {
                            const match = employee.shiftBreakdown.find(
                              (s) => s.positionId === pid,
                            );
                            return (
                              <td
                                key={pid}
                                className="text-center p-1"
                                style={{
                                  backgroundColor:
                                    positionMap[pid].color + '20',
                                  color: positionMap[pid].color,
                                }}
                              >
                                {match ? (
                                  <span
                                    className="inline-block w-full text-center items-center rounded-md border-2 transition-colors text-foreground p-1"
                                    style={{
                                      backgroundColor: match.color + '20',
                                      color: match.color,
                                      borderColor: match.color,
                                    }}
                                  >
                                    {match.totalHoras}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-t font-semibold text-neutral-800 bg-neutral-100">
                        <td className="text-right p-2 whitespace-nowrap">
                          Total
                        </td>
                        <td className="text-center">{totalHours}</td>
                        <td className="text-center">{totalShifts}</td>
                        {allPositions.map((pid) => {
                          const totalPos = report.reduce((sum, e) => {
                            const match = e.shiftBreakdown.find(
                              (s) => s.positionId === pid,
                            );
                            return sum + (match ? match.totalHoras : 0);
                          }, 0);
                          return (
                            <td
                              key={pid}
                              className="text-center"
                              style={{
                                backgroundColor: positionMap[pid].color + '20',
                                color: positionMap[pid].color,
                              }}
                            >
                              {totalPos}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
