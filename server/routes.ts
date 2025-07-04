import type { Express } from 'express';
import { createServer, type Server } from 'http';
import employeesRouter from './routes/employees';
import positionsRouter from './routes/positions';
import shiftsRouter from './routes/shifts';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';

export async function registerRoutes(app: Express): Promise<Server> {
  // Use modular routers
  app.use('/api/employees', employeesRouter);
  app.use('/api/positions', positionsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/clientes', clientsRouter);
  app.use('/api/reports', reportsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
