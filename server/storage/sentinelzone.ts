import { db } from '../db';
import {
  mainCompanies,
  users,
  employees, // Importar employees
  clientes, // Importar clientes
  shifts, // Importar shifts
  session, // Importar la tabla de sesiones
  loginHistory, // Importar la nueva tabla
  type InsertMainCompany,
  type InsertUser,
  type MainCompany,
  type User,
} from '@shared/schema';
import { eq, and, gte, lte, isNull, sql, desc } from 'drizzle-orm'; // Importar sql y desc
import { ConflictError, NotFoundError } from '../errors';
import bcrypt from 'bcrypt';
import { subDays, parseISO, format } from 'date-fns'; // Importar format

export class AdminStorage {
  async createMainCompanyAndAdminUser(
    companyData: InsertMainCompany,
    userData: Omit<InsertUser, 'role' | 'mainCompanyId' | 'passwordHash'>, // Updated type to omit passwordHash
  ): Promise<{ company: MainCompany; adminUser: User }> {
    return db.transaction(async (tx) => {
      // 1. Check if company name already exists
      const existingCompany = await tx.query.mainCompanies.findFirst({
        where: eq(mainCompanies.name, companyData.name),
      });

      if (existingCompany) {
        throw new ConflictError('A company with this name already exists.');
      }

      // 2. Insert the new main company
      const [newCompany] = await tx
        .insert(mainCompanies)
        .values({
          name: companyData.name,
          paymentControl: companyData.paymentControl,
          country: companyData.country,
          province: companyData.province,
          city: companyData.city,
          address: companyData.address,
          taxId: companyData.taxId,
          contactName: companyData.contactName,
          phone: companyData.phone,
          email: companyData.email,
          // lastPaymentDate is now optional and will be null if not provided
          isActive: true, // Asegurar que la compañía esté activa por defecto al crearse
        })
        .returning();

      if (!newCompany) {
        throw new Error('Failed to create main company.');
      }

      // 3. Check if admin user username already exists
      const existingUser = await tx.query.users.findFirst({
        where: eq(users.username, userData.username),
      });

      if (existingUser) {
        throw new ConflictError('A user with this username already exists.');
      }

      // 4. Hash the default password
      const defaultPassword = 'newCompany1234'; // Hardcoded default password
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 5. Insert the admin user associated with the new company
      const [newAdminUser] = await tx
        .insert(users)
        .values({
          username: userData.username,
          passwordHash: hashedPassword,
          role: 'admin',
          mainCompanyId: newCompany.id,
          mustChangePassword: true, // Ensure new admin must change password
        })
        .returning();

      if (!newAdminUser) {
        throw new Error('Failed to create admin user for the new company.');
      }

      return { company: newCompany, adminUser: newAdminUser };
    });
  }

  async getMainCompaniesWithAdmins(): Promise<
    (MainCompany & { users: User[] })[]
  > {
    return await db.query.mainCompanies.findMany({
      with: {
        users: {
          where: eq(users.role, 'admin'),
        },
      },
      orderBy: (mainCompanies, { asc }) => [asc(mainCompanies.name)],
    });
  }

  async updateMainCompany(
    id: number,
    data: Partial<InsertMainCompany> & {
      isActive?: boolean;
      lastPaymentDate?: string | null;
    },
  ): Promise<MainCompany | null> {
    // Check if the company exists and is not soft-deleted
    const existingCompany = await db.query.mainCompanies.findFirst({
      where: eq(mainCompanies.id, id),
    });

    if (!existingCompany) {
      throw new NotFoundError('Main company not found.');
    }

    // If name is being updated, check for conflict
    if (data.name && data.name !== existingCompany.name) {
      const nameConflict = await db.query.mainCompanies.findFirst({
        where: eq(mainCompanies.name, data.name),
      });
      if (nameConflict) {
        throw new ConflictError('A company with this name already exists.');
      }
    }

    // Construct the update object with correct types
    const updateData: Partial<MainCompany> = {
      updatedAt: new Date(),
      name: data.name,
      paymentControl: data.paymentControl,
      country: data.country,
      province: data.province,
      city: data.city,
      address: data.address,
      taxId: data.taxId,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email,
    };

    // Explicitly handle isActive
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    } else {
      updateData.isActive = existingCompany.isActive; // Keep existing if not provided
    }

    // Explicitly handle lastPaymentDate, passing the string directly
    // No need for new Date() or format() here, as the input is already 'YYYY-MM-DD'
    if (data.lastPaymentDate !== undefined) {
      updateData.lastPaymentDate = data.lastPaymentDate;
    } else {
      updateData.lastPaymentDate = existingCompany.lastPaymentDate; // Keep existing if not provided
    }

    const [updatedCompany] = await db
      .update(mainCompanies)
      .set(updateData)
      .where(eq(mainCompanies.id, id))
      .returning();

