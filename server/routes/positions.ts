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
 *     responses:
 *       200:
 *         description: Lista de puestos
 */
positionsRouter.get('/', async (req, res) => {
  try {
    const positions = await storage.getPositions();
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

export default positionsRouter;
