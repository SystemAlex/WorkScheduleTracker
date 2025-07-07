import type { Express } from 'express';
import { createServer, type Server } from 'http';
import employeesRouter from './routes/employees';
import positionsRouter from './routes/positions';
import shiftsRouter from './routes/shifts';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';

// Agregamos el parámetro apiPrefix
export async function registerRoutes(app: Express, apiPrefix: string): Promise<Server> {
  // Montamos cada router de API bajo el prefijo dinámico
  app.use(`${apiPrefix}/api/employees`, employeesRouter);
  app.use(`${apiPrefix}/api/positions`, positionsRouter);
  app.use(`${apiPrefix}/api/shifts`, shiftsRouter);
  app.use(`${apiPrefix}/api/clientes`, clientsRouter);
  app.use(`${apiPrefix}/api/reports`, reportsRouter);

  const httpServer = createServer(app);
  return httpServer;
}