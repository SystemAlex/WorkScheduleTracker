import { db } from '../db';
import { users, type User, type InsertUser } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ConflictError, ForbiddenError } from '../errors';
import bcrypt from 'bcrypt';

export class UserStorage {
  async getUsers(mainCompanyId: number): Promise<Omit<User, 'passwordHash'>[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        mainCompanyId: users.mainCompanyId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        mustChangePassword: users.mustChangePassword, // Include the new field
      })
      .from(users)
      .where(eq(users.mainCompanyId, mainCompanyId));
  }

  async createUser(
    data: Pick<InsertUser, 'username' | 'role'>,
    mainCompanyId: number,
  ): Promise<User> {
    if (data.role === 'super_admin') {
      throw new ForbiddenError(
        'No se puede crear un usuario con el rol de super_admin.',
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username));

    if (existingUser.length > 0) {
      throw new ConflictError(
        'Ya existe un usuario con este nombre de usuario.',
      );
    }

    const defaultPassword = 'password123'; // Contraseña por defecto para nuevos usuarios
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        ...data,
        passwordHash,
        mainCompanyId,
        mustChangePassword: true, // Ensure new users must change password
      })
      .returning();

    return newUser;
  }

  async updateUser(
    userId: number,
    data: Pick<InsertUser, 'role'>,
    mainCompanyId: number,
  ): Promise<User | null> {
    if (data.role === 'super_admin') {
      throw new ForbiddenError('No se puede asignar el rol de super_admin.');
    }

    const [updatedUser] = await db
      .update(users)
      .set({ role: data.role, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.mainCompanyId, mainCompanyId)))
      .returning();

    return updatedUser || null;
  }

  async deleteUser(
    userId: number,
    mainCompanyId: number,
    currentUserId: number,
  ): Promise<boolean> {
    if (userId === currentUserId) {
      throw new ForbiddenError('No puedes eliminar tu propia cuenta.');
    }

    const result = await db
      .delete(users)
      .where(and(eq(users.id, userId), eq(users.mainCompanyId, mainCompanyId)));

    return (result.rowCount ?? 0) > 0;
  }

  async resetUserPassword(
    userId: number,
    mainCompanyId: number,
  ): Promise<boolean> {
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const [updatedUser] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() }) // Set mustChangePassword to true
      .where(and(eq(users.id, userId), eq(users.mainCompanyId, mainCompanyId)))
      .returning();

    return !!updatedUser;
  }
}
