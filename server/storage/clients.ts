import { db } from '../db';
import {
  clientes,
  positions,
  type Cliente,
  type InsertCliente,
} from '@shared/schema';
import { eq, ilike, asc, isNull, count, and } from 'drizzle-orm';

export class ClientStorage {
  async getClientes(searchFilter?: string): Promise<Cliente[]> {
    const conditions = [isNull(clientes.deletedAt)];
    if (searchFilter) {
      conditions.push(ilike(clientes.empresa, `%${searchFilter}%`));
    }
    return await db
      .select()
      .from(clientes)
      .where(and(...conditions))
      .orderBy(asc(clientes.empresa));
  }

  async createCliente(data: InsertCliente): Promise<Cliente> {
    const [cliente] = await db.insert(clientes).values(data).returning();
    return cliente;
  }

  async updateCliente(
    id: number,
    data: InsertCliente,
  ): Promise<Cliente | null> {
    const [cliente] = await db
      .update(clientes)
      .set(data)
      .where(eq(clientes.id, id))
      .returning();
    return cliente || null; // Return null if no client was updated
  }

  async deleteCliente(id: number): Promise<boolean> {
    // Change return type to boolean
    // Check if there are any positions associated with this client
    const positionsCount = await db
      .select({ count: count() })
      .from(positions)
      .where(eq(positions.clienteId, id));

    let result;
    if (positionsCount[0].count > 0) {
      // If there are associated positions, perform a soft delete
      result = await db
        .update(clientes)
        .set({ deletedAt: new Date() })
        .where(eq(clientes.id, id));
    } else {
      // If no associated positions, perform a hard delete
      result = await db.delete(clientes).where(eq(clientes.id, id));
    }
    return (result.rowCount ?? 0) > 0; // Return true if a row was affected, false otherwise
  }
}
