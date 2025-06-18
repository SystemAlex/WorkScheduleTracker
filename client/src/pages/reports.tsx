import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { LayoutContent } from "@/components/ui/layout";
import { BarChart3, Clock, Users, Download } from "lucide-react";
import type { Employee } from "@shared/schema";
import { getMonthName } from "@/lib/utils";

interface EmployeeHoursReport {
  employeeId: number;
  employeeName: string;
  totalHours: number;
  totalShifts: number;
  shiftBreakdown: {
    morning: number;
    afternoon: number;
    night: number;
    special: number;
  };
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<number>();

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: report = [], isLoading } = useQuery<EmployeeHoursReport[]>({
    queryKey: ["/api/reports/employee-hours", selectedMonth, selectedYear, selectedEmployee],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });
      
      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee.toString());
      }

      const response = await fetch(`/api/reports/employee-hours?${params}`);
      if (!response.ok) throw new Error("Failed to fetch report");
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

      <LayoutContent>
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Mes
                </label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
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
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value.toString()}>
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
                <Select value={selectedEmployee?.toString() || ""} onValueChange={(value) => setSelectedEmployee(value ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los empleados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los empleados</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turnos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                turnos asignados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Empleado</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.length > 0 ? Math.round(totalHours / report.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                horas promedio
              </p>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-neutral-700">Empleado</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Total Horas</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Total Turnos</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Mañana</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Tarde</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Noche</th>
                      <th className="text-center py-3 px-4 font-medium text-neutral-700">Especial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((employee) => (
                      <tr key={employee.employeeId} className="border-b hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-neutral-900">{employee.employeeName}</div>
                        </td>
                        <td className="text-center py-3 px-4 font-semibold">{employee.totalHours}</td>
                        <td className="text-center py-3 px-4">{employee.totalShifts}</td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {employee.shiftBreakdown.morning}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            {employee.shiftBreakdown.afternoon}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            {employee.shiftBreakdown.night}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            {employee.shiftBreakdown.special}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </LayoutContent>
    </>
  );
}
