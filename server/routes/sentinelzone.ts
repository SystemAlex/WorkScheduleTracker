import { Router } from 'express';
import { storage } from '../storage';
import { insertMainCompanySchema, insertUserSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { authorizeRole, isAuthenticated } from '../middleware/auth';
import { z } from 'zod';
import { ConflictError, NotFoundError } from '../errors'; // Import NotFoundError
import {
  startOfDay,
  endOfDay,
  addWeeks,
  addMonths,
  addYears,
  eachDayOfInterval,
  formatISO,
} from 'date-fns';

const adminRouter = Router();

// Esquema de validación para la creación de una nueva empresa y su usuario admin
const createCompanyAndAdminSchema = z.object({
  company: insertMainCompanySchema,
  adminUser: insertUserSchema.omit({
    role: true,
    mainCompanyId: true,
    passwordHash: true,
  }), // Role, mainCompanyId, and passwordHash are set by backend
});

// Schema for updating a main company (allow partial updates)
const updateMainCompanySchema = insertMainCompanySchema.partial().extend({
  isActive: z.boolean().optional(),
  lastPaymentDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Formato de fecha inválido. Se esperaba YYYY-MM-DD',
    )
    .nullable()
    .optional(),
});

/**
 * @openapi
 * /api/sentinelzone/main-companies:
 *   get:
 *     summary: Obtiene todas las empresas principales y sus administradores
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas principales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   paymentControl:
 *                     type: string
 *                     enum: [monthly, annual, permanent]
 *                   lastPaymentDate:
 *                     type: string
 *                     format: date
 *                     nullable: true
 *                   isActive:
 *                     type: boolean
 *                   needsSetup:
 *                     type: boolean
 *                   country:
 *                     type: string
 *                     nullable: true
 *                   province:
 *                     type: string
 *                     nullable: true
 *                   city:
 *                     type: string
 *                     nullable: true
 *                   address:
 *                     type: string
 *                     nullable: true
 *                   taxId:
 *                     type: string
 *                     nullable: true
 *                   contactName:
 *                     type: string
 *                     nullable: true
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                   email:
 *                     type: string
 *                     nullable: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   deletedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   users:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo SuperAdmin)
 */
