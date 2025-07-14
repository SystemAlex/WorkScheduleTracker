import { Router, Request } from 'express';
import { storage } from '../storage';
import { insertShiftSchema } from '@shared/schema';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { ConflictError, NotFoundError } from '../errors';
import {
  isAuthenticated,
  authorizeCompany,
  authorizeRole,
  checkCompanyPaymentStatus,
} from '../middleware/auth'; // Importar middlewares

const shiftsRouter = Router();

// Aplicar isAuthenticated y authorizeCompany a todas las rutas de turnos
shiftsRouter.use(isAuthenticated, authorizeCompany, checkCompanyPaymentStatus);

/**
 * @openapi
 * /api/shifts:
 *   get:
 *     summary: Obtiene todos los turnos o por mes/año
 *     tags: [Shifts]
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
shiftsRouter.get('/', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { month, year, startDate, endDate } = req.query;
    let shiftsData;

    if (month && year) {
      shiftsData = await storage.getShiftsByMonth(
        parseInt(month as string),
        parseInt(year as string),
        req.mainCompanyId ?? undefined, // Pasar mainCompanyId
      );
    } else if (startDate || endDate) {
      shiftsData = await storage.getShifts(
        startDate as string,
        endDate as string,
        req.mainCompanyId ?? undefined, // Pasar mainCompanyId
      );
    } else {
      shiftsData = await storage.getShifts(
        undefined,
        undefined,
        req.mainCompanyId ?? undefined,
      ); // Pasar mainCompanyId
    }

    res.json(shiftsData);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/shifts/date/{date}:
 *   get:
 *     summary: Obtiene los turnos por fecha
 *     tags: [Shifts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de turnos para la fecha
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
shiftsRouter.get('/date/:date', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { date } = req.params;
    const shifts = await storage.getShiftsByDate(
      date,
      req.mainCompanyId ?? undefined,
    ); // Pasar mainCompanyId
    res.json(shifts);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/shifts:
 *   post:
 *     summary: Crea un nuevo turno
 *     tags: [Shifts]
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
 *         description: Turno creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       409:
 *         description: Conflicto de turno
 */
shiftsRouter.post(
  '/',
  authorizeRole(['admin', 'supervisor']), // Administradores y supervisores pueden crear turnos
  validate(insertShiftSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const validatedData = req.body;
      const shift = await storage.createShift(
        validatedData,
        req.mainCompanyId!,
      ); // Pasar mainCompanyId
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code,
          conflicts: error.details,
        });
      }
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/shifts/{id}:
 *   delete:
 *     summary: Elimina un turno
 *     tags: [Shifts]
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
 *         description: Turno eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Turno no encontrado
 */
shiftsRouter.delete(
  '/:id',
  authorizeRole(['admin']),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShift(
        id,
        req.mainCompanyId ?? undefined,
      ); // Pasar mainCompanyId
      if (!deleted) {
        throw new NotFoundError('Shift not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/shifts/{id}:
 *   put:
 *     summary: Actualiza un turno existente
 *     tags: [Shifts]
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
 *         description: Turno actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Turno no encontrado
 *       409:
 *         description: Conflicto de turno
 */
shiftsRouter.put(
  '/:id',
  authorizeRole(['admin', 'supervisor']), // Administradores y supervisores pueden actualizar turnos
  validate(insertShiftSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = Number(req.params.id);
      const validatedData = req.body;

      const updated = await storage.updateShift(
        id,
        validatedData,
        req.mainCompanyId ?? undefined,
      ); // Pasar mainCompanyId
      if (!updated) {
        throw new NotFoundError('Shift not found');
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof ConflictError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code,
          conflicts: error.details,
        });
      }
      next(error);
    }
  },
);

const generateShiftsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

/**
 * @openapi
 * /api/shifts/generate-from-previous-month:
 *   post:
 *     summary: Genera turnos para el mes actual basándose en el mes anterior
 *     tags: [Shifts]
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error interno del servidor
 */
shiftsRouter.post(
  '/generate-from-previous-month',
  authorizeRole(['admin']), // Solo administradores pueden generar turnos
  validate(generateShiftsSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const { month, year } = req.body;
      const result = await storage.generateShiftsFromPreviousMonth(
        month,
        year,
        req.mainCompanyId!,
      ); // Pasar mainCompanyId
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default shiftsRouter;
