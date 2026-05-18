import { supabase } from './supabase';

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length === 0) return false;
  if (!domain || !domain.includes('.')) return false;
  const domainParts = domain.split('.');
  if (domainParts.some((p) => p.length === 0)) return false;
  return true;
}

export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

export async function checkRateLimit(email: string): Promise<boolean> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('otps')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', tenMinutesAgo);

  return (count ?? 0) >= 3;
}

export function validateOTP(
  submitted: string,
  stored: string,
  expiresAt: Date
): { valid: boolean; expired: boolean } {
  const now = new Date();
  if (now >= expiresAt) {
    return { valid: false, expired: true };
  }
  if (submitted !== stored) {
    return { valid: false, expired: false };
  }
  return { valid: true, expired: false };
}