adminRouter.get(
  '/main-companies',
  isAuthenticated,
  authorizeRole(['super_admin']),
  async (req, res, next) => {
    try {
      const companies = await storage.getMainCompaniesWithAdmins();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/sentinelzone/active-sessions:
 *   get:
 *     summary: Obtiene todas las sesiones de usuario activas
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     description: Nombre de usuario de la sesión.
 *                   role:
 *                     type: string
 *                     description: Rol del usuario.
 *                   expire:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha y hora de expiración de la sesión.
 *                   companyName:
 *                     type: string
 *                     nullable: true
 *                     description: Nombre de la empresa asociada a la sesión (si aplica).
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo SuperAdmin)
 */
adminRouter.get(
  '/active-sessions',
  isAuthenticated,
  authorizeRole(['super_admin']),
  async (req, res, next) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/sentinelzone/main-companies:
 *   post:
 *     summary: Crea una nueva empresa principal y su usuario administrador inicial
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 $ref: '#/components/schemas/InsertMainCompany'
 *               adminUser:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: newadmin
 *     responses:
 *       201:
 *         description: Empresa y usuario administrador creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresa y usuario administrador creados exitosamente.
 *                 company:
 *                   $ref: '#/components/schemas/MainCompany'
 *                 adminUser:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado (solo SuperAdmin)
 *       409:
 *         description: Conflicto (nombre de empresa o username de usuario ya existen)
 */
adminRouter.post(
  '/main-companies',
  isAuthenticated,
  authorizeRole(['super_admin']), // Solo SuperAdmin puede crear nuevas empresas
  validate(createCompanyAndAdminSchema),
  async (req, res, next) => {
    try {
      const { company: companyData, adminUser: userData } = req.body;
      const { company, adminUser } =
        await storage.createMainCompanyAndAdminUser(companyData, userData);
      res.status(201).json({
        message: 'Empresa y usuario administrador creados exitosamente.',
        company,
        adminUser: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          mainCompanyId: adminUser.mainCompanyId,
        },
      });
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
 * /api/sentinelzone/main-companies/{id}:
 *   put:
 *     summary: Actualiza una empresa principal
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa principal a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InsertMainCompany'
 *             properties:
 *               isActive:
 *                 type: boolean
 *               lastPaymentDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Empresa principal actualizada exitosamente.
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo SuperAdmin).
 *       404:
 *         description: Empresa principal no encontrada.
 *       409:
 *         description: Conflicto (nombre de empresa ya existe).
 */
adminRouter.put(
  '/main-companies/:id',
  isAuthenticated,
  authorizeRole(['super_admin']),
  validate(updateMainCompanySchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const updatedCompany = await storage.updateMainCompany(id, req.body);
      if (!updatedCompany) {
        throw new NotFoundError('Main company not found.');
      }
      res.status(200).json(updatedCompany);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
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
 * /api/sentinelzone/main-companies/{id}/reset-admin-password:
 *   put:
 *     summary: Restablece la contraseña del usuario administrador de una empresa principal a un valor predeterminado.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa principal cuyo administrador se desea restablecer la contraseña.
 *     responses:
 *       200:
 *         description: Contraseña del administrador restablecida exitosamente.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo SuperAdmin).
 *       404:
 *         description: Empresa principal o administrador no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
adminRouter.put(
  '/main-companies/:id/reset-admin-password',
  isAuthenticated,
  authorizeRole(['super_admin']),
  async (req, res, next) => {
    try {
      const companyId = parseInt(req.params.id);
      const success = await storage.resetAdminPassword(companyId);
      if (!success) {
        throw new NotFoundError('Main company or admin user not found.');
      }
      res.status(200).json({ message: 'Admin password reset successfully.' });
    } catch (error) {
      if (error instanceof NotFoundError) {
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
 * /api/sentinelzone/main-companies/{id}:
 *   delete:
 *     summary: Elimina (soft delete) una empresa principal
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa principal a eliminar.
 *     responses:
 *       204:
 *         description: Empresa principal eliminada exitosamente.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo SuperAdmin).
 *       404:
 *         description: Empresa principal no encontrada.
 */
adminRouter.delete(
  '/main-companies/:id',
  isAuthenticated,
  authorizeRole(['super_admin']),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMainCompany(id);
      if (!deleted) {
        throw new NotFoundError('Main company not found.');
      }
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res
          .status(error.statusCode)
          .json({ message: error.message, code: error.code });
      }
      next(error);
    }
  },
);

const getLoginHistorySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'custom']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * @openapi
 * /api/sentinelzone/login-history:
 *   get:
 *     summary: Obtiene el historial de inicios de sesión
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, custom]
 *           default: week
 *         description: Período de tiempo para el historial (día, semana, mes, año o personalizado).
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de inicio para el período 'custom' (requerido con endDate si period es 'custom').
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha de fin para el período 'custom' (requerido con startDate si period es 'custom').
 *     responses:
 *       200:
 *         description: Historial de inicios de sesión.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Fecha o marca de tiempo del período.
 *                   logins:
 *                     type: integer
 *                     description: Número de inicios de sesión en ese período.
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo SuperAdmin).
 */
adminRouter.get(
  '/login-history',
  isAuthenticated,
  authorizeRole(['super_admin']),
  async (req, res, next) => {
    try {
      const query = getLoginHistorySchema.parse(req.query);

      let startDate: Date;
      let endDate: Date;
      let granularity: 'day';

      const now = new Date(query.startDate || '');

      startDate = startOfDay(now);
      endDate = endOfDay(now);
      granularity = 'day';

      if (query.period === 'custom' && query.startDate && query.endDate) {
        startDate = startOfDay(new Date(query.startDate));
        endDate = endOfDay(new Date(query.endDate));
      } else {
        switch (query.period) {
          case 'week':
            startDate = addWeeks(startDate, -1);
            break;
          case 'month':
            startDate = addMonths(startDate, -1);
            break;
          case 'year':
            startDate = addYears(startDate, -1);
            break;
        }
      }
      function normalizeLoginHistory(
        history: { date: string; logins: number }[],
        start: Date,
        end: Date,
      ) {
        const fullDates = eachDayOfInterval({ start, end }).map((d) =>
          formatISO(d, { representation: 'date' }),
        );

        const dataMap = new Map(
          history.map((h) => [h.date.slice(0, 10), h.logins]),
        );

        return fullDates.map((date) => ({
          date,
          logins: dataMap.get(date) ?? 0,
        }));
      }

      const history = await storage.getLoginHistory(
        startDate,
        endDate,
        granularity,
      );
      const normalized = normalizeLoginHistory(history, startDate, endDate);
      res.json(normalized);
    } catch (error) {
      next(error);
    }
  },
);

export default adminRouter;
