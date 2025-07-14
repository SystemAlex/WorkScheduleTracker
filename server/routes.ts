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
  // Aplicar checkCompanyPaymentStatus a todas las rutas de la API que lo requieran
  // Este middleware debe ejecutarse DESPUÉS de isAuthenticated y authorizeCompany (que se aplican dentro de cada router)
  app.use('/api/auth', authRouter); // Registrar el router de autenticación
  app.use('/api/employees', employeesRouter);
  app.use('/api/positions', positionsRouter);
  app.use('/api/shifts', shiftsRouter);
  app.use('/api/clientes', clientsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/users', usersRouter);
  // Las rutas de administrador pueden tener su propia lógica o no necesitar la verificación de pago
  app.use('/api/sentinelzone', adminRouter);

  const httpServer = createServer(app);
  return httpServer;
}