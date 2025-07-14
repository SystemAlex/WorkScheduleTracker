import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { LayoutContent } from '@/components/ui/layout';
import { CompanySummaryCards } from '@/components/sentinelzone/company-summary-cards';
import { CompanyStatusChart } from '@/components/sentinelzone/company-status-chart';
import { CompanyPaymentPlanChart } from '@/components/sentinelzone/company-payment-plan-chart';
import { ActiveSessionsList } from '@/components/sentinelzone/active-sessions-list';
import type { MainCompany, User } from '@shared/schema';
import { calculateCompanyStatuses } from '@/lib/superadmin-utils';
import { LoginHistoryChart } from '@/components/sentinelzone/login-history-chart';

type CompanyWithAdmins = MainCompany & { users: User[] };

interface ActiveSession {
  username: string;
  role: string;
  expire: string;
  companyName: string | null; // Añadido para resolver el error de tipo
}

export default function SuperAdminDashboard() {
  const { data: companies = [], isLoading: companiesLoading } = useQuery<
    CompanyWithAdmins[]
  >({
    queryKey: ['/api/sentinelzone/main-companies', 'v2'],
  });

  const { data: activeSessions = [], isLoading: sessionsLoading } = useQuery<
    ActiveSession[]
  >({
    queryKey: ['/api/sentinelzone/active-sessions'],
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const companiesWithStatus = React.useMemo(() => {
    return calculateCompanyStatuses(companies);
  }, [companies]);

  const isLoading = companiesLoading || sessionsLoading;

  if (isLoading && companies.length === 0) {
    // Mostrar loading solo en la carga inicial
    return (
      <>
        <Header
          title="Panel de SuperAdmin"
          subtitle="Resumen de Empresas y Actividad de la Plataforma"
        />
        <LayoutContent className="p-4">
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-neutral-500 mt-2">
                Cargando estadísticas...
              </p>
            </div>
          </div>
        </LayoutContent>
      </>
    );
  }

  return (
    <>
      <Header
        title="Panel de SuperAdmin"
        subtitle="Resumen de Empresas y Actividad de la Plataforma"
      />
      <LayoutContent className="p-4 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-neutral-800">
            Resumen de Suscripciones
          </h3>
          <CompanySummaryCards companies={companiesWithStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompanyStatusChart companies={companiesWithStatus} />
          <CompanyPaymentPlanChart companies={companiesWithStatus} />
        </div>

        <div>
          <LoginHistoryChart />
        </div>

        <div>
          <ActiveSessionsList
            sessions={activeSessions}
            isLoading={sessionsLoading && activeSessions.length === 0}
          />
        </div>
      </LayoutContent>
    </>
  );
}
