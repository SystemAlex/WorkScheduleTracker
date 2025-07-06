import { Router } from 'express';
import { storage } from '../storage';
import {
  EmployeeHoursReport,
  getMonthName,
  ShiftBreakdownItem,
} from '@shared/utils'; // Import getMonthName from shared
import type { Position } from '@shared/schema'; // Import types for Position and Cliente

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
    console.error(error);
    res
      .status(500)
      .json({ message: 'Failed to generate employee hours report' });
  }
});

/**
 * @openapi
 * /api/reports/employee-hours/xlsx:
 *   get:
 *     summary: Exporta el reporte de horas trabajadas por empleado a XLSX
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo XLSX generado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Error al generar el reporte
 */
reportsRouter.get('/employee-hours/xlsx', async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;

    // Fetch report data
    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
    );

    // Get all positions and clients for header generation
    const allPositions = await storage.getPositions();
    const allClientes = await storage.getClientes();

    // Re-create groupedPositionsByClient logic from frontend for consistency
    const activePositionIds = new Set<number>();
    reportData.forEach((employeeReport: EmployeeHoursReport) => {
      // Explicitly type employeeReport as any
      employeeReport.shiftBreakdown.forEach((item: ShiftBreakdownItem) => {
        // Explicitly type item as any
        activePositionIds.add(item.positionId);
      });
    });
    const activePositions = allPositions.filter((pos) =>
      activePositionIds.has(pos.id),
    );

    const groupedPositionsByClient: Array<[number, Position[]]> =
      Object.entries(
        activePositions.reduce(
          (acc, pos) => {
            if (!acc[pos.clienteId]) acc[pos.clienteId] = [];
            acc[pos.clienteId].push(pos);
            return acc;
          },
          {} as Record<number, Position[]>,
        ),
      )
        .sort(([clientIdA], [clientIdB]) => {
          const clientA =
            allClientes.find((c) => c.id === Number(clientIdA))?.empresa || '';
          const clientB =
            allClientes.find((c) => c.id === Number(clientIdB))?.empresa || '';
          return clientA.localeCompare(clientB);
        })
        .map(([clientId, posArray]) => [
          Number(clientId),
          posArray.sort((a, b) => a.name.localeCompare(b.name)),
        ]);

    const totalReportHours = reportData.reduce(
      (sum: number, emp: EmployeeHoursReport) => sum + emp.totalHours,
      0,
    );
    const totalReportShifts = reportData.reduce(
      (sum: number, emp: EmployeeHoursReport) => sum + emp.totalShifts,
      0,
    );

    const buffer = await storage.generateExcelReport(
      reportData,
      groupedPositionsByClient,
      allClientes,
      parsedMonth,
      parsedYear,
      totalReportHours,
      totalReportShifts,
    );

    const monthName = getMonthName(parsedMonth - 1);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_Turnos_${monthName}_${parsedYear}.xlsx`,
    );
    res.send(buffer);
  } catch (error) {
    console.error('Error generating XLSX report:', error);
    res.status(500).json({ message: 'Failed to generate XLSX report' });
  }
});

/**
 * @openapi
 * /api/reports/employee-hours/pdf:
 *   get:
 *     summary: Exporta el reporte de horas trabajadas por empleado a PDF
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Error al generar el reporte
 */
reportsRouter.get('/employee-hours/pdf', async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;

    // Fetch report data
    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
    );

    // Get all positions and clients for header generation
    const allPositions = await storage.getPositions();
    const allClientes = await storage.getClientes();

    // Re-create groupedPositionsByClient logic from frontend for consistency
    const activePositionIds = new Set<number>();
    reportData.forEach((employeeReport: EmployeeHoursReport) => {
      // Explicitly type employeeReport as any
      employeeReport.shiftBreakdown.forEach((item: ShiftBreakdownItem) => {
        // Explicitly type item as any
        activePositionIds.add(item.positionId);
      });
    });
    const activePositions = allPositions.filter((pos) =>
      activePositionIds.has(pos.id),
    );

    const groupedPositionsByClient: Array<[number, Position[]]> =
      Object.entries(
        activePositions.reduce(
          (acc, pos) => {
            if (!acc[pos.clienteId]) acc[pos.clienteId] = [];
            acc[pos.clienteId].push(pos);
            return acc;
          },
          {} as Record<number, Position[]>,
        ),
      )
        .sort(([clientIdA], [clientIdB]) => {
          const clientA =
            allClientes.find((c) => c.id === Number(clientIdA))?.empresa || '';
          const clientB =
            allClientes.find((c) => c.id === Number(clientIdB))?.empresa || '';
          return clientA.localeCompare(clientB);
        })
        .map(([clientId, posArray]) => [
          Number(clientId),
          posArray.sort((a, b) => a.name.localeCompare(b.name)),
        ]);

    const totalReportHours = reportData.reduce(
      (sum: number, emp: EmployeeHoursReport) => sum + emp.totalHours,
      0,
    );
    const totalReportShifts = reportData.reduce(
      (sum: number, emp: EmployeeHoursReport) => sum + emp.totalShifts,
      0,
    );

    const buffer = await storage.generatePdfReport(
      reportData,
      groupedPositionsByClient,
      allClientes,
      parsedMonth,
      parsedYear,
      totalReportHours,
      totalReportShifts,
    );

    const monthName = getMonthName(parsedMonth - 1);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Reporte_Turnos_${monthName}_${parsedYear}.pdf`,
    );
    res.send(buffer);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
});

export default reportsRouter;
