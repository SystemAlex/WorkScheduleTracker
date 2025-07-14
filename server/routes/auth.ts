import { Router, Request } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { db } from '../db';
import { users, mainCompanies } from '@shared/schema'; // Importar mainCompanies
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { UnauthorizedError, ForbiddenError } from '../errors'; // Importar ForbiddenError
import {
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
} from '../middleware/auth';
import {
  addMonths,
  addYears,
  isBefore, // Importar isBefore
  isSameDay, // Importar isSameDay
  startOfDay,
  parse, // Importar parse
} from 'date-fns'; // Importar utilidades de fecha
import { storage } from '../storage'; // Importar storage

const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().optional(), // Add rememberMe field
});

const setPasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'La contraseña actual es requerida.'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               rememberMe:
 *                 type: boolean
 *                 description: Mantener la sesión activa por más tiempo.
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Empresa inactiva o bloqueada por falta de pago
 */
authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password, rememberMe } = req.body; // Destructure rememberMe

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new UnauthorizedError('Error de Usuario y Contraseña')); // Changed message here
    }

    // --- REVISED PAYMENT CHECK LOGIC ---
    if (user.role !== 'super_admin' && user.mainCompanyId) {
      const [company] = await db
        .select()
        .from(mainCompanies)
        .where(eq(mainCompanies.id, user.mainCompanyId));

      if (!company) {
        return next(new ForbiddenError('Associated company not found.'));
      }

      // Block if manually set to inactive
      if (!company.isActive) {
        return next(
          new ForbiddenError(
            'Tu empresa está inactiva. Por favor, contacta a soporte.',
          ),
        );
      }

      // Now, check payment status based on dates
      let isCompanyActiveBasedOnPayment: boolean;
      const now = startOfDay(new Date());

      if (!company.lastPaymentDate) {
        // No payment ever registered = inactive
        isCompanyActiveBasedOnPayment = false;
      } else {
        const lastPayment = parse(
          company.lastPaymentDate,
          'yyyy-MM-dd',
          new Date(),
        );
        switch (company.paymentControl) {
          case 'permanent':
            isCompanyActiveBasedOnPayment = true;
            break;
          case 'monthly': {
            const monthlyDueDate = startOfDay(addMonths(lastPayment, 1));
            isCompanyActiveBasedOnPayment =
              isBefore(now, monthlyDueDate) || isSameDay(now, monthlyDueDate);
            break;
          }
          case 'annual': {
            const annualDueDate = startOfDay(addYears(lastPayment, 1));
            isCompanyActiveBasedOnPayment =
              isBefore(now, annualDueDate) || isSameDay(now, annualDueDate);
            break;
          }
          default:
            isCompanyActiveBasedOnPayment = false;
            break;
        }
      }

      if (!isCompanyActiveBasedOnPayment) {
        return next(
          new ForbiddenError(
            'Tu empresa está bloqueada por falta de pago. Contacta a soporte.',
          ),
        );
      }
    }
    // --- END REVISED PAYMENT CHECK LOGIC ---

    // Record the successful login
    await storage.recordLogin(user.id, user.mainCompanyId, req.ip || '');

    // Set session maxAge dynamically based on rememberMe
    if (rememberMe) {
      req.session.cookie.maxAge = 36 * 60 * 60 * 1000; // 36 hours
    } else {
      req.session.cookie.maxAge = 30 * 60 * 1000; // 30 minutes
    }

    // Create a full session regardless of password status
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.mainCompanyId = user.mainCompanyId;
    req.session.isPendingPasswordChange = user.mustChangePassword;

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mainCompanyId: user.mainCompanyId,
        mustChangePassword: user.mustChangePassword, // Return the flag
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cierra la sesión del usuario actual
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: No autenticado
 */
authRouter.post('/logout', isAuthenticated, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtiene la información del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario autenticado
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
 *                   enum: [super_admin, admin, supervisor]
 *                 mainCompanyId:
 *                   type: integer
 *                   nullable: true
 *                 mustChangePassword:
 *                   type: boolean
 *                 companyStatus:
 *                   type: object
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                     paymentControl:
 *                       type: string
 *                       enum: [monthly, annual, permanent]
 *                     lastPaymentDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     nextPaymentDueDate:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     isPaymentDueSoon:
 *                       type: boolean
 *                     needsSetup:
 *                       type: boolean
 *       401:
 *         description: No autenticado
 */
authRouter.get(
  '/me',
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
  async (req: Request, res, next) => {
    try {
      const userId = req.session.userId!;
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          mainCompanyId: users.mainCompanyId,
          mustChangePassword: users.mustChangePassword, // Return the flag
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        req.session.destroy(() => {
          res.clearCookie('connect.sid');
          next(new UnauthorizedError('User not found in database.'));
        });
        return;
      }

      res.json({ ...user, companyStatus: req.mainCompanyPaymentStatus });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/auth/set-password:
 *   post:
 *     summary: Establece o cambia la contraseña del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual del usuario.
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña. Debe tener al menos 8 caracteres.
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmación de la nueva contraseña.
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente.
 *       400:
 *         description: Datos inválidos (ej. contraseñas no coinciden, nueva contraseña muy corta).
 *       401:
 *         description: No autenticado o contraseña actual incorrecta.
 */
authRouter.post('/set-password', isAuthenticated, async (req, res, next) => {
  try {
    const validationResult = await setPasswordSchema.safeParseAsync(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid data',
        errors: validationResult.error.errors,
      });
    }

    const { oldPassword, newPassword } = validationResult.data;
    const userId = req.session.userId!;

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return next(new UnauthorizedError('User not found.'));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return next(new UnauthorizedError('La contraseña actual es incorrecta.'));
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Promote the session to a full session
    req.session.isPendingPasswordChange = false;
    req.session.role = user.role;
    req.session.mainCompanyId = user.mainCompanyId;

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/complete-setup:
 *   put:
 *     summary: Marca la configuración inicial de la empresa como completada
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Configuración completada exitosamente.
 *       401:
 *         description: No autenticado.
 *       403:
 *         description: Acceso denegado (solo para usuarios con empresa asociada).
 */
authRouter.put(
  '/complete-setup',
  isAuthenticated,
  authorizeCompany,
  async (req: Request, res, next) => {
    try {
      const mainCompanyId = req.mainCompanyId;
      if (!mainCompanyId) {
        return next(
          new ForbiddenError('No company associated with this user.'),
        );
      }

      await db
        .update(mainCompanies)
        .set({ needsSetup: false, updatedAt: new Date() })
        .where(eq(mainCompanies.id, mainCompanyId));

      res.status(200).json({ message: 'Setup completed successfully.' });
    } catch (error) {
      next(error);
    }
  },
);

export default authRouter;
