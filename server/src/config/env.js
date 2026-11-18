import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/spendfetti'),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
