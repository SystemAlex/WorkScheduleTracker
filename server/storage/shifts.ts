import { db } from '../db';
import {
  employees,
  positions,
  shifts,
  clientes,
  type InsertShift,
  type ShiftWithDetails,
} from '@shared/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { ReportStorage } from './reports';
import { PositionStorage } from './positions';
import { ConflictError } from '../errors';
import { ShiftConflictChecker } from './shifts/shift-conflict-checker'; // Import new class
import { ShiftGenerator } from './shifts/shift-generator'; // Import new class

export class ShiftStorage {
  private shiftConflictChecker: ShiftConflictChecker;
  private shiftGenerator: ShiftGenerator;

  constructor(reportStorage: ReportStorage, positionStorage: PositionStorage) {
    this.shiftConflictChecker = new ShiftConflictChecker();
    this.shiftGenerator = new ShiftGenerator(reportStorage, positionStorage);
  }

  async getShifts(
    startDate?: string,
    endDate?: string,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]> {
    const whereConditions = [
      eq(employees.status, 'active'),
      isNull(positions.deletedAt),
    ];
    if (startDate) {
      whereConditions.push(gte(shifts.date, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(shifts.date, endDate));
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
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
      .where(and(...whereConditions))
      .orderBy(shifts.date);

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

  async getShiftsByMonth(
    month: number,
    year: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]> {
    // This method is now a wrapper around the internal method in ShiftGenerator
    // or can be kept here if it's a common public utility.
    // For now, let's keep it here and ensure it uses the same logic.
    const daysInMonth = new Date(year, month, 0).getDate(); // Correct way to get days in month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

    const whereConditions = [
      gte(shifts.date, startDate),
      lte(shifts.date, endDate),
      eq(employees.status, 'active'),
      isNull(positions.deletedAt),
    ];
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
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
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

  async getShiftsByDate(
    date: string,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]> {
    const whereConditions = [
      eq(shifts.date, date),
      eq(employees.status, 'active'),
      isNull(positions.deletedAt),
    ];
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
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
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

  async createShift(
    insertShift: InsertShift,
    mainCompanyId: number,
  ): Promise<ShiftWithDetails> {
    try {
      // Verify employee and position belong to the user's mainCompanyId
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, insertShift.employeeId),
            eq(employees.mainCompanyId, mainCompanyId),
          ),
        );
      if (!employee) {
        throw new ConflictError(
          'Employee not found or does not belong to your company.',
        );
      }

      const [position] = await db
        .select()
        .from(positions)
        .leftJoin(clientes, eq(positions.clienteId, clientes.id))
        .where(
          and(
            eq(positions.id, insertShift.positionId),
            eq(clientes.mainCompanyId, mainCompanyId),
          ),
        );
      if (!position) {
        throw new ConflictError(
          'Position not found or does not belong to your company.',
        );
      }

      const [shift] = await db.insert(shifts).values(insertShift).returning();

      const [result] = await db
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
        .where(eq(shifts.id, shift.id));

      return {
        id: result.id,
        employeeId: result.employeeId,
        positionId: result.positionId,
        date: result.date,
        notes: result.notes,
        createdAt: result.createdAt,
        employee: result.employee!,
        position: result.position!,
      };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictError(
          'A shift already exists for this employee on this date.',
        );
      }
      throw error;
    }
  }

  async deleteShift(id: number, mainCompanyId?: number): Promise<boolean> {
    const subquery = db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.mainCompanyId, mainCompanyId!));

    const conditions = [eq(shifts.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(shifts.employeeId, subquery));
    }
    const result = await db.delete(shifts).where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }

  async checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails[]> {
    // Delegate to the new ShiftConflictChecker
    return this.shiftConflictChecker.checkShiftConflicts(
      employeeId,
      date,
      excludeShiftId,
      mainCompanyId,
    );
  }

  async getShiftById(
    id: number,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails | undefined> {
    const whereConditions = [
      eq(shifts.id, id),
      eq(employees.status, 'active'),
      isNull(positions.deletedAt),
    ];
    if (mainCompanyId) {
      whereConditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }

    const [result] = await db
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
    return result
      ? {
          id: result.id,
          employeeId: result.employeeId,
          positionId: result.positionId,
          date: result.date,
          notes: result.notes,
          createdAt: result.createdAt,
          employee: result.employee!,
          position: result.position!,
        }
      : undefined;
  }

  async updateShift(
    id: number,
    data: InsertShift,
    mainCompanyId?: number,
  ): Promise<ShiftWithDetails | null> {
    try {
      const subquery = db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.mainCompanyId, mainCompanyId!));

      const conditions = [eq(shifts.id, id)];
      if (mainCompanyId) {
        conditions.push(eq(shifts.employeeId, subquery));
      }

      // Verify employee and position belong to the user's mainCompanyId if they are being updated
      if (data.employeeId && mainCompanyId) {
        const [employee] = await db
          .select()
          .from(employees)
          .where(
            and(
              eq(employees.id, data.employeeId),
              eq(employees.mainCompanyId, mainCompanyId),
            ),
          );
        if (!employee) {
          throw new ConflictError(
            'Employee not found or does not belong to your company.',
          );
        }
      }
      if (data.positionId && mainCompanyId) {
        const [position] = await db
          .select()
          .from(positions)
          .leftJoin(clientes, eq(positions.clienteId, clientes.id))
          .where(
            and(
              eq(positions.id, data.positionId),
              eq(clientes.mainCompanyId, mainCompanyId),
            ),
          );
        if (!position) {
          throw new ConflictError(
            'Position not found or does not belong to your company.',
          );
        }
      }

      const [shift] = await db
        .update(shifts)
        .set(data)
        .where(and(...conditions))
        .returning();

      if (!shift) {
        return null;
      }

      const [result] = await db
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
        .where(eq(shifts.id, id));

      return {
        id: result.id,
        employeeId: result.employeeId,
        positionId: result.positionId,
        date: result.date,
        notes: result.notes,
        createdAt: result.createdAt,
        employee: result.employee!,
        position: result.position!,
      };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictError(
          'A shift already exists for this employee on this date.',
        );
      }
      throw error;
    }
  }

  async generateShiftsFromPreviousMonth(
    targetMonth: number,
    targetYear: number,
    mainCompanyId: number,
  ): Promise<{ count: number }> {
    // Delegate to the new ShiftGenerator
    return this.shiftGenerator.generateShiftsFromPreviousMonth(
      targetMonth,
      targetYear,
      mainCompanyId,
    );
  }
}
