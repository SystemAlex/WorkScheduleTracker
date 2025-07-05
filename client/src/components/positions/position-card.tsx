import * as React from 'react';
import { Briefcase, Building, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm';
import type { Position, Cliente } from '@shared/schema';
import { IconWrapper } from '../ui/iconwrapper';

interface PositionCardProps {
  position: Position;
  clientes: Cliente[];
  onEdit: (position: Position) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function PositionCard({
  position,
  clientes,
  onEdit,
  onDelete,
  isDeleting,
}: PositionCardProps) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: position.color }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconWrapper style={{ backgroundColor: position.color }}>
              <Briefcase className="text-white" />
            </IconWrapper>
            <div>
              <CardTitle className="text-lg">{position.name}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  {position.siglas}
                </Badge>
                <span className="text-xs text-neutral-500">
                  {position.totalHoras}h
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(position)}>
              <Edit3 className="w-4 h-4" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={isDeleting}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              }
              title="¿Eliminar puesto?"
              description="Esta acción no se puede deshacer. ¿Querés continuar?"
              onConfirm={() => onDelete(position.id)}
              isLoading={isDeleting}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {position.department && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Building className="w-4 h-4" />
              <span>{position.department}</span>
            </div>
          )}
          {position.description && (
            <p className="text-sm text-neutral-600">{position.description}</p>
          )}
          <Badge className="space-x-2 text-sm bg-neutral-200 text-foreground">
            <span>Cliente:</span>
            <span className="font-semibold">
              {clientes.find((c) => c.id === position.clienteId)?.empresa ||
                '-'}
            </span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
