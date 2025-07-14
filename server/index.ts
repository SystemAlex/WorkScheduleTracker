import 'dotenv/config';
import './types/express.d.ts';
import express, { NextFunction, type Request, Response } from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { createServer } from 'http';

import { pool } from './db';
import logger from './utils/logger';
import './config/env';
import { CustomError, UnauthorizedError, ForbiddenError } from './errors';
import { setupVite, serveStatic } from './vite';

// Importar los routers directamente aquí
import authRouter from './routes/auth';
import employeesRouter from './routes/employees';
import positionsRouter from './routes/positions';
import shiftsRouter from './routes/shifts';
import clientsRouter from './routes/clients';
import reportsRouter from './routes/reports';
import usersRouter from './routes/users';
import adminRouter from './routes/sentinelzone';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const basePath = process.env.NODE_ENV === 'production' ? '/vipsrl/' : '/';
const PgSession = pgSession(session);

// El middleware de sesión se registra ANTES que las rutas
app.use(
  session({
    name: 'wst.session',
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 30 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: basePath,
    },
  }),
);

// Configuración de Swagger
const protectSwaggerDocs = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.role === 'super_admin') {
    return next();
  }
  res.redirect('/login');
};
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WorkScheduleTracker API',
    version: '1.0.0',
    description: 'Documentación de la API de WorkScheduleTracker',
  },
  servers: [{ url: 'http://localhost:5000' }],
};
const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './server/routes/employees.ts',
    './server/routes/positions.ts',
    './server/routes/shifts.ts',
    './server/routes/clients.ts',
    './server/routes/auth.ts',
    './server/routes/sentinelzone.ts',
    './server/routes/users.ts',
  ],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/sentinelzone/api/docs', protectSwaggerDocs, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      logger.info(logLine);
    }
  });
  next();
});

// Registrar todas las rutas de la API aquí
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/positions', positionsRouter);
app.use('/api/shifts', shiftsRouter);
app.use('/api/clientes', clientsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/users', usersRouter);
app.use('/api/sentinelzone', adminRouter);

// --- INICIO: Código para listar rutas ---
function listRoutes() {
  logger.info('--- Rutas Registradas ---');
  app._router.stack.forEach((middleware: any) => {
    // Check if it's a router (has a stack of its own)
    if (middleware.handle && middleware.handle.stack) {
      // Extract the base path for this router
      // This regex attempts to get the clean path from the middleware's regexp source
      const routerBasePathMatch = middleware.regexp.source.match(/^\/\^\\?(\/.+?)(?:\\\/\?\(\?\=\\\/\|\$\)\/\i)?$/);
      const routerBasePath = routerBasePathMatch ? routerBasePathMatch[1].replace(/\\/g, '') : '';

      middleware.handle.stack.forEach((handler: any) => {
        const route = handler.route;
        // Ensure route and route.methods exist
        if (route && route.methods) {
          const methods = Object.keys(route.methods).join(', ').toUpperCase();
          logger.info(`[${methods}] ${routerBasePath}${route.path}`);
        }
      });
    } else if (middleware.route) {
      // This is a direct route on the app (e.g., app.get('/'))
      const route = middleware.route;
      // Ensure route.methods exists
      if (route.methods) {
        const methods = Object.keys(route.methods).join(', ').toUpperCase();
        logger.info(`[${methods}] ${route.path}`);
      }
    }
  });
  logger.info('-------------------------');
}
// --- FIN: Código para listar rutas ---

// Crear el servidor HTTP a partir de la app ya configurada
const server = createServer(app);

(async () => {
  // Manejador de errores
  /* eslint-disable @typescript-eslint/no-unused-vars */
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as CustomError | { status?: number; statusCode?: number; message?: string; stack?: string; };
    let status = 500;
    let message = 'Internal Server Error';
    let code: string | undefined;
    let details: unknown | undefined;

    if (e instanceof CustomError) {
      status = e.statusCode;
      message = e.message;
      code = e.code;
      details = e.details;
    } else if (e instanceof UnauthorizedError) {
      status = 401;
      message = e.message;
      code = e.code;
    } else if (e instanceof ForbiddenError) {
      status = 403;
      message = e.message;
      code = e.code;
    } else if (typeof e === 'object' && e !== null) {
      if ('status' in e && typeof e.status === 'number') status = e.status;
      if ('statusCode' in e && typeof e.statusCode === 'number') status = e.statusCode;
      if ('message' in e && typeof e.message === 'string') message = e.message;
    }

    logger.error(`Error: ${message}`, { stack: e.stack, status, path: _req.path, method: _req.method, code, details });
    res.status(status).json({ message, code, details });
  });
  /* eslint-enable */

  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: '0.0.0.0', reusePort: true }, () => {
    logger.info(`serving on port ${port}`);
    listRoutes(); // Llamar a la función para listar las rutas al iniciar el servidor
  });
})();