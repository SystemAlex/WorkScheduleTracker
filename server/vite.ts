import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import {
  createServer as createViteServer,
  createLogger as createViteLogger,
} from 'vite';
import { type Server } from 'http';
import viteConfig from '../vite.config';
import { nanoid } from 'nanoid';
import logger from './utils/logger'; // Import the new logger

const viteLogger = createViteLogger(); // Keep Vite's logger for internal Vite messages

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ['*'],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        logger.error(`Vite Error: ${msg}`, options); // Use new logger for Vite errors
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        '..',
        'client',
        'index.html',
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, 'public');
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? '/vipsrl' : ''; // Coincide con la URL base de vite.config.ts

  if (!fs.existsSync(distPath)) {
    logger.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Servir archivos estáticos bajo la URL base correcta
  app.use(baseUrl, express.static(distPath));

  // Fallback a index.html para el enrutamiento del lado del cliente,
  // pero solo para rutas que comienzan con la URL base.
  // Esto asegura que las solicitudes a la API no sean interceptadas.
  app.use(`${baseUrl}/*`, (req, res, next) => {
    // Si la solicitud es para una ruta de API, no la manejes aquí.
    // Las rutas de API ya están registradas con el prefijo /vipsrl/api
    if (req.path.startsWith(`${baseUrl}/api/`)) {
      return next();
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
