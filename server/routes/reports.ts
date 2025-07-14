import { Router, Request } from 'express';
import { storage } from '../storage';
import {
  EmployeeHoursReport,
  getMonthName,
  getProcessedReportPositions,
} from '@shared/utils';
import {
  isAuthenticated,
  authorizeCompany,
  checkCompanyPaymentStatus,
} from '../middleware/auth'; // Importar middlewares

const reportsRouter = Router();

// Aplicar isAuthenticated y authorizeCompany a todas las rutas de reportes
reportsRouter.use(isAuthenticated, authorizeCompany, checkCompanyPaymentStatus);

/**
 * @openapi
 * /api/reports/employee-hours:
 *   get:
 *     summary: Obtiene el reporte de horas trabajadas por empleado
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 */
reportsRouter.get('/employee-hours', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { month, year, employeeId, clientId } = req.query;
    const report = await storage.getEmployeeHoursReport(
      employeeId ? parseInt(employeeId as string) : undefined,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined,
      clientId ? parseInt(clientId as string) : undefined,
      req.mainCompanyId ?? undefined, // Pasar mainCompanyId
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/reports/employee-hours/xlsx:
 *   get:
 *     summary: Exporta el reporte de horas trabajadas por empleado a XLSX
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error al generar el reporte
 */
reportsRouter.get('/employee-hours/xlsx', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { month, year, employeeId, clientId } = req.query;

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;
    const parsedClientId = clientId ? parseInt(clientId as string) : undefined;

    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
      parsedClientId,
      req.mainCompanyId ?? undefined, // Pasar mainCompanyId
    );

    // Obtener todas las posiciones y clientes para la generación de encabezados
    const allPositions = await storage.getPositions(
      undefined,
      req.mainCompanyId ?? undefined,
    ); // Pasar mainCompanyId
    const allClientes = await storage.getClientes(
      undefined,
      req.mainCompanyId ?? undefined,
    ); // Pasar mainCompanyId

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
    next(error);
  }
});

/**
 * @openapi
 * /api/reports/employee-hours/pdf:
 *   get:
 *     summary: Exporta el reporte de horas trabajadas por empleado a PDF
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error al generar el reporte
 */
reportsRouter.get('/employee-hours/pdf', async (req: Request, res, next) => {
  // Use Request here
  try {
    const { month, year, employeeId, clientId } = req.query;

    const parsedMonth = parseInt(month as string);
    const parsedYear = parseInt(year as string);
    const parsedEmployeeId = employeeId
      ? parseInt(employeeId as string)
      : undefined;
    const parsedClientId = clientId ? parseInt(clientId as string) : undefined;

    const reportData = await storage.getEmployeeHoursReport(
      parsedEmployeeId,
      parsedMonth,
      parsedYear,
      parsedClientId,
      req.mainCompanyId ?? undefined, // Pasar mainCompanyId
    );

    // Obtener todas las posiciones y clientes para la generación de encabezados
    const allPositions = await storage.getPositions(
      undefined,
      req.mainCompanyId ?? undefined,
    ); // Pasar mainCompanyId
    const allClientes = await storage.getClientes(
      undefined,
      req.mainCompanyId ?? undefined,
    ); // Pasar mainCompanyId

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
    next(error);
  }
});

export default reportsRouter;
