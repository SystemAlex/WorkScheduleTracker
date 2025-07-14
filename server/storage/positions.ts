import { db } from '../db';
import {
  positions,
  shifts,
  clientes, // Importar clientes para la relación
  type Position,
  type InsertPosition,
} from '@shared/schema';
import { asc, ilike, eq, isNull, count, and, inArray } from 'drizzle-orm';
import { ConflictError, ForbiddenError } from '../errors';

export class PositionStorage {
  async getPositions(
    nameFilter?: string,
    mainCompanyId?: number,
  ): Promise<Position[]> {
    const conditions = [isNull(positions.deletedAt)];
    if (nameFilter) {
      conditions.push(ilike(positions.name, `%${nameFilter}%`));
    }
    if (mainCompanyId) {
      // Unir con la tabla de clientes para filtrar por mainCompanyId
      conditions.push(eq(clientes.mainCompanyId, mainCompanyId));
    }
    return await db
      .select({
        id: positions.id,
        name: positions.name,
        description: positions.description,
        department: positions.department,
        siglas: positions.siglas,
        color: positions.color,
        totalHoras: positions.totalHoras,
        clienteId: positions.clienteId,
        createdAt: positions.createdAt,
        deletedAt: positions.deletedAt,
      })
      .from(positions)
      .leftJoin(clientes, eq(positions.clienteId, clientes.id)) // Unir con clientes
      .where(and(...conditions))
      .orderBy(asc(positions.name));
  }

  async createPosition(
    insertPosition: InsertPosition,
    mainCompanyId: number,
  ): Promise<Position> {
    try {
      // Verificar que el clienteId pertenezca a la mainCompanyId del usuario
      const [cliente] = await db
        .select()
        .from(clientes)
        .where(
          and(
            eq(clientes.id, insertPosition.clienteId),
            eq(clientes.mainCompanyId, mainCompanyId),
          ),
        );
      if (!cliente) {
        throw new ForbiddenError(
          'Client not found or does not belong to your company.',
        );
      }

      const [position] = await db
        .insert(positions)
        .values(insertPosition)
        .returning();
      return position;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictError(
          'A position with this name already exists for this client.',
        );
      }
      throw error;
    }
  }

  async updatePosition(
    id: number,
    data: InsertPosition,
    mainCompanyId?: number,
  ): Promise<Position | null> {
    try {
      const conditions = [eq(positions.id, id)];
      if (mainCompanyId) {
        const companyClientIds = db
          .select({ id: clientes.id })
          .from(clientes)
          .where(eq(clientes.mainCompanyId, mainCompanyId));
        conditions.push(inArray(positions.clienteId, companyClientIds));
      }

      // Verificar que el nuevo clienteId (si se cambia) pertenezca a la mainCompanyId del usuario
      if (data.clienteId && mainCompanyId) {
        const [cliente] = await db
          .select()
          .from(clientes)
          .where(
            and(
              eq(clientes.id, data.clienteId),
              eq(clientes.mainCompanyId, mainCompanyId),
            ),
          );
        if (!cliente) {
          throw new ForbiddenError(
            'New client not found or does not belong to your company.',
          );
        }
      }

      const [position] = await db
        .update(positions)
        .set(data)
        .where(and(...conditions))
        .returning();
      return position || null;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictError(
          'A position with this name already exists for this client.',
        );
      }
      throw error;
    }
  }

  async deletePosition(id: number, mainCompanyId?: number): Promise<boolean> {
    const conditions = [eq(positions.id, id)];
    if (mainCompanyId) {
      const companyClientIds = db
        .select({ id: clientes.id })
        .from(clientes)
        .where(eq(clientes.mainCompanyId, mainCompanyId));
      conditions.push(inArray(positions.clienteId, companyClientIds));
    }

    const shiftsCountResult = await db
      .select({ count: count() })
      .from(shifts)
      .where(eq(shifts.positionId, id));

    const shiftsCount = shiftsCountResult[0].count;

    let result;
    if (shiftsCount > 0) {
      result = await db
        .update(positions)
        .set({ deletedAt: new Date() })
        .where(and(...conditions));
    } else {
      result = await db.delete(positions).where(and(...conditions));
    }
    return (result.rowCount ?? 0) > 0;
  }
}
