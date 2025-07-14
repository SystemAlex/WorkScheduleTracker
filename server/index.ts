import 'dotenv/config';
import './types/express.d.ts'; // Importación explícita del archivo de definición de tipos
import express, { NextFunction, type Request, Response } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import logger from './utils/logger';
import './config/env';
import { CustomError, UnauthorizedError, ForbiddenError } from './errors'; // Import new error types
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { pool } from './db'; // Import the pg pool
import authRouter from './routes/auth'; // Import the new auth router

const app = express();
app.set('trust proxy', 1); // Habilitar para obtener la IP correcta detrás de un proxy
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({
      pool: pool, // Use the same pg pool as Drizzle
      tableName: 'session', // Name of the table to store sessions
      createTableIfMissing: true, // Automatically create the session table if it doesn't exist
    }),
    secret: process.env.SESSION_SECRET || 'supersecretkey', // Use a strong secret from env
    resave: false,
    saveUninitialized: false,
    rolling: true, // <-- Reinicia el maxAge de la cookie en cada respuesta
    cookie: {
      maxAge: 30 * 60 * 1000, // Default to 30 minutes (1,800,000 ms)
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax', // CSRF protection
    },
  }),
);

// Middleware to protect Swagger docs
const protectSwaggerDocs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.session?.role === 'super_admin') {
    return next(); // User is super_admin, allow access
  }
  // For anyone else (not logged in, or not a super_admin), redirect to login
  res.redirect('/login');
};

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
      url: 'http://localhost:5000',
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
    './server/routes/auth.ts',
    './server/routes/sentinelzone.ts',
    './server/routes/users.ts', // Añadido para documentar los endpoints de usuarios
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use(
  '/sentinelzone/api/docs',
  protectSwaggerDocs,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

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
    if (path.startsWith('/api')) {
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
  // Register auth routes before other API routes
  app.use('/api/auth', authRouter);

  const server = await registerRoutes(app);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as
      | CustomError
      | {
          status?: number;
          statusCode?: number;
          message?: string;
          stack?: string;
        };

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
      if ('statusCode' in e && typeof e.statusCode === 'number')
        status = e.statusCode;
      if ('message' in e && typeof e.message === 'string') message = e.message;
    }

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
