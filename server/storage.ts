import {
  employees,
  positions,
  shiftTypes,
  shifts,
  type Employee,
  type Position,
  type ShiftType,
  type Shift,
  type InsertEmployee,
  type InsertPosition,
  type InsertShiftType,
  type InsertShift,
  type ShiftWithDetails,
} from '@shared/schema';
import { db } from './db';
import { eq, and, gte, lte, ne, asc } from 'drizzle-orm';

export interface IStorage {
  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(insertEmployee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: InsertEmployee): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  // Positions
  getPositions(): Promise<Position[]>;
  createPosition(insertPosition: InsertPosition): Promise<Position>;

  // Shift Types
  getShiftTypes(): Promise<ShiftType[]>;
  createShiftType(insertShiftType: InsertShiftType): Promise<ShiftType>;

  // Shifts
  getShifts(): Promise<ShiftWithDetails[]>;
  getShiftsByMonth(month: number, year: number): Promise<ShiftWithDetails[]>;
  getShiftsByDate(date: string): Promise<ShiftWithDetails[]>;
  createShift(insertShift: InsertShift): Promise<ShiftWithDetails>;
  deleteShift(id: number): Promise<void>;
  checkShiftConflicts(
    employeeId: number,
    date: string,
  ): Promise<ShiftWithDetails[]>;

  // Reports
  getEmployeeHoursReport(
    employeeId?: number,
    month?: number,
    year?: number,
  ): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(asc(employees.name));
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, data: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set(data)
      .where(eq(employees.id, id))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Positions
  async getPositions(): Promise<Position[]> {
    return await db.select().from(positions);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  // Shift Types
  async getShiftTypes(): Promise<ShiftType[]> {
    return await db.select().from(shiftTypes);
  }

  async createShiftType(insertShiftType: InsertShiftType): Promise<ShiftType> {
    const [shiftType] = await db
      .insert(shiftTypes)
      .values(insertShiftType)
      .returning();
    return shiftType;
  }

  // Shifts
  async getShifts(): Promise<ShiftWithDetails[]> {
    const results = await db
      .select({
        id: shifts.id,
        employeeId: shifts.employeeId,
        positionId: shifts.positionId,
        shiftTypeId: shifts.shiftTypeId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
      .innerJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id));

    return results.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      positionId: row.positionId,
      shiftTypeId: row.shiftTypeId,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      employee: row.employee!,
      position: row.position!,
      shiftType: row.shiftType!,
    }));
  }

  async getShiftsByMonth(
    month: number,
    year: number,
  ): Promise<ShiftWithDetails[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

    const results = await db
      .select({
        id: shifts.id,
        employeeId: shifts.employeeId,
        positionId: shifts.positionId,
        shiftTypeId: shifts.shiftTypeId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
      .innerJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id))
      .where(and(gte(shifts.date, startDate), lte(shifts.date, endDate)));

    return results.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      positionId: row.positionId,
      shiftTypeId: row.shiftTypeId,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      employee: row.employee!,
      position: row.position!,
      shiftType: row.shiftType!,
    }));
  }

  async getShiftsByDate(date: string): Promise<ShiftWithDetails[]> {
    const results = await db
      .select({
        id: shifts.id,
        employeeId: shifts.employeeId,
        positionId: shifts.positionId,
        shiftTypeId: shifts.shiftTypeId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .innerJoin(employees, eq(shifts.employeeId, employees.id))
      .innerJoin(positions, eq(shifts.positionId, positions.id))
      .innerJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id))
      .where(eq(shifts.date, date));

    return results.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      positionId: row.positionId,
      shiftTypeId: row.shiftTypeId,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      employee: row.employee!,
      position: row.position!,
      shiftType: row.shiftType!,
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
        shiftTypeId: shifts.shiftTypeId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(positions, eq(shifts.positionId, positions.id))
      .leftJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id))
      .where(eq(shifts.id, shift.id));

    return {
      id: result.id,
      employeeId: result.employeeId,
      positionId: result.positionId,
      shiftTypeId: result.shiftTypeId,
      date: result.date,
      notes: result.notes,
      createdAt: result.createdAt,
      employee: result.employee!,
      position: result.position!,
      shiftType: result.shiftType!,
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
      eq(shifts.date, date)
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
        shiftTypeId: shifts.shiftTypeId,
        date: shifts.date,
        notes: shifts.notes,
        createdAt: shifts.createdAt,
        employee: employees,
        position: positions,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(positions, eq(shifts.positionId, positions.id))
      .leftJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id))
      .where(and(...whereConditions));

    return results.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      positionId: row.positionId,
      shiftTypeId: row.shiftTypeId,
      date: row.date,
      notes: row.notes,
      createdAt: row.createdAt,
      employee: row.employee!,
      position: row.position!,
      shiftType: row.shiftType!,
    }));
  }

  // Reports
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
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
      whereConditions.push(
        and(gte(shifts.date, startDate), lte(shifts.date, endDate)),
      );
    }

    const shiftData = await db
      .select({
        employee: employees,
        shiftType: shiftTypes,
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .leftJoin(shiftTypes, eq(shifts.shiftTypeId, shiftTypes.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Group by employee and calculate stats
    const report = shiftData.reduce((acc, row) => {
      const employeeId = row.employee!.id;
      const employeeName = row.employee!.name;
      const shiftCode = row.shiftType!.code;

      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          employeeName,
          totalHours: 0,
          totalShifts: 0,
          shiftBreakdown: {
            morning: 0,
            afternoon: 0,
            night: 0,
            special: 0,
          },
        };
      }

      acc[employeeId].totalShifts++;
      acc[employeeId].totalHours += 8; // Assuming 8 hours per shift

      // Count shift types
      switch (shiftCode) {
        case 'M':
          acc[employeeId].shiftBreakdown.morning++;
          break;
        case 'T':
          acc[employeeId].shiftBreakdown.afternoon++;
          break;
        case 'N':
          acc[employeeId].shiftBreakdown.night++;
          break;
        default:
          acc[employeeId].shiftBreakdown.special++;
      }

      return acc;
    }, {} as any);

    return Object.values(report);
  }
}

export const storage = new DatabaseStorage();
