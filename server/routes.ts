import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import {
  insertEmployeeSchema,
  insertPositionSchema,
  insertShiftTypeSchema,
  insertShiftSchema,
} from '@shared/schema';
import { z } from 'zod';

export async function registerRoutes(app: Express): Promise<Server> {
  // Employees routes

  /**
   * @openapi
   * /api/employees:
   *   get:
   *     summary: Obtiene todos los empleados
   *     tags: [Employees]
   *     responses:
   *       200:
   *         description: Lista de empleados
   */
  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
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
  app.post('/api/employees', async (req, res) => {
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
  app.put('/api/employees/:id', async (req, res) => {
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
  app.delete('/api/employees/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete employee' });
    }
  });

  // Positions routes

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
  app.get('/api/positions', async (req, res) => {
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
  app.post('/api/positions', async (req, res) => {
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

  // Shift Types routes

  /**
   * @openapi
   * /api/shift-types:
   *   get:
   *     summary: Obtiene todos los tipos de turno
   *     tags: [ShiftTypes]
   *     responses:
   *       200:
   *         description: Lista de tipos de turno
   */
  app.get('/api/shift-types', async (req, res) => {
    try {
      const shiftTypes = await storage.getShiftTypes();
      res.json(shiftTypes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift types' });
    }
  });

  /**
   * @openapi
   * /api/shift-types:
   *   post:
   *     summary: Crea un nuevo tipo de turno
   *     tags: [ShiftTypes]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Tipo de turno creado
   *       400:
   *         description: Datos inválidos
   */
  app.post('/api/shift-types', async (req, res) => {
    try {
      const validatedData = insertShiftTypeSchema.parse(req.body);
      const shiftType = await storage.createShiftType(validatedData);
      res.status(201).json(shiftType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create shift type' });
      }
    }
  });

  // Shifts routes

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
  app.get('/api/shifts', async (req, res) => {
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
  app.get('/api/shifts/date/:date', async (req, res) => {
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
  app.post('/api/shifts', async (req, res) => {
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
  app.delete('/api/shifts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteShift(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete shift' });
    }
  });

  // Reports routes

  /**
   * @openapi
   * /api/reports/employee-hours:
   *   get:
   *     summary: Obtiene el reporte de horas trabajadas por empleado
   *     tags: [Reports]
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
   *         name: employeeId
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Reporte generado
   */
  app.get('/api/reports/employee-hours', async (req, res) => {
    try {
      const { month, year, employeeId } = req.query;
      const report = await storage.getEmployeeHoursReport(
        employeeId ? parseInt(employeeId as string) : undefined,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );
      res.json(report);
    } catch (error) {
      res
        .status(500)
        .json({ message: 'Failed to generate employee hours report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
