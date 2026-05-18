const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_TOKEN',
  'GUILD_ID',
  'VERIFIED_ROLE_ID',
  'EXPLORER_ROLE_ID',
  'UNVERIFIED_ROLE_ID',
  'VERIFICATION_PENDING_ROLE_ID',
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_BASE_URL',
  'SESSION_SECRET',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}`
    );
  }
}

export function getEnv(key: (typeof requiredEnvVars)[number]): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}
