import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import {
  createServer as createViteServer,
  createLogger as createViteLogger,
} from 'vite';
import { type Server } from 'http';
import viteConfig from '../vite.config'; // Importamos viteConfig para obtener la ruta base
import { nanoid } from 'nanoid';
import logger from './utils/logger';

const viteLogger = createViteLogger();

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
        logger.error(`Vite Error: ${msg}`, options);
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

      // Siempre recargar el index.html del disco por si cambia
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
  // Obtenemos la ruta base de Vite, que será '/vipsrl/' en producción
  const publicBase = viteConfig.base.endsWith('/') ? viteConfig.base : `${viteConfig.base}/`;

  if (!fs.existsSync(distPath)) {
    logger.error(
      `No se encontró el directorio de construcción: ${distPath}, asegúrate de construir el cliente primero`,
    );
    throw new Error(
      `No se encontró el directorio de construcción: ${distPath}, asegúrate de construir el cliente primero`,
    );
  }

  // Montar los archivos estáticos en la ruta base correcta (ej: /vipsrl/)
  app.use(publicBase, express.static(distPath));

  // Para el enrutamiento de SPA, cualquier ruta que comience con publicBase
  // debe servir el index.html para que React Router (Wouter) maneje la ruta.
  app.use((req, res, next) => {
    if (req.path.startsWith(publicBase)) {
      res.sendFile(path.resolve(distPath, 'index.html'));
    } else {
      next(); // No es una ruta de la SPA, pasar al siguiente middleware (ej: rutas de API)
    }
  });
}