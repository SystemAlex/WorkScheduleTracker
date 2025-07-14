import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building,
  CheckCircle,
  XCircle,
  Clock,
  FileWarning,
  Slash,
} from 'lucide-react';
import { CompanyWithCalculatedStatus } from '@/lib/superadmin-utils';

interface CompanySummaryCardsProps {
  companies: CompanyWithCalculatedStatus[];
}

export function CompanySummaryCards({ companies }: CompanySummaryCardsProps) {
  const totalCompanies = companies.length;

  // A company is considered "Active" if its manual flag is true AND its payment is not overdue.
  const activeCompanies = companies.filter(
    (c) => c.isActive && !c.isOverdue,
  ).length;

  // A company is "Overdue" if its payment date has passed, regardless of the manual isActive flag.
  const overdueCompanies = companies.filter((c) => c.isOverdue).length;

  // A company is "Manually Inactive" if its manual flag is false, but its payment is NOT overdue.
  const manuallyInactiveCompanies = companies.filter(
    (c) => !c.isActive && !c.isOverdue,
  ).length;

  const dueSoonCompanies = companies.filter(
    (c) => c.isPaymentDueSoon && c.isActive,
  ).length;
  const withoutPaymentCompanies = companies.filter(
    (c) => c.hasNoPaymentRegistered,
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="border-b-4 border-b-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCompanies}</div>
          <p className="text-xs text-muted-foreground">Empresas registradas</p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-success">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Empresas Activas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Con suscripción al día
          </p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-destructive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Empresas Vencidas
          </CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overdueCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Suscripción expirada por fecha
          </p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagos Próximos</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dueSoonCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Vencen en los próximos 5 días
          </p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-gray-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
          <Slash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{manuallyInactiveCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Desactivadas manualmente
          </p>
        </CardContent>
      </Card>

      <Card className="border-b-4 border-b-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sin Pago</CardTitle>
          <FileWarning className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{withoutPaymentCompanies}</div>
          <p className="text-xs text-muted-foreground">
            Pendientes del primer pago
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
