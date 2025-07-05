import { Router } from 'express';
import { storage } from '../storage';
import { insertEmployeeSchema } from '@shared/schema';
import { z } from 'zod';

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
employeesRouter.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const employees = await storage.getEmployees(search as string);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Failed to fetch employees' });
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
employeesRouter.post('/', async (req, res) => {
  try {
    const validatedData = insertEmployeeSchema.parse(req.body);
    const employee = await storage.createEmployee(validatedData);
    res.status(201).json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to create employee' });
    }
  }
});

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
 *       500:
 *         description: Error interno
 */
employeesRouter.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertEmployeeSchema.parse(req.body);
    const employee = await storage.updateEmployee(id, validatedData);
    res.json(employee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid data', errors: error.errors });
    } else {
      res.status(500).json({ message: 'Failed to update employee' });
    }
  }
});

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
 *       500:
 *         description: Error interno
 */
employeesRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteEmployee(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete employee' });
  }
});

export default employeesRouter;
