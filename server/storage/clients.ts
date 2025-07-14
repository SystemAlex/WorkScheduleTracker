import { db } from '../db';
import {
  clientes,
  positions,
  type Cliente,
  type InsertCliente,
} from '@shared/schema';
import { eq, ilike, asc, isNull, count, and } from 'drizzle-orm';

export class ClientStorage {
  async getClientes(
    searchFilter?: string,
    mainCompanyId?: number,
  ): Promise<Cliente[]> {
    const conditions = [isNull(clientes.deletedAt)];
    if (searchFilter) {
      conditions.push(ilike(clientes.empresa, `%${searchFilter}%`));
    }
    if (mainCompanyId) {
      conditions.push(eq(clientes.mainCompanyId, mainCompanyId));
    }
    return await db
      .select()
      .from(clientes)
      .where(and(...conditions))
      .orderBy(asc(clientes.empresa));
  }

  async createCliente(
    data: InsertCliente,
    mainCompanyId: number,
  ): Promise<Cliente> {
    const [cliente] = await db
      .insert(clientes)
      .values({ ...data, mainCompanyId })
      .returning();
    return cliente;
  }

  async updateCliente(
    id: number,
    data: InsertCliente,
    mainCompanyId?: number,
  ): Promise<Cliente | null> {
    const conditions = [eq(clientes.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(clientes.mainCompanyId, mainCompanyId));
    }
    const [cliente] = await db
      .update(clientes)
      .set(data)
      .where(and(...conditions))
      .returning();
    return cliente || null;
  }

  async deleteCliente(id: number, mainCompanyId?: number): Promise<boolean> {
    const conditions = [eq(clientes.id, id)];
    if (mainCompanyId) {
      conditions.push(eq(clientes.mainCompanyId, mainCompanyId));
    }

    const positionsCount = await db
      .select({ count: count() })
      .from(positions)
      .where(eq(positions.clienteId, id));

    let result;
    if (positionsCount[0].count > 0) {
      result = await db
        .update(clientes)
        .set({ deletedAt: new Date() })
        .where(and(...conditions));
    } else {
      result = await db.delete(clientes).where(and(...conditions));
    }
    return (result.rowCount ?? 0) > 0;
  }
}
