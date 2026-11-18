import { z } from 'zod';

const DEV_JWT_SECRET = 'dev-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().default('memory'),
    JWT_SECRET: z.string().min(1).default(DEV_JWT_SECRET),
    JWT_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
    CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
    SEED_DEMO: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.JWT_SECRET !== DEV_JWT_SECRET, {
    message: 'JWT_SECRET must be set in production',
    path: ['JWT_SECRET'],
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.MONGODB_URI !== 'memory', {
    message: 'MONGODB_URI must point to a real database in production',
    path: ['MONGODB_URI'],
  });

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
