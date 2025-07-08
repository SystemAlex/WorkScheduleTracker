import * as React from 'react';
import { Switch, Route, Router } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { Layout, LayoutMain } from '@/components/ui/layout';
import { base } from './lib/paths';

// Pages
import Calendar from '@/pages/calendar';
import Estructura from '@/pages/estructura';
import Employees from '@/pages/employees';
import Positions from '@/pages/positions';
import Reports from '@/pages/reports';
import NotFound from '@/pages/not-found';
import Clientes from '@/pages/clientes';

function MyRouter() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/estructura" component={Estructura} />
      <Route path="/employees" component={Employees} />
      <Route path="/positions" component={Positions} />
      <Route path="/reports" component={Reports} />
      <Route path="/clientes" component={Clientes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router base={base('')}>
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
