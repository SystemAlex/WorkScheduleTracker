import { Router, Request } from 'express';
import { storage } from '../storage';
import { insertPositionSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { ConflictError, NotFoundError } from '../errors';
import {
  isAuthenticated,
  authorizeCompany,
  authorizeRole,
  checkCompanyPaymentStatus,
} from '../middleware/auth'; // Importar middlewares

const positionsRouter = Router();

// Aplicar isAuthenticated y authorizeCompany a todas las rutas de puestos
positionsRouter.use(
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
);

/**
 * @openapi
 * /api/positions:
 *   get:
 *     summary: Obtiene todos los puestos
 *     tags: [Positions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar puestos por nombre.
 *     responses:
 *       200:
 *         description: Lista de puestos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
positionsRouter.get('/', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { search } = req.query;
    // Pasar mainCompanyId a la función de almacenamiento
    const positions = await storage.getPositions(
      search as string,
      req.mainCompanyId ?? undefined,
    );
    res.json(positions);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/positions:
 *   post:
 *     summary: Crea un nuevo puesto
 *     tags: [Positions]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Puesto creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       409:
 *         description: Conflicto (nombre de puesto ya existe)
 */
positionsRouter.post(
  '/',
  authorizeRole(['admin']), // Solo administradores pueden crear puestos
  validate(insertPositionSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      // Pasar mainCompanyId a la función de almacenamiento
      const position = await storage.createPosition(
        req.body,
        req.mainCompanyId!,
      );
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, code: error.code });
      }
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/positions/{id}:
 *   put:
 *     summary: Actualiza un puesto existente
 *     tags: [Positions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Puesto actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Puesto no encontrado
 *       409:
 *         description: Conflicto (nombre de puesto ya existe)
 *       500:
 *         description: Error interno
 */
positionsRouter.put(
  '/:id',
  authorizeRole(['admin']), // Solo administradores pueden actualizar puestos
  validate(insertPositionSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const position = await storage.updatePosition(
        id,
        req.body,
        req.mainCompanyId ?? undefined,
      );
      if (!position) {
        throw new NotFoundError('Position not found');
      }
      res.json(position);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, code: error.code });
      }
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/positions/{id}:
 *   delete:
 *     summary: Elimina un puesto
 *     tags: [Positions]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Puesto eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Puesto no encontrado
 *       500:
 *         description: Error interno
 */
positionsRouter.delete(
  '/:id',
  authorizeRole(['admin']),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const deleted = await storage.deletePosition(
        id,
        req.mainCompanyId ?? undefined,
      );
      if (!deleted) {
        throw new NotFoundError('Position not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default positionsRouter;
