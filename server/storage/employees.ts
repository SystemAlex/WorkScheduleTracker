import { db } from '../db';
import { employees, type Employee, type InsertEmployee } from '@shared/schema';
import { eq, asc, ilike, and } from 'drizzle-orm';

export class EmployeeStorage {
  async getEmployees(nameFilter?: string): Promise<Employee[]> {
    const conditions = [eq(employees.status, 'active')];
    if (nameFilter) {
      conditions.push(ilike(employees.name, `%${nameFilter}%`));
    }
    return await db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(asc(employees.name));
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

  async updateEmployee(
    id: number,
    data: InsertEmployee,
  ): Promise<Employee | null> {
    const [employee] = await db
      .update(employees)
      .set(data)
      .where(eq(employees.id, id))
      .returning();
    return employee || null; // Return null if no employee was updated
  }

  async deleteEmployee(id: number): Promise<boolean> {
    // Change return type to boolean
    // Implement soft delete for employees by setting status to 'inactive'
    const result = await db
      .update(employees)
      .set({ status: 'inactive' })
      .where(eq(employees.id, id));
    return (result.rowCount ?? 0) > 0; // Return true if a row was affected, false otherwise
  }
}
