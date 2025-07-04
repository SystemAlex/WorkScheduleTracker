import { Router } from 'express';
import { storage } from '../storage';
import { insertShiftSchema } from '@shared/schema';
import { z } from 'zod';

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
 *     responses:
 *       200:
 *         description: Lista de turnos
 */
shiftsRouter.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    let shifts;

    if (month && year) {
      shifts = await storage.getShiftsByMonth(
        parseInt(month as string),
        parseInt(year as string),
      );
    } else {
      shifts = await storage.getShifts();
    }

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shifts' });
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
shiftsRouter.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const shifts = await storage.getShiftsByDate(date);
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shifts for date' });
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
shiftsRouter.post('/', async (req, res) => {
  try {
    const validatedData = insertShiftSchema.parse(req.body);

    // Check for conflicts
    const conflicts = await storage.checkShiftConflicts(
      validatedData.employeeId,
      validatedData.date,
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Shift conflict detected',
        conflicts,
      });
    }

    const shift = await storage.createShift(validatedData);
    res.status(201).json(shift);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create shift' });
    }
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
 */
shiftsRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteShift(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete shift' });
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
 *       409:
 *         description: Conflicto de turno
 */
shiftsRouter.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const validatedData = insertShiftSchema.parse(req.body);

    // Obtén el turno actual
    const currentShift = await storage.getShiftById(id);

    if (!currentShift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    // Si se intenta cambiar empleado o fecha, verifica conflicto
    const changingEmployeeOrDate =
      validatedData.employeeId !== currentShift.employeeId ||
      validatedData.date !== currentShift.date;

    if (changingEmployeeOrDate) {
      const conflicts = await storage.checkShiftConflicts(
        validatedData.employeeId,
        validatedData.date,
        id, // excluye el turno actual
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          message: 'Shift conflict detected',
          conflicts,
        });
      }
    }

    const updated = await storage.updateShift(id, validatedData);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
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
shiftsRouter.post('/generate-from-previous-month', async (req, res) => {
  try {
    const { month, year } = generateShiftsSchema.parse(req.body);
    const result = await storage.generateShiftsFromPreviousMonth(month, year);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ message: 'Invalid input data', errors: error.errors });
    } else {
      console.error('Error generating shifts from previous month:', error);
      res.status(500).json({ message: 'Failed to generate shifts' });
    }
  }
});

export default shiftsRouter;
