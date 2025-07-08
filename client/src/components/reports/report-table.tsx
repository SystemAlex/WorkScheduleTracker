import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { Cliente, Position } from '@shared/schema';
import { EmployeeHoursReport } from '@shared/utils';

interface ReportTableProps {
  report: EmployeeHoursReport[];
  groupedPositionsByClient: Array<[number, Position[]]>;
  clientes: Cliente[];
  positionMap: Record<number, Position>;
  totalHours: number;
  totalShifts: number;
}

export function ReportTable({
  report,
  groupedPositionsByClient,
  clientes,
  positionMap,
  totalHours,
  totalShifts,
}: ReportTableProps) {
  return (
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
                    <th
                      className="text-center font-medium text-neutral-700 p-2 whitespace-nowrap"
                      rowSpan={2}
                    >
                      Empleado
                    </th>
                    <th
                      className="text-center font-medium text-neutral-700 p-2"
                      rowSpan={2}
                    >
                      Total Horas
                    </th>
                    <th
                      className="text-center font-medium text-neutral-700 p-2"
                      rowSpan={2}
                    >
                      Total Turnos
                    </th>
                    {/* Client Grouping Header */}
                    {groupedPositionsByClient.map(
                      ([clienteId, clientPositions]) => (
                        <th
                          key={clienteId}
                          colSpan={clientPositions.length}
                          className="text-center font-medium text-neutral-700 p-2 border-l border-neutral-300"
                        >
                          {clientes.find((c) => c.id === clienteId)?.empresa ||
                            'Sin Cliente'}
                        </th>
                      ),
                    )}
                  </tr>
                  <tr className="border-b bg-neutral-100">
                    {/* Position Siglas Header */}
                    {groupedPositionsByClient.flatMap(([, clientPositions]) =>
                      clientPositions.map((pos: Position) => (
                        <Tooltip.Root key={pos.id}>
                          <Tooltip.Trigger asChild>
                            <th
                              className="text-center font-medium text-neutral-700 p-2 border-l border-neutral-300"
                              style={{
                                backgroundColor: pos.color + '20',
                                color: pos.color,
                              }}
                            >
                              {pos.siglas}
                            </th>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md"
                              sideOffset={5}
                            >
                              {pos.name}
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      )),
                    )}
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
                      <td className="text-center">{employee.totalShifts}</td>
                      {/* Employee Shift Breakdown by Grouped Positions */}
                      {groupedPositionsByClient.flatMap(([, clientPositions]) =>
                        clientPositions.map((pos: Position) => {
                          const match = employee.shiftBreakdown.find(
                            (s) => s.positionId === pos.id,
                          );
                          return (
                            <td
                              key={pos.id}
                              className="text-center p-1 border-l border-neutral-200"
                              style={{
                                backgroundColor: pos.color + '20',
                                color: pos.color,
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
                        }),
                      )}
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="border-t font-semibold text-neutral-800 bg-neutral-100">
                    <td className="text-right p-2 whitespace-nowrap">Total</td>
                    <td className="text-center">{totalHours}</td>
                    <td className="text-center">{totalShifts}</td>
                    {groupedPositionsByClient.flatMap(([, clientPositions]) =>
                      clientPositions.map((pos: Position) => {
                        const totalPos = report.reduce((sum, e) => {
                          const match = e.shiftBreakdown.find(
                            (s) => s.positionId === pos.id,
                          );
                          return sum + (match ? match.totalHoras : 0);
                        }, 0);
                        return (
                          <td
                            key={pos.id}
                            className="text-center border-l border-neutral-200"
                            style={{
                              backgroundColor: positionMap[pos.id].color + '20',
                              color: positionMap[pos.id].color,
                            }}
                          >
                            {totalPos}
                          </td>
                        );
                      }),
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
