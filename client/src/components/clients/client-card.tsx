import * as React from 'react';
import {
  Edit3,
  Trash2,
  Building,
  Mail,
  Phone,
  User,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { Cliente, Position } from '@shared/schema';
import { IconWrapper } from '../ui/iconwrapper';
import { colorLightenDarken } from '@/lib/utils';

interface ClientCardProps {
  cliente: Cliente;
  clientPositions: Position[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function ClientCard({
  cliente,
  clientPositions,
  onEdit,
  onDelete,
  isDeleting,
}: ClientCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconWrapper>
              <Building />
            </IconWrapper>
            <div>
              <CardTitle className="text-lg">{cliente.empresa}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {cliente.localidad}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(cliente)}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={isDeleting}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              }
              title="¿Eliminar cliente?"
              description="Esta acción no se puede deshacer. ¿Querés continuar?"
              onConfirm={() => onDelete(cliente.id)}
              isLoading={isDeleting}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            {cliente.direccion && <span>{cliente.direccion}</span>}
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <User className="w-4 h-4" />
            {cliente.nombreContacto && <span>{cliente.nombreContacto}</span>}
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Phone className="w-4 h-4" />
            {cliente.telefono && <span>{cliente.telefono}</span>}
          </div>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <Mail className="w-4 h-4" />
            {cliente.email && <span>{cliente.email}</span>}
          </div>

          {/* Positions Section */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-neutral-700 mb-2">
              Puestos Asignados:
            </h4>
            {clientPositions.length > 0 ? (
              <div className="flex flex-col gap-1">
                {clientPositions.map((position) => (
                  <Badge
                    key={position.id}
                    className="space-x-2 text-sm bg-neutral-200 text-foreground w-full font-semibold"
                  >
                    <Briefcase className="w-4 h-4 min-w-4 min-h-4" />
                    <span>{position.name}</span>
                    <Badge
                      key={position.id}
                      variant="outline"
                      className="text-sm rounded-full"
                      style={{
                        backgroundColor: `${colorLightenDarken(position.color, 0.8)}`,
                        color: position.color,
                        borderColor: position.color,
                      }}
                    >
                      {position.siglas}
                    </Badge>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                No hay puestos definidos para este cliente.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
