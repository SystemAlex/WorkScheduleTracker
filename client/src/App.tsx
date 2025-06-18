import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Layout, LayoutSidebar, LayoutMain } from "@/components/ui/layout";

// Pages
import Calendar from "@/pages/calendar";
import Organigrama from "@/pages/organigrama";
import Employees from "@/pages/employees";
import Positions from "@/pages/positions";
import Shifts from "@/pages/shifts";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Calendar} />
      <Route path="/organigrama" component={Organigrama} />
      <Route path="/employees" component={Employees} />
      <Route path="/positions" component={Positions} />
      <Route path="/shifts" component={Shifts} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <LayoutSidebar>
            <Sidebar />
          </LayoutSidebar>
          <LayoutMain>
            <Router />
          </LayoutMain>
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
