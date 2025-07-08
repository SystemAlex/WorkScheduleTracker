import { Router } from 'express';
import { storage } from '../storage';
import {
  EmployeeHoursReport,
  getMonthName,
  getProcessedReportPositions,
} from '@shared/utils';

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
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reporte generado
 */
reportsRouter.get('/employee-hours', async (req, res) => {
  try {
    const { month, year, employeeId, clientId } = req.query; // Obtener clientId
    const report = await storage.getEmployeeHoursReport(
      employeeId ? parseInt(employeeId as string) : undefined,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      clientId ? parseInt(clientId as string) : undefined, // Pasar clientId
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
 *       - in: query
 *         name: clientId
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
    const { month, year, employeeId, clientId } = req.query; // Obtener clientId

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;
    const parsedClientId = clientId // Parsear clientId
      ? parseInt(clientId as string)
      : undefined;

    // Fetch report data
    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
      parsedClientId, // Pasar clientId
    );

    // Get all positions and clients for header generation
    const allPositions = await storage.getPositions();
    const allClientes = await storage.getClientes();

    // Use the new shared function
    const { groupedPositionsByClient } = getProcessedReportPositions(
      reportData,
      allPositions,
      allClientes,
    );

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
 *       - in: query
 *         name: clientId
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
    const { month, year, employeeId, clientId } = req.query; // Obtener clientId

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;
    const parsedClientId = clientId // Parsear clientId
      ? parseInt(clientId as string)
      : undefined;

    // Fetch report data
    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
      parsedClientId, // Pasar clientId
    );

    // Get all positions and clients for header generation
    const allPositions = await storage.getPositions();
    const allClientes = await storage.getClientes();

    // Use the new shared function
    const { groupedPositionsByClient } = getProcessedReportPositions(
      reportData,
      allPositions,
      allClientes,
    );

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