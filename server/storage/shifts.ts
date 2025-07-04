import { db } from '../db';
import {
  employees,
  positions,
  shifts,
  type InsertShift,
  type ShiftWithDetails,
} from '@shared/schema';
import { eq, and, gte, lte, ne } from 'drizzle-orm';
import { addMonths, format, getDaysInMonth, subMonths } from 'date-fns';
import { ReportStorage } from './reports';
import { PositionStorage } from './positions';
import { formatYearMonth } from '@shared/utils'; // Import formatYearMonth from shared

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
    const whereConditions = [];
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(shifts.date); // Order by date for upcoming shifts

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
    // Correctly get the number of days in the specified month
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1)); // month is 1-indexed, Date constructor expects 0-indexed
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
      .where(and(gte(shifts.date, startDate), lte(shifts.date, endDate)));

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
      .where(eq(shifts.date, date));

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
    const [shift] = await db.insert(shifts).values(insertShift).returning();

    // Get the full shift with details
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
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async checkShiftConflicts(
    employeeId: number,
    date: string,
    excludeShiftId?: number,
  ): Promise<ShiftWithDetails[]> {
    const whereConditions = [
      eq(shifts.employeeId, employeeId),
      eq(shifts.date, date),
    ];

    // Exclude current shift when updating
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

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
      .where(eq(shifts.id, id));
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

  async updateShift(id: number, data: InsertShift): Promise<ShiftWithDetails> {
    const [shift] = await db
      .update(shifts)
      .set(data)
      .where(eq(shifts.id, id))
      .returning();

    // Get the updated shift with details
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
  }

  async generateShiftsFromPreviousMonth(
    targetMonth: number,
    targetYear: number,
  ): Promise<{ count: number }> {
    const targetDate = new Date(targetYear, targetMonth - 1, 1);
    const previousMonthDate = subMonths(targetDate, 1);
    const prevMonth = previousMonthDate.getMonth() + 1;
    const prevYear = previousMonthDate.getFullYear();

    // 1. Get total hours for each employee from the PREVIOUS month
    const previousMonthEmployeeReports =
      await this.reportStorage.getEmployeeHoursReport(
        undefined, // all employees
        prevMonth,
        prevYear,
      );
    const employeePreviousMonthHoursMap = new Map<number, number>();
    previousMonthEmployeeReports.forEach((report) => {
      employeePreviousMonthHoursMap.set(report.employeeId, report.totalHours);
    });

    // 2. Get existing shifts for the current month to avoid duplicates
    const existingCurrentMonthShifts = await this.getShiftsByMonth(
      targetMonth,
      targetYear,
    );
    const existingShiftMap = new Set(
      existingCurrentMonthShifts.map((s) => `${s.employeeId}-${s.date}`),
    );

    // 3. Get current month's total hours for each employee (already existing in current month)
    const currentMonthEmployeeHours =
      await this.reportStorage.getEmployeeHoursReport(
        undefined, // all employees
        targetMonth,
        targetYear,
      );
    const employeeCurrentHoursMap = new Map<number, number>();
    currentMonthEmployeeHours.forEach((report) => {
      employeeCurrentHoursMap.set(report.employeeId, report.totalHours);
    });

    // 4. Get shifts from the previous month to use as a template
    const previousMonthShifts = await this.getShiftsByMonth(
      prevMonth,
      prevYear,
    );

    const newShiftsToInsert: InsertShift[] = [];
    let insertedCount = 0;

    for (const prevShift of previousMonthShifts) {
      const prevShiftDate = new Date(prevShift.date);
      const newDate = addMonths(prevShiftDate, 1);
      const newDateFormatted = format(newDate, 'yyyy-MM-dd');

      // Ensure the new date falls within the current month and year
      if (
        newDate.getMonth() + 1 === targetMonth &&
        newDate.getFullYear() === targetYear
      ) {
        const conflictKey = `${prevShift.employeeId}-${newDateFormatted}`;

        // Check for existing shift for this employee on this date
        if (!existingShiftMap.has(conflictKey)) {
          const employeeId = prevShift.employeeId;
          // Need to get the position details to get totalHoras
          const position = await this.positionStorage
            .getPositions()
            .then((pos) => pos.find((p) => p.id === prevShift.positionId));
          const positionHours = position
            ? parseFloat(position.totalHoras.toString())
            : 0;

          const currentHours = employeeCurrentHoursMap.get(employeeId) || 0;
          // Get the target hours for this employee based on previous month's total, fallback to 160 if no previous data
          const targetHoursForEmployee =
            employeePreviousMonthHoursMap.get(employeeId) || 160;

          // Check if adding this shift would exceed the monthly hour cap based on previous month's total
          if (currentHours + positionHours <= targetHoursForEmployee) {
            newShiftsToInsert.push({
              employeeId: prevShift.employeeId,
              positionId: prevShift.positionId,
              date: newDateFormatted,
              notes: prevShift.notes,
            });
            // Optimistically update the employee's hours map for subsequent checks in the same batch
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

    // Insert new shifts
    if (newShiftsToInsert.length > 0) {
      for (const shiftData of newShiftsToInsert) {
        try {
          await this.createShift(shiftData);
          insertedCount++; // Increment for each successful insertion
        } catch (error) {
          console.warn(
            `Could not insert shift for employee ${shiftData.employeeId} on ${shiftData.date}:`,
            error,
          );
        }
      }
    }

    return { count: insertedCount }; // Return the actual count of inserted shifts
  }
}
