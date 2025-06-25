import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building, Briefcase, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import type { Employee, Position } from '@shared/schema';

export default function Organigrama() {
  const { data: employees = [], isLoading: employeesLoading } = useQuery<
    Employee[]
  >({
    queryKey: ['/api/employees'],
  });

  const { data: positions = [], isLoading: positionsLoading } = useQuery<
    Position[]
  >({
    queryKey: ['/api/positions'],
  });

  if (employeesLoading || positionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">
            Cargando organigrama...
          </p>
        </div>
      </div>
    );
  }

  // Group employees by department/position
  const departments = positions.reduce(
    (acc, position) => {
      const dept = position.department || 'Sin Departamento';
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(position);
      return acc;
    },
    {} as Record<string, Position[]>,
  );

  // Get employees for each position
  const getEmployeesForPosition = (positionName: string) => {
    return employees.filter(
      (emp) => emp.position === positionName && emp.status === 'active',
    );
  };

  return (
    <>
      <Header
        title="Organigrama"
        subtitle="Visualiza la estructura organizacional de tu equipo"
      />

      <div className="flex flex-1 overflow-hidden">
        <LayoutContent>
          {/* Overview Stats w-full overflow-y-hidden overflow-x-auto p-2 h-full */}
          <div className="grid grid-cols-1 md:grid-cols-3 p-2 gap-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Empleados
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees.filter((e) => e.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  empleados activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Departamentos
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(departments).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  departamentos diferentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Puestos</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{positions.length}</div>
                <p className="text-xs text-muted-foreground">
                  puestos definidos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Organizational Structure */}
          <div className="space-y-4 p-2">
            {Object.entries(departments).map(
              ([departmentName, deptPositions]) => (
                <div key={departmentName}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">
                        {departmentName}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {deptPositions.length} puesto
                        {deptPositions.length !== 1 ? 's' : ''}•{' '}
                        {deptPositions.reduce(
                          (acc, pos) =>
                            acc + getEmployeesForPosition(pos.name).length,
                          0,
                        )}{' '}
                        empleado
                        {deptPositions.reduce(
                          (acc, pos) =>
                            acc + getEmployeesForPosition(pos.name).length,
                          0,
                        ) !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-2">
                    {deptPositions.map((position) => {
                      const positionEmployees = getEmployeesForPosition(
                        position.name,
                      );

                      return (
                        <Card
                          key={position.id}
                          className="border-l-4 border-l-blue-500"
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {position.name}
                                </CardTitle>
                                <p className="text-sm text-neutral-500">
                                  {positionEmployees.length} empleado
                                  {positionEmployees.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {position.description && (
                              <p className="text-sm text-neutral-600 mb-4">
                                {position.description}
                              </p>
                            )}

                            {positionEmployees.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-neutral-700">
                                  Empleados:
                                </h4>
                                {positionEmployees.map((employee) => (
                                  <div
                                    key={employee.id}
                                    className="flex items-center space-x-3 p-2 bg-neutral-50 rounded-lg"
                                  >
                                    <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-neutral-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-neutral-900 truncate">
                                        {employee.name}
                                      </p>
                                      {employee.email && (
                                        <p className="text-xs text-neutral-500 truncate">
                                          {employee.email}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <User className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                                <p className="text-sm text-neutral-500">
                                  Sin empleados asignados
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          {Object.keys(departments).length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No hay estructura organizacional definida
              </h3>
              <p className="text-neutral-500 mb-4">
                Agrega puestos y empleados para visualizar tu organigrama
              </p>
            </div>
          )}
        </LayoutContent>
      </div>
    </>
  );
}
