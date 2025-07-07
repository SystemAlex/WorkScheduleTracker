import 'dotenv/config';
import express, { NextFunction, type Request, Response } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import logger from './utils/logger';
import { env } from './config/env'; // Importamos env para NODE_ENV
import { CustomError } from './errors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Determinamos el prefijo de la API: vacío en desarrollo, '/vipsrl' en producción
const apiPrefix = env.NODE_ENV === 'production' ? '/vipsrl' : '';

// Configuración de Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'WorkScheduleTracker API',
    version: '1.0.0',
    description: 'Documentación de la API de WorkScheduleTracker',
  },
  servers: [
    {
      url: `${apiPrefix}/api`, // Usamos el prefijo dinámico para la URL base de Swagger
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [
    './server/routes/employees.ts',
    './server/routes/positions.ts',
    './server/routes/shifts.ts',
    './server/routes/clients.ts',
    './server/routes/reports.ts',
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
// Montamos la UI de Swagger bajo la ruta de API con el prefijo
app.use(`${apiPrefix}/api/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Registramos las solicitudes de API, considerando el prefijo completo
    if (path.startsWith(`${apiPrefix}/api`)) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

(async () => {
  // Pasamos el apiPrefix a registerRoutes
  const server = await registerRoutes(app, apiPrefix);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as CustomError | {
      status?: number;
      statusCode?: number;
      message?: string;
      stack?: string;
    };

    const status = (e instanceof CustomError) ? e.statusCode : (e.status ?? e.statusCode ?? 500);
    const message = e.message ?? 'Internal Server Error';
    const code = (e instanceof CustomError) ? e.code : undefined;
    const details = (e instanceof CustomError) ? e.details : undefined;

    logger.error(`Error: ${message}`, {
      stack: e.stack,
      status,
      path: _req.path,
      method: _req.method,
      code,
      details,
    });

    res.status(status).json({ message, code, details });
  });
  /* eslint-enable */

  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(
    {
      port,
      host: '0.0.0.0',
      reusePort: true,
    },
    () => {
      logger.info(`serving on port ${port}`);
    },
  );
})();