export interface Config {
  port: number;
  databasePath: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
  paymentApiUrl: string;
  paymentApiKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const sessionSecret = env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is required');
  }
  return {
    port: Number(env.PORT ?? 3000),
    databasePath: env.DATABASE_PATH ?? 'shopkit.db',
    sessionSecret,
    sessionTtlSeconds: Number(env.SESSION_TTL_SECONDS ?? 60 * 60 * 24),
    paymentApiUrl: env.PAYMENT_API_URL ?? 'https://payments.example.com',
    paymentApiKey: env.PAYMENT_API_KEY ?? '',
  };
}
