'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Building, Briefcase, User, LayoutGrid } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import type {
  Employee,
  Position,
  ShiftWithDetails,
  Cliente,
} from '@shared/schema';
import { IconWrapper } from '@/components/ui/iconwrapper';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

// Definir las interfaces para la nueva estructura de datos
interface PositionData extends Position {
  employees: Employee[];
}

interface ClientData {
  id: number;
  empresa: string;
  positions: PositionData[];
}

interface DepartmentData {
  name: string;
  clients: ClientData[];
}

export default function Estructura() {
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

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<
    ShiftWithDetails[]
  >({
    queryKey: ['/api/shifts'],
  });

  const { data: clientes = [], isLoading: clientsLoading } = useQuery<
    Cliente[]
  >({
    queryKey: ['/api/clientes'],
  });

  // Procesar los datos para la estructura jerárquica y ordenar alfabéticamente
  const stableEmployees = React.useMemo(
    () => employees,
    [JSON.stringify(employees)],
  );
  const stablePositions = React.useMemo(
    () => positions,
    [JSON.stringify(positions)],
  );
  const stableShifts = React.useMemo(() => shifts, [JSON.stringify(shifts)]);
  const stableClientes = React.useMemo(
    () => clientes,
    [JSON.stringify(clientes)],
  );
  const groupedOrgData = React.useMemo(() => {
    const departmentsMap: Record<string, DepartmentData> = {};

    stablePositions.forEach((position) => {
      const deptName = position.department || 'Sin Departamento';
      const cliente = stableClientes.find((c) => c.id === position.clienteId);

      const clientId = cliente?.id ?? 0;
      const clientName = cliente?.empresa || 'Sin Cliente';

      if (!departmentsMap[deptName]) {
        departmentsMap[deptName] = { name: deptName, clients: [] };
      }

      let clientEntry = departmentsMap[deptName].clients.find(
        (c) => c.id === clientId,
      );
      if (!clientEntry) {
        clientEntry = { id: clientId, empresa: clientName, positions: [] };
        departmentsMap[deptName].clients.push(clientEntry);
      }

      const positionEmployees = stableShifts
        .filter(
          (s) => s.positionId === position.id && s.employee.status === 'active',
        )
        .map((s) => s.employee);

      const uniqueEmployees = Array.from(
        new Map(positionEmployees.map((emp) => [emp.id, emp])).values(),
      ).sort((a, b) => a.name.localeCompare(b.name));

      clientEntry.positions.push({
        ...position,
        employees: uniqueEmployees,
      });
    });

    Object.values(departmentsMap).forEach((dept) => {
      dept.clients.forEach((client) => {
        client.positions.sort((a, b) => a.name.localeCompare(b.name));
      });
      dept.clients.sort((a, b) => a.empresa.localeCompare(b.empresa));
    });

    const sortedDepartments = Object.values(departmentsMap).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return sortedDepartments;
  }, [stableEmployees, stablePositions, stableShifts, stableClientes]);

  // State to manage open departments
  const [openDepartments, setOpenDepartments] = React.useState<string[]>([]);
  const didInitDepartments = React.useRef(false);
  React.useEffect(() => {
    if (!didInitDepartments.current && groupedOrgData.length > 0) {
      setOpenDepartments(groupedOrgData.map((dept) => dept.name));
      didInitDepartments.current = true;
    }
  }, [groupedOrgData]);

  // State to manage open clients within each department
  const [openClients, setOpenClients] = React.useState<
    Record<string, string[]>
  >({});
  const didInitClients = React.useRef(false);
  React.useEffect(() => {
    if (!didInitClients.current && groupedOrgData.length > 0) {
      const initialOpenClients: Record<string, string[]> = {};
      groupedOrgData.forEach((dept) => {
        initialOpenClients[dept.name] = dept.clients.map((client) =>
          client.id.toString(),
        );
      });
      setOpenClients(initialOpenClients);
      didInitClients.current = true;
    }
  }, [groupedOrgData]);

  // State to manage open positions within each client - now defaults to closed
  const [openPositions, setOpenPositions] = React.useState<
    Record<string, string[]>
  >({});
  // No useEffect here, so it remains an empty object, keeping positions closed by default.

  const handleClientAccordionChange = (
    departmentName: string,
    values: string[],
  ) => {
    setOpenClients((prev) => ({
      ...prev,
      [departmentName]: values,
    }));
  };
  const handlePositionAccordionChange = (
    clientId: string,
    _values: string[],
    clientPositions: PositionData[],
  ) => {
    setOpenPositions((prev) => {
      const allIds = clientPositions.map((pos) => pos.id.toString());
      const currentIds = prev[clientId] || [];

      const areSame =
        currentIds.length === allIds.length &&
        currentIds.every((id, i) => id === allIds[i]);

      if (areSame && allIds.length > 0) {
        return { ...prev, [clientId]: [] };
      }
      return { ...prev, [clientId]: allIds };
    });
  };

  if (employeesLoading || positionsLoading || shiftsLoading || clientsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-neutral-500 mt-2">
            Cargando estructura...
          </p>
        </div>
      </div>
    );
  }

  const totalActiveEmployees = employees.filter(
    (e) => e.status === 'active',
  ).length;

  const totalClients = clientes.length;

  return (
    <>
      <Header
        title="Estructura"
        subtitle="Visualiza la estructura organizacional de tu equipo"
      />

      <div className="flex flex-1 overflow-hidden">
        <LayoutContent>
          <div className="grid grid-cols-2 grid-rows-2 md:grid-cols-4 md:grid-rows-1 p-2 gap-2">
            <Card className="border-b-4 border-b-primary">
              <CardHeader className="flex flex-row items-center justify-start space-x-2">
                <LayoutGrid className="h-7 w-7 min-w-7 min-h-7 text-muted-foreground" />
                <div className=" w-full overflow-hidden">
                  <CardTitle className="text-sm font-medium truncate">
                    Departamentos
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {groupedOrgData.length}
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-b-4 border-b-primary">
              <CardHeader className="flex flex-row items-center justify-start space-x-2">
                <Building className="h-7 w-7 min-w-7 min-h-7 text-muted-foreground" />
                <div className=" w-full overflow-hidden">
                  <CardTitle className="text-sm font-medium truncate">
                    Clientes
                  </CardTitle>
                  <div className="text-2xl font-bold">{totalClients}</div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-b-4 border-b-primary">
              <CardHeader className="flex flex-row items-center justify-start space-x-2">
                <Briefcase className="h-7 w-7 min-w-7 min-h-7 text-muted-foreground" />
                <div className=" w-full overflow-hidden">
                  <CardTitle className="text-sm font-medium truncate">
                    Puestos
                  </CardTitle>
                  <div className="text-2xl font-bold">{positions.length}</div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-b-4 border-b-primary">
              <CardHeader className="flex flex-row items-center justify-start space-x-2">
                <Users className="h-7 w-7 min-w-7 min-h-7 text-muted-foreground" />
                <div className=" w-full overflow-hidden">
                  <CardTitle className="text-sm font-medium truncate">
                    Empleados
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {totalActiveEmployees}
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-6 p-2">
            {groupedOrgData.length === 0 ? (
              <div className="text-center py-12">
                <LayoutGrid className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No hay estructura organizacional definida
                </h3>
                <p className="text-neutral-500 mb-4">
                  Comienza agregando puestos y empleados para visualizar tu
                  estructura
                </p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                value={openDepartments}
                onValueChange={setOpenDepartments}
                className="space-y-3 w-full"
              >
                {groupedOrgData.map((department) => (
                  <AccordionItem
                    key={department.name}
                    value={department.name}
                    className="border rounded-lg p-0 bg-neutral-100 border-l-4 border-l-primary"
                  >
                    <AccordionTrigger className="flex items-center justify-between p-4 text-left font-bold text-neutral-900 hover:no-underline data-[state=closed]:bg-white data-[state=closed]:rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconWrapper className="bg-primary">
                          <LayoutGrid className="text-primary-foreground" />
                        </IconWrapper>
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900">
                            {department.name}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {department.clients.reduce(
                              (acc, client) => acc + client.positions.length,
                              0,
                            )}{' '}
                            puesto
                            {department.clients.reduce(
                              (acc, client) => acc + client.positions.length,
                              0,
                            ) !== 1
                              ? 's'
                              : ''}{' '}
                            en {department.clients.length} cliente
                            {department.clients.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                      <div className="ml-4">
                        <Accordion
                          type="multiple"
                          value={openClients[department.name]}
                          onValueChange={(values) =>
                            handleClientAccordionChange(department.name, values)
                          }
                          className="space-y-3 w-full"
                        >
                          {department.clients.map((client) => (
                            <AccordionItem
                              key={client.id}
                              value={client.id.toString()}
                              className="border rounded-lg p-0 bg-neutral-50 border-l-4 border-l-neutral-200"
                            >
                              <AccordionTrigger className="flex items-center justify-between p-3 text-left font-semibold text-neutral-800 hover:no-underline data-[state=closed]:bg-white data-[state=closed]:rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <IconWrapper className="bg-neutral-200">
                                    <Building className="text-secondary-foreground" />
                                  </IconWrapper>
                                  <div>
                                    <h4 className="text-lg font-semibold text-neutral-800">
                                      {client.empresa}
                                    </h4>
                                    <p className="text-xs text-neutral-500">
                                      {client.positions.length} puesto
                                      {client.positions.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-3 pt-0">
                                <div className="w-full ml-4">
                                  <Accordion
                                    type="multiple"
                                    value={openPositions[client.id.toString()]}
                                    onValueChange={(values) =>
                                      handlePositionAccordionChange(
                                        client.id.toString(),
                                        values,
                                        client.positions,
                                      )
                                    }
                                    className="flex flex-wrap gap-3"
                                  >
                                    {client.positions.map((position) => (
                                      <AccordionItem
                                        key={position.id}
                                        value={position.id.toString()}
                                        className="border rounded-lg p-0 bg-white flex-shrink-0 flex-grow-0"
                                        style={{
                                          borderLeftColor: position.color,
                                          borderLeftWidth: '4px',
                                          maxWidth: 'fit-content',
                                          maxHeight: 'fit-content',
                                        }}
                                      >
                                        <AccordionTrigger className="flex items-center justify-between gap-3 p-3 text-left font-semibold text-neutral-800 hover:no-underline">
                                          <div className="flex items-center space-x-3">
                                            <IconWrapper
                                              style={{
                                                backgroundColor: position.color,
                                              }}
                                            >
                                              <Briefcase className="text-white" />
                                            </IconWrapper>
                                            <div>
                                              <CardTitle className="text-base">
                                                {position.name} (
                                                {position.siglas})
                                              </CardTitle>
                                              <p className="text-xs text-neutral-500">
                                                {position.totalHoras}h •{' '}
                                                {position.employees.length}{' '}
                                                empleado
                                                {position.employees.length !== 1
                                                  ? 's'
                                                  : ''}
                                              </p>
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-3 pt-0">
                                          {position.description && (
                                            <p className="text-sm text-neutral-600 mb-3">
                                              {position.description}
                                            </p>
                                          )}

                                          {position.employees.length > 0 ? (
                                            <div className="space-y-2">
                                              <h5 className="text-sm font-semibold text-neutral-700">
                                                Empleados:
                                              </h5>
                                              {position.employees.map(
                                                (employee) => (
                                                  <div
                                                    key={employee.id}
                                                    className="flex items-center space-x-2 p-2 bg-neutral-50 rounded-lg"
                                                  >
                                                    <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center">
                                                      <User className="w-3 h-3 text-neutral-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-medium text-neutral-900 truncate">
                                                        {employee.name}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-center py-2">
                                              <User className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                                              <p className="text-xs text-neutral-500">
                                                Sin empleados asignados
                                              </p>
                                            </div>
                                          )}
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </LayoutContent>
      </div>
    </>
  );
}
