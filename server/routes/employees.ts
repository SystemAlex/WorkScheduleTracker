import { Router } from 'express';
import { storage } from '../storage';
import { insertEmployeeSchema } from '@shared/schema';
import { validate } from '../middleware/validate';
import { NotFoundError } from '../errors'; // Import NotFoundError

const employeesRouter = Router();

/**
 * @openapi
 * /api/employees:
 *   get:
 *     summary: Obtiene todos los empleados
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar empleados por nombre.
 *     responses:
 *       200:
 *         description: Lista de empleados
 */
employeesRouter.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const employees = await storage.getEmployees(search as string);
    res.json(employees);
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

/**
 * @openapi
 * /api/employees:
 *   post:
 *     summary: Crea un nuevo empleado
 *     tags: [Employees]
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
 */
employeesRouter.post(
  '/',
  validate(insertEmployeeSchema),
  async (req, res, next) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  },
);

/**
 * @openapi
 * /api/employees/{id}:
 *   put:
 *     summary: Actualiza un empleado existente
 *     tags: [Employees]
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
 *       404:
 *         description: Empleado no encontrado
 *       500:
 *         description: Error interno
 */
employeesRouter.put(
  '/:id',
  validate(insertEmployeeSchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.updateEmployee(id, req.body);
      if (!employee) {
        throw new NotFoundError('Employee not found');
      }
      res.json(employee);
    } catch (error) {
      next(error); // Pass error to global error handler
    }
  },
);

/**
 * @openapi
 * /api/employees/{id}:
 *   delete:
 *     summary: Elimina un empleado
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Empleado eliminado
 *       404:
 *         description: Empleado no encontrado
 *       500:
 *         description: Error interno
 */
employeesRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteEmployee(id);
    if (!deleted) {
      throw new NotFoundError('Employee not found');
    }
    res.status(204).send();
  } catch (error) {
    next(error); // Pass error to global error handler
  }
});

export default employeesRouter;
