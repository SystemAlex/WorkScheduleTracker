import { Router } from 'express';
import { storage } from '../storage';
import { insertShiftSchema } from '@shared/schema';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { ConflictError, NotFoundError } from '../errors'; // Import custom errors

const shiftsRouter = Router();

/**
 * @openapi
 * /api/shifts:
 *   get:
 *     summary: Obtiene todos los turnos o por mes/año
 *     tags: [Shifts]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de turnos
 */
shiftsRouter.get('/', async (req, res, next) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    let shiftsData;

    if (month && year) {
      shiftsData = await storage.getShiftsByMonth(
        parseInt(month as string),
        parseInt(year as string),
      );
    } else if (startDate || endDate) {
      shiftsData = await storage.getShifts(
        startDate as string,
        endDate as string,
      );
    } else {
      shiftsData = await storage.getShifts();
    }

    res.json(shiftsData);
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/shifts/date/{date}:
 *   get:
 *     summary: Obtiene los turnos por fecha
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de turnos para la fecha
 */
shiftsRouter.get('/date/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const shifts = await storage.getShiftsByDate(date);
    res.json(shifts);
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/shifts:
 *   post:
 *     summary: Crea un nuevo turno
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Turno creado
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Conflicto de turno
 */
shiftsRouter.post('/', validate(insertShiftSchema), async (req, res, next) => {
  try {
    const validatedData = req.body;

    // The unique constraint in the DB schema will now handle direct conflicts.
    // The explicit checkShiftConflicts is still useful for providing details
    // about *which* existing shift caused the conflict, if needed for frontend UX.
    // For now, we'll rely on the DB constraint for the 409.
    const shift = await storage.createShift(validatedData);
    res.status(201).json(shift);
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code, conflicts: error.details });
    }
    next(error); // Pass other errors to global error handler
  }
});

/**
 * @openapi
 * /api/shifts/{id}:
 *   delete:
 *     summary: Elimina un turno
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Turno eliminado
 *       404:
 *         description: Turno no encontrado
 */
shiftsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteShift(id);
    if (!deleted) {
      throw new NotFoundError('Shift not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/shifts/{id}:
 *   put:
 *     summary: Actualiza un turno existente
 *     tags: [Shifts]
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
 *         description: Turno actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Turno no encontrado
 *       409:
 *         description: Conflicto de turno
 */
shiftsRouter.put('/:id', validate(insertShiftSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const validatedData = req.body;

    // The unique constraint in the DB schema will now handle direct conflicts.
    // The explicit checkShiftConflicts is still useful for providing details
    // about *which* existing shift caused the conflict, if needed for frontend UX.
    // For now, we'll rely on the DB constraint for the 409.
    const updated = await storage.updateShift(id, validatedData);
    if (!updated) {
      throw new NotFoundError('Shift not found');
    }
    res.json(updated);
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code, conflicts: error.details });
    }
    next(error); // Pass other errors to global error handler
  }
});

const generateShiftsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100), // Adjust min/max years as needed
});

/**
 * @openapi
 * /api/shifts/generate-from-previous-month:
 *   post:
 *     summary: Genera turnos para el mes actual basándose en el mes anterior
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: integer
 *                 description: El mes para el que se generarán los turnos (1-12)
 *               year:
 *                 type: integer
 *                 description: El año para el que se generarán los turnos
 *     responses:
 *       200:
 *         description: Turnos generados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Número de turnos generados
 *       400:
 *         description: Datos de entrada inválidos
 *       500:
 *         description: Error interno del servidor
 */
shiftsRouter.post(
  '/generate-from-previous-month',
  validate(generateShiftsSchema),
  async (req, res, next) => {
    try {
      const { month, year } = req.body;
      const result = await storage.generateShiftsFromPreviousMonth(month, year);
      res.status(200).json(result);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  },
);

export default shiftsRouter;