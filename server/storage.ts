import {
  employees,
  positions,
  shifts,
  clientes,
  type Employee,
  type Position,
  type Shift,
  type Cliente,
  type InsertEmployee,
  type InsertPosition,
  type InsertShift,
  type InsertCliente,
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

  // Clientes
  getClientes(): Promise<Cliente[]>;
  createCliente(data: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, data: InsertCliente): Promise<Cliente>;
  deleteCliente(id: number): Promise<void>;
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

  // Shifts
  async getShifts(): Promise<ShiftWithDetails[]> {
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
      .innerJoin(positions, eq(shifts.positionId, positions.id));

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
    const daysInMonth = new Date(year, month, 0).getDate();
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
      })
      .from(shifts)
      .leftJoin(employees, eq(shifts.employeeId, employees.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Group by employee and calculate stats
    const report = shiftData.reduce((acc, row) => {
      const employeeId = row.employee!.id;
      const employeeName = row.employee!.name;

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

      return acc;
    }, {} as any);

    return Object.values(report);
  }

  // Clientes
  async getClientes(): Promise<Cliente[]> {
    return await db.select().from(clientes);
  }

  async createCliente(data: InsertCliente): Promise<Cliente> {
    const [cliente] = await db.insert(clientes).values(data).returning();
    return cliente;
  }

  async updateCliente(id: number, data: InsertCliente): Promise<Cliente> {
    const [cliente] = await db
      .update(clientes)
      .set(data)
      .where(eq(clientes.id, id))
      .returning();
    return cliente;
  }

  async deleteCliente(id: number): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }
}

export const storage = new DatabaseStorage();
