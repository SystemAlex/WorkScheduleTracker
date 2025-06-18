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
  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees' });
    }
  });

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
  app.get('/api/positions', async (req, res) => {
    try {
      const positions = await storage.getPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch positions' });
    }
  });

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
  app.get('/api/shift-types', async (req, res) => {
    try {
      const shiftTypes = await storage.getShiftTypes();
      res.json(shiftTypes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shift types' });
    }
  });

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

  app.get('/api/shifts/date/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const shifts = await storage.getShiftsByDate(date);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shifts for date' });
    }
  });

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
