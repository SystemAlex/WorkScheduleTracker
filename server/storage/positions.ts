import { db } from '../db';
import {
  positions,
  shifts,
  type Position,
  type InsertPosition,
} from '@shared/schema';
import { asc, ilike, eq, isNull, count, and } from 'drizzle-orm';
import { ConflictError } from '../errors'; // Import custom errors

export class PositionStorage {
  async getPositions(nameFilter?: string): Promise<Position[]> {
    const conditions = [isNull(positions.deletedAt)];
    if (nameFilter) {
      conditions.push(ilike(positions.name, `%${nameFilter}%`));
    }
    return await db
      .select()
      .from(positions)
      .where(and(...conditions))
      .orderBy(asc(positions.name));
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    try {
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
        // PostgreSQL unique violation error code
        throw new ConflictError('A position with this name already exists.');
      }
      throw error;
    }
  }

  async updatePosition(
    id: number,
    data: InsertPosition,
  ): Promise<Position | null> {
    try {
      const [position] = await db
        .update(positions)
        .set(data)
        .where(eq(positions.id, id))
        .returning();
      return position || null; // Return null if no position was updated
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        // PostgreSQL unique violation error code
        throw new ConflictError('A position with this name already exists.');
      }
      throw error;
    }
  }

  async deletePosition(id: number): Promise<boolean> {
    // Change return type to boolean
    // Check if there are any shifts associated with this position
    const shiftsCount = await db
      .select({ count: count() })
      .from(shifts)
      .where(eq(shifts.positionId, id));

    let result;
    if (shiftsCount[0].count > 0) {
      // If there are associated shifts, perform a soft delete
      result = await db
        .update(positions)
        .set({ deletedAt: new Date() })
        .where(eq(positions.id, id));
    } else {
      // If no associated shifts, perform a hard delete
      result = await db.delete(positions).where(eq(positions.id, id));
    }
    return (result.rowCount ?? 0) > 0; // Return true if a row was affected, false otherwise
  }
}
