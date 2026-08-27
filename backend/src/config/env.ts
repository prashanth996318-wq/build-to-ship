import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_ORIGIN: z.string().url('FRONTEND_ORIGIN must be a valid URL'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Environment variable validation failed:');
    result.error.errors.forEach((err) => {
      console.error(`   ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) {
    throw new Error('Environment not loaded. Call loadEnv() first.');
  }
  return env;
}
