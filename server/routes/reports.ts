import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const reportsRouter = Router();

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
reportsRouter.get('/employee-hours', async (req, res) => {
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

export default reportsRouter;
