import { Pool } from 'pg';
import { drizzle, NodePgClient } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import { env } from './config/env'; // Import the validated env

export const pool = new Pool({ connectionString: env.DATABASE_URL }); // Use the validated DATABASE_URL
export const db = drizzle(pool as unknown as NodePgClient, { schema });
