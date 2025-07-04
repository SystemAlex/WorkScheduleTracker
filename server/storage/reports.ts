import { db } from '../db';
import { employees, positions, shifts } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export class ReportStorage {
  async getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
  ): Promise<any[]> {
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

    const shiftData = await db
      .select({
        employee: employees,
        position: positions,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(positions, eq(shifts.positionId, positions.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Group by employee and calculate stats
    const report = shiftData.reduce((acc, row) => {
      const employeeId = row.employee!.id;
      const employeeName = row.employee!.name;
      const position = row.position!;
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

      // Buscar si ya existe este positionId en el breakdown
      const existing = acc[employeeId].shiftBreakdown.find(
        (p: any) => p.positionId === position.id,
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
    }, {} as any);

    return Object.values(report).sort((a: any, b: any) =>
      a.employeeName.localeCompare(b.employeeName),
    );
  }
}
