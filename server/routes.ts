import type { Express } from 'express';
import { createServer, type Server } from 'http';
import employeesRouter from './routes/employees';
import positionsRouter from './routes/positions';
import shiftsRouter from './routes/shifts';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';
import adminRouter from './routes/sentinelzone';
import usersRouter from './routes/users';
import authRouter from './routes/auth'; // Importar el router de autenticación

export async function registerRoutes(app: Express): Promise<Server> {
  // Registrar todas las rutas de la API aquí
  app.use('/api/auth', authRouter);
  app.use('/api/employees', employeesRouter);
  app.use('/api/positions', positionsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/clientes', clientsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/sentinelzone', adminRouter);

  const httpServer = createServer(app);
  return httpServer;
}