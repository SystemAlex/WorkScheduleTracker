import { db } from '../db';
import {
  employees,
  positions,
  shifts,
  type InsertShift,
  type ShiftWithDetails,
} from '@shared/schema';
import { eq, and, gte, lte, ne, isNull } from 'drizzle-orm';
import { addMonths, format, getDaysInMonth, subMonths } from 'date-fns';
import { ReportStorage } from './reports';
import { PositionStorage } from './positions';
import { ConflictError } from '../errors'; // Import ConflictError

export class ShiftStorage {
  private reportStorage: ReportStorage;
  private positionStorage: PositionStorage;

  constructor(reportStorage: ReportStorage, positionStorage: PositionStorage) {
    this.reportStorage = reportStorage;
    this.positionStorage = positionStorage;
  }

  async getShifts(
    startDate?: string,
    endDate?: string,
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
  ): Promise<ShiftWithDetails[]> {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

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
      .where(
        and(
          gte(shifts.date, startDate),
          lte(shifts.date, endDate),
          eq(employees.status, 'active'),
          isNull(positions.deletedAt),
        ),
      );

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

  async getShiftsByDate(date: string): Promise<ShiftWithDetails[]> {
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
      .where(
        and(
          eq(shifts.date, date),
          eq(employees.status, 'active'),
          isNull(positions.deletedAt),
        ),
      );

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

  async createShift(insertShift: InsertShift): Promise<ShiftWithDetails> {
    try {
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
        // PostgreSQL unique violation error code
        throw new ConflictError(
          'A shift already exists for this employee on this date.',
        );
      }
      throw error;
    }
  }

  async deleteShift(id: number): Promise<boolean> {
    // Change return type to boolean
    const result = await db.delete(shifts).where(eq(shifts.id, id));
    return (result.rowCount ?? 0) > 0; // Return true if a row was affected, false otherwise
  }

  async checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
  ): Promise<ShiftWithDetails[]> {
    const whereConditions = [
      eq(shifts.employeeId, employeeId),
      eq(shifts.date, date),
      eq(employees.status, 'active'), // Ensure employee is active
      isNull(positions.deletedAt), // Ensure position is not soft-deleted
    ];

    if (excludeShiftId) {
      whereConditions.push(ne(shifts.id, excludeShiftId));
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

  async getShiftById(id: number): Promise<ShiftWithDetails | undefined> {
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
      .where(
        and(
          eq(shifts.id, id),
          eq(employees.status, 'active'),
          isNull(positions.deletedAt),
        ),
      );
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
  ): Promise<ShiftWithDetails | null> {
    try {
      const [shift] = await db
        .update(shifts)
        .set(data)
        .where(eq(shifts.id, id))
        .returning();

      if (!shift) {
        return null; // No shift found to update
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
        // PostgreSQL unique violation error code
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
  ): Promise<{ count: number }> {
    const targetDate = new Date(targetYear, targetMonth - 1, 1);
    const previousMonthDate = subMonths(targetDate, 1);
    const prevMonth = previousMonthDate.getMonth() + 1;
    const prevYear = previousMonthDate.getFullYear();

    const previousMonthEmployeeReports =
      await this.reportStorage.getEmployeeHoursReport(
        undefined,
        prevMonth,
        prevYear,
      );
    const employeePreviousMonthHoursMap = new Map<number, number>();
    previousMonthEmployeeReports.forEach((report) => {
      employeePreviousMonthHoursMap.set(report.employeeId, report.totalHours);
    });

    const existingCurrentMonthShifts = await this.getShiftsByMonth(
      targetMonth,
      targetYear,
    );
    const existingShiftMap = new Set(
      existingCurrentMonthShifts.map((s) => `${s.employeeId}-${s.date}`),
    );

    const currentMonthEmployeeHours =
      await this.reportStorage.getEmployeeHoursReport(
        undefined,
        targetMonth,
        targetYear,
      );
    const employeeCurrentHoursMap = new Map<number, number>();
    currentMonthEmployeeHours.forEach((report) => {
      employeeCurrentHoursMap.set(report.employeeId, report.totalHours);
    });

    const previousMonthShifts = await this.getShiftsByMonth(
      prevMonth,
      prevYear,
    );

    const newShiftsToInsert: InsertShift[] = [];
    // let insertedCount = 0; // No longer needed as a separate counter

    for (const prevShift of previousMonthShifts) {
      const prevShiftDate = new Date(prevShift.date);
      const newDate = addMonths(prevShiftDate, 1);
      const newDateFormatted = format(newDate, 'yyyy-MM-dd');

      if (
        newDate.getMonth() + 1 === targetMonth &&
        newDate.getFullYear() === targetYear
      ) {
        const conflictKey = `${prevShift.employeeId}-${newDateFormatted}`;

        if (!existingShiftMap.has(conflictKey)) {
          const employeeId = prevShift.employeeId;
          const position = await this.positionStorage
            .getPositions()
            .then((pos) => pos.find((p) => p.id === prevShift.positionId));
          const positionHours = position
            ? parseFloat(position.totalHoras.toString())
            : 0;

          const currentHours = employeeCurrentHoursMap.get(employeeId) || 0;
          const targetHoursForEmployee =
            employeePreviousMonthHoursMap.get(employeeId) || 160;

          if (currentHours + positionHours <= targetHoursForEmployee) {
            newShiftsToInsert.push({
              employeeId: prevShift.employeeId,
              positionId: prevShift.positionId,
              date: newDateFormatted,
              notes: prevShift.notes,
            });
            // Update current hours map for subsequent checks within the same batch
            employeeCurrentHoursMap.set(
              employeeId,
              currentHours + positionHours,
            );
          } else {
            console.log(
              `Skipping shift for employee ${prevShift.employee.name} on ${newDateFormatted} due to exceeding previous month's total hours (${targetHoursForEmployee}).`,
            );
          }
        }
      }
    }

    let insertedCount = 0;
    if (newShiftsToInsert.length > 0) {
      try {
        const insertedShifts = await db
          .insert(shifts)
          .values(newShiftsToInsert)
          .returning();
        insertedCount = insertedShifts.length;
      } catch (error: unknown) {
        // Catch unique constraint violation during batch insert
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === '23505'
        ) {
          console.warn(
            `Skipping batch insert due to unique constraint violation:`,
            error instanceof Error ? error.message : error,
          );
        } else {
          console.warn(`Could not insert batch of shifts:`, error);
        }
      }
    }

    return { count: insertedCount };
  }
}
