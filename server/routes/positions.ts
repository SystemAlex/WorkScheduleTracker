import { Router } from 'express';
import { storage } from '../storage';
import { insertPositionSchema } from '@shared/schema';
import { validate } from '../middleware/validate'; // Import the new middleware

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
positionsRouter.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const positions = await storage.getPositions(search as string);
    res.json(positions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch positions' });
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
 */
positionsRouter.post('/', validate(insertPositionSchema), async (req, res) => {
  try {
    // req.body is already validated by the middleware
    const position = await storage.createPosition(req.body);
    res.status(201).json(position);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create position' });
  }
});

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
 *       500:
 *         description: Error interno
 */
positionsRouter.put(
  '/:id',
  validate(insertPositionSchema),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // req.body is already validated by the middleware
      const position = await storage.updatePosition(id, req.body);
      res.json(position);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update position' });
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
 *       500:
 *         description: Error interno
 */
positionsRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deletePosition(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete position' });
  }
});

export default positionsRouter;
