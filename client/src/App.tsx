import * as React from 'react';
import { Switch, Route, Router, Redirect, useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { Layout, LayoutMain } from '@/components/ui/layout';
import { base } from '@/lib/paths';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { PaymentStatusBanner } from '@/components/layout/payment-status-banner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ThemeProvider } from '@/components/theme-provider'; // New import

// Pages
import LoginPage from '@/pages/login';
import SetPasswordPage from '@/pages/set-password';
import Calendar from '@/pages/calendar';
import Estructura from '@/pages/estructura';
import Employees from '@/pages/employees';
import Positions from '@/pages/positions';
import Reports from '@/pages/reports';
import NotFound from '@/pages/not-found';
import Clientes from '@/pages/clientes';
import UsersPage from '@/pages/users';
import SetupWizardPage from '@/pages/setup-wizard';
// New imports for SuperAdmin pages
import SuperAdminDashboard from '@/pages/sentinelzone/dashboard';
import CompaniesPage from '@/pages/sentinelzone/companies';

// Componente que maneja la lógica de renderizado principal
function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-neutral-600 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // A partir de aquí, el objeto 'user' está garantizado.

  // 1. Verificación de pago (solo para no super_admins)
  if (
    user.role !== 'super_admin' &&
    user.companyStatus &&
    !user.companyStatus.isActive
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Cuenta Inactiva</CardTitle>
            <CardDescription>No se puede continuar.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              La suscripción de tu empresa está inactiva. Por favor, contacta a
              soporte para activar tu cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Prioridad 1: Asistente de configuración para Admins
  if (user.role === 'admin' && user.companyStatus?.needsSetup) {
    return <SetupWizardPage />;
  }

  // 3. Prioridad 2: Cambio de contraseña para cualquier usuario
  if (user.mustChangePassword) {
    // Solo permite el acceso a la página de cambio de contraseña
    return (
      <Switch>
        <Route path="/set-password" component={SetPasswordPage} />
        <Route>
          <Redirect to="/set-password" />
        </Route>
      </Switch>
    );
  }

  // 4. Acceso normal: Si el usuario está completamente configurado,
  // redirigir fuera de las páginas de configuración si intenta acceder a ellas.
  if (
    location === '/login' ||
    location === '/set-password' ||
    location === '/setup-wizard'
  ) {
    const target =
      user.role === 'super_admin' ? '/sentinelzone/dashboard' : '/';
    return <Redirect to={target} />;
  }

  // Renderizado del layout principal de la aplicación
  return (
    <Layout>
      <Sidebar />
      <LayoutMain id="main-content" tabIndex={-1}>
        <PaymentStatusBanner />
        <Switch>
          {user.role === 'super_admin' ? (
            <>
              <Route
                path="/sentinelzone/dashboard"
                component={SuperAdminDashboard}
              />
              <Route path="/sentinelzone/companies" component={CompaniesPage} />
              <Route path="/">
                <Redirect to="/sentinelzone/dashboard" />
              </Route>
            </>
          ) : (
            <>
              <Route path="/estructura" component={Estructura} />
              <Route path="/employees" component={Employees} />
              <Route path="/positions" component={Positions} />
              <Route path="/reports" component={Reports} />
              <Route path="/clientes" component={Clientes} />
              {user.role === 'admin' && (
                <Route path="/users" component={UsersPage} />
              )}
              <Route path="/" component={Calendar} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </LayoutMain>
    </Layout>
  );
}

// El componente principal App ahora se encarga de configurar los proveedores.
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Router base={base('')}>
              <AppContent />
            </Router>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
