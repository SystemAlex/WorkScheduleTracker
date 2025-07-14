import { db } from '../../db';
import { employees, positions, shifts, type InsertShift } from '@shared/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm'; // Added isNull
import { addMonths, format, getDaysInMonth, subMonths, parse } from 'date-fns'; // Import parse
import { ReportStorage } from '../reports';
import { PositionStorage } from '../positions';

export class ShiftGenerator {
  private reportStorage: ReportStorage;
  private positionStorage: PositionStorage;

  constructor(reportStorage: ReportStorage, positionStorage: PositionStorage) {
    this.reportStorage = reportStorage;
    this.positionStorage = positionStorage;
  }

  async generateShiftsFromPreviousMonth(
    targetMonth: number,
    targetYear: number,
    mainCompanyId: number,
  ): Promise<{ count: number }> {
    const targetDate = new Date(targetYear, targetMonth - 1, 1);
    const previousMonthDate = subMonths(targetDate, 1);
    const prevMonth = previousMonthDate.getMonth() + 1;
    const prevYear = previousMonthDate.getFullYear();

    // Fetch previous month's employee reports to get target hours
    const previousMonthEmployeeReports =
      await this.reportStorage.getEmployeeHoursReport(
        undefined,
        prevMonth,
        prevYear,
        undefined,
        mainCompanyId,
      );
    const employeePreviousMonthHoursMap = new Map<number, number>();
    previousMonthEmployeeReports.forEach((report) => {
      employeePreviousMonthHoursMap.set(report.employeeId, report.totalHours);
    });

    // Fetch existing shifts for the target month to avoid duplicates
    const existingCurrentMonthShifts = await this.getShiftsByMonthInternal(
      targetMonth,
      targetYear,
      mainCompanyId,
    );
    const existingShiftMap = new Set(
      existingCurrentMonthShifts.map((s) => `${s.employeeId}-${s.date}`),
    );

    // Fetch current month's employee hours to track progress
    const currentMonthEmployeeHours =
      await this.reportStorage.getEmployeeHoursReport(
        undefined,
        targetMonth,
        targetYear,
        undefined,
        mainCompanyId,
      );
    const employeeCurrentHoursMap = new Map<number, number>();
    currentMonthEmployeeHours.forEach((report) => {
      employeeCurrentHoursMap.set(report.employeeId, report.totalHours);
    });

    // Fetch previous month's shifts to use as templates
    const previousMonthShifts = await this.getShiftsByMonthInternal(
      prevMonth,
      prevYear,
      mainCompanyId,
    );

    const newShiftsToInsert: InsertShift[] = [];

    for (const prevShift of previousMonthShifts) {
      const prevShiftDate = parse(prevShift.date, 'yyyy-MM-dd', new Date());
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
            .getPositions(undefined, mainCompanyId)
            .then((pos) => pos.find((p) => p.id === prevShift.positionId));
          const positionHours = position
            ? parseFloat(position.totalHoras.toString())
            : 0;

          const currentHours = employeeCurrentHoursMap.get(employeeId) || 0;
          const targetHoursForEmployee =
            employeePreviousMonthHoursMap.get(employeeId) || 160; // Default to 160 if no previous month data

          if (currentHours + positionHours <= targetHoursForEmployee) {
            newShiftsToInsert.push({
              employeeId: prevShift.employeeId,
              positionId: prevShift.positionId,
              date: newDateFormatted,
              notes: prevShift.notes,
            });
            employeeCurrentHoursMap.set(
              employeeId,
              currentHours + positionHours,
            );
          } else {
            // console.log(
            //   `Skipping shift for employee ${prevShift.employee.name} on ${newDateFormatted} due to exceeding previous month's total hours (${targetHoursForEmployee}).`,
            // );
          }
        }
      }
    }

    let insertedCount = 0;
    if (newShiftsToInsert.length > 0) {
      try {
        // Batch insert to improve performance
        const insertedShifts = await db
          .insert(shifts)
          .values(newShiftsToInsert)
          .returning();
        insertedCount = insertedShifts.length;
      } catch (error: unknown) {
        // Log unique constraint violations but don't re-throw to allow other shifts to be inserted
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === '23505'
        ) {
          console.warn(
            `Skipping batch insert due to unique constraint violation (some shifts might already exist):`,
            error instanceof Error ? error.message : error,
          );
        } else {
          console.warn(`Could not insert batch of shifts:`, error);
          throw error; // Re-throw other unexpected errors
        }
      }
    }

    return { count: insertedCount };
  }

  // Internal helper to fetch shifts by month, used by generateShiftsFromPreviousMonth
  private async getShiftsByMonthInternal(
    month: number,
    year: number,
    mainCompanyId?: number,
  ) {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));
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
}
