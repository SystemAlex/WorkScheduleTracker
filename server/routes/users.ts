import { Router, Request } from 'express';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { ConflictError, NotFoundError, ForbiddenError } from '../errors';
import {
  isAuthenticated,
  authorizeCompany,
  authorizeRole,
  checkCompanyPaymentStatus,
} from '../middleware/auth';

const usersRouter = Router();

usersRouter.use(
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
  authorizeRole(['admin']), // Solo los administradores pueden gestionar usuarios
);

const createUserSchema = insertUserSchema.pick({ username: true, role: true });
const updateUserSchema = insertUserSchema.pick({ role: true });

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios de la empresa actual
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios de la empresa.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [admin, supervisor]
 *                   mainCompanyId:
 *                     type: integer
 *                     nullable: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   mustChangePassword:
 *                     type: boolean
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo administradores).
 */
usersRouter.get('/', async (req: Request, res, next) => {
  try {
    const companyUsers = await storage.getUsers(req.mainCompanyId!);
    res.json(companyUsers);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario para la empresa actual
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario para el nuevo usuario.
 *               role:
 *                 type: string
 *                 enum: [admin, supervisor]
 *                 description: Rol del nuevo usuario.
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente. La contraseña por defecto es "password123".
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 mainCompanyId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 mustChangePassword:
 *                   type: boolean
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo administradores o intento de crear super_admin).
 *       409:
 *         description: Conflicto (nombre de usuario ya existe).
 */
usersRouter.post(
  '/',
  validate(createUserSchema),
  async (req: Request, res, next) => {
    try {
      const newUser = await storage.createUser(req.body, req.mainCompanyId!);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ForbiddenError) {
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
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza el rol de un usuario existente en la empresa actual
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, supervisor]
 *                 description: Nuevo rol para el usuario.
 *     responses:
 *       200:
 *         description: Rol de usuario actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *                 mainCompanyId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 mustChangePassword:
 *                   type: boolean
 *       400:
 *         description: Datos inválidos.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo administradores o intento de asignar super_admin).
 *       404:
 *         description: Usuario no encontrado en esta empresa.
 */
usersRouter.put(
  '/:id',
  validate(updateUserSchema),
  async (req: Request, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(
        userId,
        req.body,
        req.mainCompanyId!,
      );
      if (!updatedUser) {
        throw new NotFoundError('Usuario no encontrado en esta empresa.');
      }
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
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
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario de la empresa actual
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar.
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo administradores o intento de eliminar la propia cuenta).
 *       404:
 *         description: Usuario no encontrado en esta empresa.
 */
usersRouter.delete('/:id', async (req: Request, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const deleted = await storage.deleteUser(
      userId,
      req.mainCompanyId!,
      req.session.userId!,
    );
    if (!deleted) {
      throw new NotFoundError('Usuario no encontrado en esta empresa.');
    }
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, code: error.code });
    }
    next(error);
  }
});

/**
 * @openapi
 * /api/users/{id}/reset-password:
 *   put:
 *     summary: Restablece la contraseña de un usuario a un valor predeterminado
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario cuya contraseña se desea restablecer.
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente a "password123".
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo administradores).
 *       404:
 *         description: Usuario no encontrado en esta empresa.
 */
usersRouter.put('/:id/reset-password', async (req: Request, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const success = await storage.resetUserPassword(userId, req.mainCompanyId!);
    if (!success) {
      throw new NotFoundError('Usuario no encontrado en esta empresa.');
    }
    res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(error.statusCode)
        .json({ message: error.message, code: error.code });
    }
    next(error);
  }
});

export default usersRouter;
