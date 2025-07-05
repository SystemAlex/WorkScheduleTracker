import { Router } from 'express';
import { storage } from '../storage';
import { insertPositionSchema } from '@shared/schema';
import { z } from 'zod';

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
positionsRouter.post('/', async (req, res) => {
  try {
    const validatedData = insertPositionSchema.parse(req.body);
    const position = await storage.createPosition(validatedData);
    res.status(201).json(position);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create position' });
    }
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
positionsRouter.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertPositionSchema.parse(req.body);
    const position = await storage.updatePosition(id, validatedData);
    res.json(position);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to update position' });
    }
  }
});

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
    res.status(500).json({ message: 'Failed to delete position' });
  }
});

export default positionsRouter;
