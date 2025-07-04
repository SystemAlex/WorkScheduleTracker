import { db } from '../db';
import { positions, shifts, type Position, type InsertPosition } from '@shared/schema';
import { asc, ilike, eq, isNull, count, and } from 'drizzle-orm';

export class PositionStorage {
  async getPositions(nameFilter?: string): Promise<Position[]> {
    const conditions = [isNull(positions.deletedAt)];
    if (nameFilter) {
      conditions.push(ilike(positions.name, `%${nameFilter}%`));
    }
    return await db.select().from(positions).where(and(...conditions)).orderBy(asc(positions.name));
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updatePosition(id: number, data: InsertPosition): Promise<Position> {
    const [position] = await db
      .update(positions)
      .set(data)
      .where(eq(positions.id, id))
      .returning();
    return position;
  }

  async deletePosition(id: number): Promise<void> {
    // Check if there are any shifts associated with this position
    const shiftsCount = await db
      .select({ count: count() })
      .from(shifts)
      .where(eq(shifts.positionId, id));

    if (shiftsCount[0].count > 0) {
      // If there are associated shifts, perform a soft delete
      await db.update(positions).set({ deletedAt: new Date() }).where(eq(positions.id, id));
    } else {
      // If no associated shifts, perform a hard delete
      await db.delete(positions).where(eq(positions.id, id));
    }
  }
}