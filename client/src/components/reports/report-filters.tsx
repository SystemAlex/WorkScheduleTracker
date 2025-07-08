import * as React from 'react';
import { Download, Sheet, FilterX, Filter } from 'lucide-react'; // Importar FilterX
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Employee, Cliente } from '@shared/schema';

interface ReportFiltersProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedEmployee: number | undefined;
  setSelectedEmployee: (employeeId: number | undefined) => void;
  selectedClient: number | undefined;
  setSelectedClient: (clientId: number | undefined) => void;
  employees: Employee[];
  months: { value: number; label: string }[];
  years: { value: number; label: string }[];
  clientes: Cliente[];
  onExport: (formatType: 'csv' | 'xlsx' | 'pdf') => void;
}

export function ReportFilters({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedEmployee,
  setSelectedEmployee,
  selectedClient,
  setSelectedClient,
  employees,
  months,
  years,
  clientes,
  onExport,
}: ReportFiltersProps) {
  // Determinar si hay filtros activos (excluyendo mes y año que siempre tienen un valor)
  const hasActiveFilters = selectedEmployee !== undefined || selectedClient !== undefined;

  const handleClearFilters = () => {
    setSelectedEmployee(undefined);
    setSelectedClient(undefined);
    // Opcionalmente, puedes resetear mes y año a la fecha actual si lo deseas
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
  };

  return (
    <Card className="mb-4 border-b-4 border-b-primary">
      <CardHeader className="flex-col md:flex-row items-center justify-between">
        <CardTitle className="flex flex-row items-center justify-start text-xl md:text-2xl w-full">
          <Filter className="w-5 h-5 min-w-5 nin-h-5 mr-2 text-muted-foreground" />
          Filtros
        </CardTitle>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button onClick={handleClearFilters} variant="outline">
              <FilterX className="w-4 h-4 min-w-4 nin-h-4 mr-2" />
              Borrar Filtros
            </Button>
          )}
          <Button onClick={() => onExport('xlsx')}>
            <Download className="w-4 h-4 min-w-4 nin-h-4 mr-2" />
            Exportar a Excel
            <Sheet className="w-4 h-4 min-w-4 nin-h-4 ml-2 hidden md:block" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
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
              onValueChange={(value) => {
                const parsedValue = parseInt(value);
                setSelectedEmployee(
                  value === 'all' || isNaN(parsedValue)
                    ? undefined
                    : parsedValue,
                );
              }}
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cliente (opcional)
            </label>
            <Select
              value={selectedClient?.toString() || 'all'}
              onValueChange={(value) => {
                const parsedValue = parseInt(value);
                setSelectedClient(
                  value === 'all' || isNaN(parsedValue)
                    ? undefined
                    : parsedValue,
                );
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {selectedClient
                    ? clientes.find((c) => c.id === selectedClient)?.empresa
                    : 'Todos los clientes'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.empresa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}