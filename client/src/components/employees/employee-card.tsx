import * as React from 'react';
import { Edit3, Trash2, User, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { Employee, ShiftWithDetails } from '@shared/schema';
import { format } from 'date-fns';

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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <Badge
                variant={
                  employee.status === 'active' ? 'default' : 'secondary'
                }
              >
                {employee.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(employee)}
            >
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
                  <div
                    key={shift.id}
                    className="flex items-center justify-between text-sm text-neutral-700 bg-neutral-50 p-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: shift.position.color }}
                      />
                      <span>{shift.position.name}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {format(new Date(shift.date), 'dd/MM/yyyy')}
                    </span>
                  </div>
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