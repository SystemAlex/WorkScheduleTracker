import { db } from '../db';
import {
  employees,
  positions,
  shifts,
  Cliente,
  Position,
  clientes, // Importar clientes para la relación
} from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { ExcelGenerator } from '../utils/excel-generator';
import { PdfGenerator } from '../utils/pdf-generator';
import { EmployeeHoursReport, ShiftBreakdownItem } from '@shared/utils';

export class ReportStorage {
  private excelGenerator: ExcelGenerator;
  private pdfGenerator: PdfGenerator;

  constructor() {
    this.excelGenerator = new ExcelGenerator();
    this.pdfGenerator = new PdfGenerator();
  }

  async getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
    clientId?: number,
    mainCompanyId?: number, // Nuevo parámetro
  ): Promise<EmployeeHoursReport[]> {
    const whereConditions = [];

    if (employeeId) {
      whereConditions.push(eq(shifts.employeeId, employeeId));
    }

    if (month && year) {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      whereConditions.push(
        and(gte(shifts.date, startDate), lte(shifts.date, endDate)),
      );
    }

    if (clientId) {
      whereConditions.push(eq(positions.clienteId, clientId));
    }

    if (mainCompanyId) {
      // Asegurarse de que los empleados y las posiciones pertenezcan a la mainCompanyId
      whereConditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }

    const shiftData = await db
      .select({
        employee: employees,
        position: positions,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(positions, eq(shifts.positionId, positions.id))
      .leftJoin(clientes, eq(positions.clienteId, clientes.id)) // Unir con clientes para el filtro de mainCompanyId en posiciones
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const report = shiftData.reduce(
      (acc, row) => {
        // Solo procesar si employee y position existen (y por ende, cumplen con los filtros de mainCompanyId)
        if (!row.employee || !row.position) return acc;

        const employeeId = row.employee.id;
        const employeeName = row.employee.name;
        const position = row.position;
        const horas = parseFloat(position.totalHoras.toString());

        if (!acc[employeeId]) {
          acc[employeeId] = {
            employeeId,
            employeeName,
            totalHours: 0,
            totalShifts: 0,
            shiftBreakdown: [],
          };
        }

        acc[employeeId].totalShifts++;
        acc[employeeId].totalHours += horas;

        const existing = acc[employeeId].shiftBreakdown.find(
          (p: ShiftBreakdownItem) => p.positionId === position.id,
        );

        if (existing) {
          existing.totalHoras += horas;
        } else {
          acc[employeeId].shiftBreakdown.push({
            positionId: position.id,
            name: position.name,
            siglas: position.siglas,
            color: position.color,
            totalHoras: horas,
          });
        }

        return acc;
      },
      {} as Record<number, EmployeeHoursReport>,
    );

    return Object.values(report).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }

  // Delegate to ExcelGenerator
  async generateExcelReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer> {
    return this.excelGenerator.generateExcelReport(
      report,
      groupedPositionsByClient,
      clientes,
      selectedMonth,
      selectedYear,
      totalReportHours,
      totalReportShifts,
    );
  }

  // Delegate to PdfGenerator
  async generatePdfReport(
    report: EmployeeHoursReport[],
    groupedPositionsByClient: Array<[number, Position[]]>,
    clientes: Cliente[],
    selectedMonth: number,
    selectedYear: number,
    totalReportHours: number,
    totalReportShifts: number,
  ): Promise<Buffer> {
    return this.pdfGenerator.generatePdfReport(
      report,
      groupedPositionsByClient,
      clientes,
      selectedMonth,
      selectedYear,
      totalReportHours,
      totalReportShifts,
    );
  }
}
