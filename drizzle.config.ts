import { defineConfig } from 'drizzle-kit';
import { env } from './server/config/env'; // Import the validated env

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL, // Use the validated DATABASE_URL
  },
});
