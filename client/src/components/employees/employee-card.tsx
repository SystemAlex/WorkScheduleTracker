import * as React from 'react';
import {
  Edit3,
  Trash2,
  User,
  Mail,
  Phone,
  Briefcase,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { Employee, ShiftWithDetails } from '@shared/schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { IconWrapper } from '../ui/iconwrapper';
import {
  colorLightenDarken,
  getCssVarValue,
  getRelativeDayLabel,
} from '@/lib/utils';

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
                className={employee.status === 'active' ? 'bg-success' : ''}
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
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Mail className="w-4 h-4" />
            {employee.email && <span>{employee.email}</span>}
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Phone className="w-4 h-4" />
            {employee.phone && <span>{employee.phone}</span>}
          </div>

          <div className="mt-4 w-full overflow-hidden">
            {upcomingShifts.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th colSpan={3}>
                      <div className="flex items-center space-x-2 text-sm font-semibold text-neutral-600 text-left">
                        <Briefcase className="w-4 h-4 min-w-4 min-h-4" />
                        <span>Próximos Turnos:</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingShifts.map((shift) => (
                    <tr
                      key={shift.id}
                      className="inline-flex items-center rounded-md border px-2.5 py-0.5 mb-1 w-full bg-neutral-200"
                      style={
                        getRelativeDayLabel(new Date(shift.date)) === 'HOY'
                          ? {
                              backgroundColor: `${colorLightenDarken(getCssVarValue('--success'), 0.8)}`,
                              color: 'var(--success)',
                              borderColor: 'var(--success)',
                            }
                          : {}
                      }
                    >
                      <td>
                        <h4 className="flex items-center text-sm font-semibold after:content-['-'] after:px-1">
                          {getRelativeDayLabel(new Date(shift.date)) ===
                          'HOY' ? (
                            <Star className="inline w-4 min-w-4 max-w-4 h-4 min-h-4 max-h-4 mr-1" />
                          ) : (
                            <></>
                          )}
                          {getRelativeDayLabel(new Date(shift.date))}
                        </h4>
                      </td>
                      <td className="text-sm space-x-1 after:content-['-'] after:px-1">
                        <span className="">
                          {format(new Date(shift.date), 'eee', {
                            locale: es,
                          }).toLocaleUpperCase()}
                        </span>
                        <span className="font-bold">
                          {format(new Date(shift.date), 'dd/MMM', {
                            locale: es,
                          }).toLocaleUpperCase()}
                        </span>
                      </td>
                      <td className="p-0">
                        <Tooltip key={shift.id}>
                          <TooltipTrigger asChild>
                            <Badge
                              key={shift.id}
                              variant="outline"
                              className="text-sm rounded-full"
                              style={{
                                backgroundColor: `${colorLightenDarken(shift.position.color, 0.8)}`,
                                color: shift.position.color,
                                borderColor: shift.position.color,
                              }}
                            >
                              <span>{shift.position.siglas}</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>{shift.position.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                  Próximos Turnos:
                </h4>
                <p className="text-xs text-neutral-500">
                  No hay turnos próximos asignados.
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
