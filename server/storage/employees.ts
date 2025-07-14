import { db } from '../db';
import { employees, type Employee, type InsertEmployee } from '@shared/schema';
import { eq, asc, ilike, and } from 'drizzle-orm';

export class EmployeeStorage {
  async getEmployees(
    nameFilter?: string,
    mainCompanyId?: number,
  ): Promise<Employee[]> {
    const conditions = [];
    if (nameFilter) {
      conditions.push(ilike(employees.name, `%${nameFilter}%`));
    }
    if (mainCompanyId) {
      conditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }
    return await db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(asc(employees.name));
  }

  async getEmployee(
    id: number,
    mainCompanyId?: number,
  ): Promise<Employee | undefined> {
    const conditions = [eq(employees.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(...conditions));
    return employee || undefined;
  }

  async createEmployee(
    insertEmployee: InsertEmployee,
    mainCompanyId: number,
  ): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values({ ...insertEmployee, mainCompanyId })
      .returning();
    return employee;
  }

  async updateEmployee(
    id: number,
    data: InsertEmployee,
    mainCompanyId?: number,
  ): Promise<Employee | null> {
    const conditions = [eq(employees.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }
    const [employee] = await db
      .update(employees)
      .set(data)
      .where(and(...conditions))
      .returning();
    return employee || null;
  }

  async deleteEmployee(id: number, mainCompanyId?: number): Promise<boolean> {
    const conditions = [eq(employees.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(employees.mainCompanyId, mainCompanyId));
    }
    const result = await db
      .update(employees)
      .set({ status: 'inactive' })
      .where(and(...conditions));
    return (result.rowCount ?? 0) > 0;
  }
}
