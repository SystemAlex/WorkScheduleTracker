import { db } from '../db';
import { positions, type Position, type InsertPosition } from '@shared/schema';

export class PositionStorage {
  async getPositions(): Promise<Position[]> {
    return await db.select().from(positions);
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }
}
