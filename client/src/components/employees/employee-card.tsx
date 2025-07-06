import * as React from 'react';
import { Edit3, Trash2, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { Employee, ShiftWithDetails } from '@shared/schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { IconWrapper } from '../ui/iconwrapper';

interface EmployeeCardProps {
  employee: Employee;
  upcomingShifts: ShiftWithDetails[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function EmployeeCard({
  employee,
  upcomingShifts,
  onEdit,
  onDelete,
  isDeleting,
}: EmployeeCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconWrapper>
              <User />
            </IconWrapper>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <Badge
                variant={employee.status === 'active' ? 'default' : 'secondary'}
              >
                {employee.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(employee)}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={isDeleting}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              }
              title="¿Eliminar empleado?"
              description="Esta acción no se puede deshacer. ¿Querés continuar?"
              onConfirm={() => onDelete(employee.id)}
              isLoading={isDeleting}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {employee.email && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Mail className="w-4 h-4" />
              <span>{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Phone className="w-4 h-4" />
              <span>{employee.phone}</span>
            </div>
          )}

          {/* Upcoming Shifts Section */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-neutral-700 mb-2">
              Próximos Turnos:
            </h4>
            {upcomingShifts.length > 0 ? (
              <div className="space-y-2">
                {upcomingShifts.map((shift) => (
                  <Tooltip key={shift.id}>
                    <TooltipTrigger asChild>
                      <Badge
                        key={shift.id}
                        variant="outline"
                        className="text-sm rounded-full mr-2 space-x-1"
                        style={{
                          backgroundColor: `${shift.position.color}20`,
                          color: shift.position.color,
                          borderColor: shift.position.color,
                        }}
                      >
                        <span className="">
                          {format(new Date(shift.date), 'eeee', {
                            locale: es,
                          }).toLocaleUpperCase()}
                        </span>
                        <span className="font-bold">
                          {format(new Date(shift.date), 'dd/MMM', {
                            locale: es,
                          }).toLocaleUpperCase()}
                        </span>
                        <span> - {shift.position.siglas}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{shift.position.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                No hay turnos próximos asignados.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
