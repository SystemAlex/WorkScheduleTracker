import { Router } from 'express';
import { storage } from '../storage';
import { insertPositionSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { ConflictError, NotFoundError } from '../errors'; // Import custom errors

const positionsRouter = Router();

/**
 * @openapi
 * /api/positions:
 *   get:
 *     summary: Obtiene todos los puestos
 *     tags: [Positions]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar puestos por nombre.
 *     responses:
 *       200:
 *         description: Lista de puestos
 */
positionsRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const positions = await storage.getPositions(search as string);
    res.json(positions);
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/positions:
 *   post:
 *     summary: Crea un nuevo puesto
 *     tags: [Positions]
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
 *       409:
 *         description: Conflicto (nombre de puesto ya existe)
 */
positionsRouter.post(
  '/',
  validate(insertPositionSchema),
  async (req, res, next) => {
    try {
      const position = await storage.createPosition(req.body);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, code: error.code });
      }
      next(error); // Pass other errors to global error handler
    }
  },
);

/**
 * @openapi
 * /api/positions/{id}:
 *   put:
 *     summary: Actualiza un puesto existente
 *     tags: [Positions]
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
 *       404:
 *         description: Puesto no encontrado
 *       409:
 *         description: Conflicto (nombre de puesto ya existe)
 *       500:
 *         description: Error interno
 */
positionsRouter.put(
  '/:id',
  validate(insertPositionSchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const position = await storage.updatePosition(id, req.body);
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
      next(error); // Pass other errors to global error handler
    }
  },
);

/**
 * @openapi
 * /api/positions/{id}:
 *   delete:
 *     summary: Elimina un puesto
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Puesto eliminado
 *       404:
 *         description: Puesto no encontrado
 *       500:
 *         description: Error interno
 */
positionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deletePosition(id);
    if (!deleted) {
      throw new NotFoundError('Position not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

export default positionsRouter;
