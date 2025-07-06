import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // Add other environment variables here as they become necessary
});

// Validate process.env against the schema
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const validationError = fromZodError(parsedEnv.error);
  console.error('❌ Invalid environment variables:', validationError.message);
  process.exit(1);
}

export const env = parsedEnv.data;