    return updatedCompany || null;
  }

  async deleteMainCompany(id: number): Promise<boolean> {
    // Soft delete: set deletedAt timestamp
    const [deletedCompany] = await db
      .update(mainCompanies)
      .set({ deletedAt: new Date() })
      .where(eq(mainCompanies.id, id))
      .returning({ id: mainCompanies.id }); // Return id to confirm deletion

    return !!deletedCompany; // Return true if a company was updated
  }

  async resetAdminPassword(companyId: number): Promise<boolean> {
    return db.transaction(async (tx) => {
      // 1. Find the main company
      const [company] = await tx
        .select()
        .from(mainCompanies)
        .where(eq(mainCompanies.id, companyId));

      if (!company) {
        throw new NotFoundError('Main company not found.');
      }

      // 2. Find the admin user associated with this company
      const [adminUser] = await tx
        .select()
        .from(users)
        .where(
          and(eq(users.mainCompanyId, companyId), eq(users.role, 'admin')),
        );

      if (!adminUser) {
        throw new NotFoundError('Admin user not found for this company.');
      }

      // 3. Hash the default password
      const defaultPassword = 'resetPass1234';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 4. Update the admin user's password and set mustChangePassword to true
      const [updatedUser] = await tx
        .update(users)
        .set({ passwordHash: hashedPassword, mustChangePassword: true })
        .where(eq(users.id, adminUser.id))
        .returning();

      return !!updatedUser;
    });
  }

  async getGlobalStats(): Promise<{
    totalEmployees: number;
    totalClients: number;
    totalShiftsLast30Days: number;
  }> {
    const [employeesCount] = await db
      .select({ count: sql<number>`count(*)` }) // Use sql`count(*)` for count
      .from(employees)
      .where(eq(employees.status, 'active'));

    const [clientsCount] = await db
      .select({ count: sql<number>`count(*)` }) // Use sql`count(*)` for count
      .from(clientes)
      .where(isNull(clientes.deletedAt));

    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().slice(0, 10);
    const [shiftsCount] = await db
      .select({ count: sql<number>`count(*)` }) // Use sql`count(*)` for count
      .from(shifts)
      .where(gte(shifts.date, thirtyDaysAgo));

    return {
      totalEmployees: employeesCount.count,
      totalClients: clientsCount.count,
      totalShiftsLast30Days: shiftsCount.count,
    };
  }

  async getActiveSessions(): Promise<
    {
      username: string;
      role: string;
      expire: Date;
      companyName: string | null;
    }[]
  > {
    const allSessions = await db
      .select({
        username: users.username,
        role: users.role,
        expire: session.expire,
        companyName: mainCompanies.name, // Select company name
      })
      .from(session)
      .innerJoin(
        users,
        sql`CAST(session.sess ->> 'userId' AS INTEGER) = ${users.id}`,
      )
      .leftJoin(mainCompanies, eq(users.mainCompanyId, mainCompanies.id)) // Left join to get company name (can be null for super_admin)
      .orderBy(session.expire);

    return allSessions.map((s) => ({ ...s, role: s.role.replace('_', ' ') }));
  }

  async recordLogin(
    userId: number,
    mainCompanyId: number | null,
    ipAddress: string,
  ): Promise<void> {
    await db.insert(loginHistory).values({
      userId,
      mainCompanyId,
      ipAddress,
    });
  }

  async getLoginHistory(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'month',
  ): Promise<{ date: string; logins: number }[]> {
    // Construcción de la expresión DATE_TRUNC como SQL raw
    const dateTruncSqlString = `DATE_TRUNC('${granularity}', "login_history"."login_timestamp")`;

    const result = await db
      .select({
        // Usar sql.raw para la selección de la columna 'date'
        date: sql<string>`${sql.raw(dateTruncSqlString)}`.as('date'),
        logins: sql<number>`count(${loginHistory.id})`.mapWith(Number),
      })
      .from(loginHistory)
      .where(
        and(
          gte(loginHistory.loginTimestamp, startDate),
          lte(loginHistory.loginTimestamp, endDate),
        ),
      )
      // Usar sql.raw para la cláusula GROUP BY
      .groupBy(sql.raw(dateTruncSqlString))
      .orderBy(desc(sql.raw(dateTruncSqlString)));

    return result.map((row) => {
      const parsedDate = parseISO(row.date);
      let formattedDateString: string;

      if (granularity === 'hour') {
        formattedDateString = parsedDate.toISOString(); // Mantener ISO completo para granularidad por hora
      } else {
        // Para granularidad por día o mes, formatear a YYYY-MM-DD
        formattedDateString = format(parsedDate, 'yyyy-MM-dd');
      }

      return {
        date: formattedDateString,
        logins: row.logins,
      };
    });
  }
}
