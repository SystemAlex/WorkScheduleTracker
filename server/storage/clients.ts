import { db } from '../db';
import { clientes, type Cliente, type InsertCliente } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class ClientStorage {
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
