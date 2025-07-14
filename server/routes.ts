import type { Express } from 'express';
import { createServer, type Server } from 'http';
import employeesRouter from './routes/employees';
import positionsRouter from './routes/positions';
import shiftsRouter from './routes/shifts';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';
import adminRouter from './routes/sentinelzone';
import usersRouter from './routes/users'; // New import
import { base } from '@shared/paths';

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply checkCompanyPaymentStatus to all API routes that require an active company
  // This middleware should run AFTER isAuthenticated and authorizeCompany (which are applied inside each router)
  app.use('/api/employees', employeesRouter);
  app.use('/api/positions', positionsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/clientes', clientsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/users', usersRouter); // New route
  // Admin routes are typically for SuperAdmin and might not need payment status check, or have their own logic
  app.use('/api/sentinelzone', adminRouter); // Updated route prefix

  const httpServer = createServer(app);
  return httpServer;
}
