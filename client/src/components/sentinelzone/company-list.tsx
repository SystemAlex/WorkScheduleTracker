import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, DollarSign, KeyRound } from 'lucide-react'; // Import KeyRound
import type { MainCompany } from '@shared/schema'; // Import MainCompany
import { format, parse } from 'date-fns'; // Import parse
import { es } from 'date-fns/locale';
import { CompanyWithCalculatedStatus } from '@/lib/superadmin-utils';
import { ConfirmDialog } from '@/components/ui/confirm'; // Import ConfirmDialog

interface CompanyListProps {
  companies: CompanyWithCalculatedStatus[];
  onEdit: (company: MainCompany) => void;
  onDelete: (id: number) => void;
  onRegisterPayment: (company: MainCompany) => void;
  onResetAdminPassword: (companyId: number) => void; // New prop for resetting password
  isDeleting: boolean;
  isResettingPassword: boolean; // New prop for loading state
}

export function CompanyList({
  companies,
  onEdit,
  onDelete,
  onRegisterPayment,
  onResetAdminPassword,
  isDeleting,
  isResettingPassword,
}: CompanyListProps) {
  const renderStatusBadge = (company: CompanyWithCalculatedStatus) => {
    if (!company.isActive) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    if (company.isOverdue) {
      return <Badge variant="destructive">Vencida</Badge>;
    }
    if (company.isPaymentDueSoon) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 border-yellow-800"
        >
          Pago Próximo
        </Badge>
      );
    }
    return <Badge variant="success">Activa</Badge>;
  };

  // Helper function to format date correctly, compensating for timezone
  const formatDateForDisplay = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    // Use date-fns.parse to interpret the 'yyyy-MM-dd' string as a local date, avoiding timezone shifts.
    const date = parse(dateString, 'yyyy-MM-dd', new Date());
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Control de Pago</TableHead>
            <TableHead>Último Pago</TableHead>
            <TableHead>Administradores</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{renderStatusBadge(company)}</TableCell>
              <TableCell className="capitalize">
                {company.paymentControl}
              </TableCell>
              <TableCell>
                {formatDateForDisplay(company.lastPaymentDate)}
              </TableCell>
              <TableCell>
                {company.users.map((user) => user.username).join(', ') ||
                  'Sin admin'}
              </TableCell>
              <TableCell className="text-right flex justify-end space-x-2">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isResettingPassword}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  }
                  title="¿Restablecer contraseña del administrador?"
                  description="Esto establecerá la contraseña del administrador de esta empresa a 'resetPass1234'. ¿Querés continuar?"
                  onConfirm={() => onResetAdminPassword(company.id)}
                  isLoading={isResettingPassword}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegisterPayment(company)}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(company)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                  title="¿Eliminar empresa?"
                  description="Esta acción marcará la empresa como eliminada y no podrá acceder. ¿Querés continuar?"
                  onConfirm={() => onDelete(company.id)}
                  isLoading={isDeleting}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
