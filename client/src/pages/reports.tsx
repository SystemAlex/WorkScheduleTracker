import * as React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import type { Employee, Position, Cliente } from '@shared/schema';
import {
  EmployeeHoursReport,
  getMonthName,
  getProcessedReportPositions,
} from '@shared/utils';
import { exportToCsv } from '@/lib/utils';
import { base } from '@shared/paths';
import { ReportFilters } from '@/components/reports/report-filters';
import { ReportSummaryCards } from '@/components/reports/report-summary-cards';
import { ReportTable } from '@/components/reports/report-table';

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState<number>();
  const [selectedClient, setSelectedClient] = useState<number>(); // Nuevo estado para el filtro de cliente

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['/api/clientes'],
  });

  const { data: report = [], isLoading } = useQuery<EmployeeHoursReport[]>({
    queryKey: [
      '/api/reports/employee-hours',
      selectedMonth,
      selectedYear,
      selectedEmployee,
      selectedClient, // Incluir en la clave de la consulta
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee.toString());
      }
      if (selectedClient) {
        // Añadir parámetro de cliente
        params.append('clientId', selectedClient.toString());
      }

      const response = await fetch(
        base(`/api/reports/employee-hours?${params.toString()}`),
      );
      if (!response.ok) throw new Error('Error al obtener el reporte');
      return response.json();
    },
  });

  const months = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: getMonthName(i),
      })),
    [],
  );

  const years = React.useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        value: new Date().getFullYear() - 2 + i,
        label: (new Date().getFullYear() - 2 + i).toString(),
      })),
    [],
  );

  const totalHours = report.reduce((sum, emp) => sum + emp.totalHours, 0);
  const totalShifts = report.reduce((sum, emp) => sum + emp.totalShifts, 0);

  // Use the new shared function to get grouped positions and active position IDs
  const { groupedPositionsByClient, activePositionIds } = React.useMemo(() => {
    return getProcessedReportPositions(report, positions, clientes);
  }, [report, positions, clientes]);

  // Calculate total clients and total positions for the month
  const totalClientsInMonth = groupedPositionsByClient.length;
  const totalPositionsInMonth = activePositionIds.size;

  // Create a flat map of all positions for easy lookup by ID (used in table body)
  const positionMap: Record<number, Position> = React.useMemo(() => {
    return positions.reduce(
      (acc, pos) => {
        acc[pos.id] = pos;
        return acc;
      },
      {} as Record<number, Position>,
    );
  }, [positions]);

  const handleExport = (formatType: 'csv' | 'xlsx' | 'pdf') => {
    const params = new URLSearchParams({
      month: selectedMonth.toString(),
      year: selectedYear.toString(),
    });
    if (selectedEmployee) {
      params.append('employeeId', selectedEmployee.toString());
    }
    if (selectedClient) {
      // Añadir parámetro de cliente para la exportación
      params.append('clientId', selectedClient.toString());
    }

    let url = '';
    let fileNameExtension = '';

    if (formatType === 'csv') {
      // Use existing frontend CSV export
      exportToCsv(
        report,
        groupedPositionsByClient,
        clientes,
        selectedMonth,
        selectedYear,
        totalHours,
        totalShifts,
      );
      return; // CSV is handled client-side
    } else if (formatType === 'xlsx') {
      url = base(`/api/reports/employee-hours/xlsx?${params.toString()}`);
      fileNameExtension = 'xlsx';
    } else if (formatType === 'pdf') {
      url = base(`/api/reports/employee-hours/pdf?${params.toString()}`);
      fileNameExtension = 'pdf';
    }

    const monthName = getMonthName(selectedMonth - 1);
    const fileName = `Reporte_Turnos_${monthName}_${selectedYear}.${fileNameExtension}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al exportar el reporte.');
        }
        return response.blob();
      })
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up the URL object
      })
      .catch((error) => {
        console.error('Export error:', error);
        // Optionally show a toast notification for the error
      });
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Reportes"
          subtitle="Analiza las horas trabajadas y estadísticas del equipo"
        />

        <LayoutContent>
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">
                Generando reporte...
              </p>
            </div>
          </div>
        </LayoutContent>
      </>
    );
  }

  return (
    <>
      <Header
        title="Reportes"
        subtitle="Analiza las horas trabajadas y estadísticas del equipo"
      />

      <LayoutContent className="p-2">
        <ReportFilters
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          selectedClient={selectedClient} // Pasar el nuevo estado
          setSelectedClient={setSelectedClient} // Pasar el setter
          employees={employees}
          months={months}
          years={years}
          clientes={clientes} // Pasar la lista de clientes
          onExport={handleExport}
        />

        <ReportSummaryCards
          totalHours={totalHours}
          totalShifts={totalShifts}
          reportLength={report.length}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          totalClientsInMonth={totalClientsInMonth}
          totalPositionsInMonth={totalPositionsInMonth}
        />

        <ReportTable
          report={report}
          groupedPositionsByClient={groupedPositionsByClient}
          clientes={clientes}
          positionMap={positionMap}
          totalHours={totalHours}
          totalShifts={totalShifts}
        />
      </LayoutContent>
    </>
  );
}
