import * as React from 'react';
import { Switch, Route, useLocation, Router } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { Layout, LayoutSidebar, LayoutMain } from '@/components/ui/layout';
import { createBaseLocationHook } from './lib/wouterBaseHook';

// Pages
import Calendar from '@/pages/calendar';
import Organigrama from '@/pages/organigrama';
import Employees from '@/pages/employees';
import Positions from '@/pages/positions';
import Reports from '@/pages/reports';
import NotFound from '@/pages/not-found';
import Clientes from '@/pages/clientes';
import { base } from './lib/paths';

function MyRouter() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/organigrama" component={Organigrama} />
      <Route path="/employees" component={Employees} />
      <Route path="/positions" component={Positions} />
      <Route path="/reports" component={Reports} />
      <Route path="/clientes" component={Clientes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [rawLocation, navigate] = useLocation();

  const customHook = React.useMemo(() => {
    return () => createBaseLocationHook(base(''), rawLocation, navigate);
  }, [rawLocation, navigate, base('')]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={customHook}>
          <Layout>
            <Sidebar />
            <LayoutMain id="main-content" tabIndex={-1}>
              <MyRouter />
            </LayoutMain>
          </Layout>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
