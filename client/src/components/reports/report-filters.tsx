import * as React from 'react';
import { Download, Sheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Employee } from '@shared/schema';

interface ReportFiltersProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedEmployee: number | undefined;
  setSelectedEmployee: (employeeId: number | undefined) => void;
  employees: Employee[];
  months: { value: number; label: string }[];
  years: { value: number; label: string }[];
  onExport: (formatType: 'csv' | 'xlsx' | 'pdf') => void;
}

export function ReportFilters({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedEmployee,
  setSelectedEmployee,
  employees,
  months,
  years,
  onExport,
}: ReportFiltersProps) {
  return (
    <Card className="mb-4 border-b-4 border-b-primary">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl md:text-2xl">
          Filtros
        </CardTitle>
        <Button onClick={() => onExport('xlsx')}>
          <Download className="w-4 h-4 mr-2" />
          Exportar a Excel
          <Sheet className="w-4 h-4 ml-2 hidden md:block" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
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
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* <div className="flex items-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport('csv')}>
                  Exportar a CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('xlsx')}>
                  Exportar a XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>
                  Exportar a PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}
