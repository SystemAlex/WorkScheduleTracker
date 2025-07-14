import { db } from '../../db';
import {
  employees,
  positions,
  shifts,
  type ShiftWithDetails,
} from '@shared/schema';
import { eq, and, ne, isNull } from 'drizzle-orm';

export class ShiftConflictChecker {
  async checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]> {
    const whereConditions = [
      eq(shifts.employeeId, employeeId),
      eq(shifts.date, date),
      eq(employees.status, 'active'),
      isNull(positions.deletedAt),
    ];

    if (excludeShiftId) {
      whereConditions.push(ne(shifts.id, excludeShiftId));
    }
    if (mainCompanyId) {
      whereConditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }

    const results = await db
      .select({
        id: shifts.id,
        employeeId: shifts.employeeId,
        positionId: shifts.positionId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(positions, eq(shifts.positionId, positions.id))
      .where(and(...whereConditions));

    return results.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      positionId: row.positionId,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      employee: row.employee!,
      position: row.position!,
    }));
  }
}
