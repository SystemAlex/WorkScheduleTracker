import { Router, Request } from 'express';
import { storage } from '../storage';
import { insertEmployeeSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../errors';
import {
  isAuthenticated,
  authorizeCompany,
  authorizeRole,
  checkCompanyPaymentStatus,
} from '../middleware/auth'; // Importar middlewares

const employeesRouter = Router();

// Aplicar isAuthenticated y authorizeCompany a todas las rutas de empleados
employeesRouter.use(
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
);

/**
 * @openapi
 * /api/employees:
 *   get:
 *     summary: Obtiene todos los empleados
 *     tags: [Employees]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar empleados por nombre.
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
employeesRouter.get('/', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { search } = req.query;
    // Pasar mainCompanyId a la función de almacenamiento
    const employees = await storage.getEmployees(
      search as string,
      req.mainCompanyId ?? undefined,
    );
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/employees:
 *   post:
 *     summary: Crea un nuevo empleado
 *     tags: [Employees]
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
 *         description: Empleado creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
employeesRouter.post(
  '/',
  authorizeRole(['admin']), // Solo administradores pueden crear empleados
  validate(insertEmployeeSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      // Pasar mainCompanyId a la función de almacenamiento
      const employee = await storage.createEmployee(
        req.body,
        req.mainCompanyId!,
      );
      res.status(201).json(employee);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/employees/{id}:
 *   put:
 *     summary: Actualiza un empleado existente
 *     tags: [Employees]
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
 *         description: Empleado actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Empleado no encontrado
 *       500:
 *         description: Error interno
 */
employeesRouter.put(
  '/:id',
  authorizeRole(['admin']), // Solo administradores pueden actualizar empleados
  validate(insertEmployeeSchema),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const employee = await storage.updateEmployee(
        id,
        req.body,
        req.mainCompanyId ?? undefined,
      );
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      res.json(employee);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/employees/{id}:
 *   delete:
 *     summary: Elimina un empleado
 *     tags: [Employees]
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
 *         description: Empleado eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Empleado no encontrado
 *       500:
 *         description: Error interno
 */
employeesRouter.delete(
  '/:id',
  authorizeRole(['admin']),
  async (req: Request, res, next) => {
    // Use Request here
    try {
      const id = parseInt(req.params.id);
      // Pasar mainCompanyId a la función de almacenamiento
      const deleted = await storage.deleteEmployee(
        id,
        req.mainCompanyId ?? undefined,
      );
      if (!deleted) {
        throw new NotFoundError('Employee not found');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default employeesRouter;
