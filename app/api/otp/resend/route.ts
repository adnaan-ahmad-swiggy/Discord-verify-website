import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/otp';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getSession();
    if (!session.discord_id || !session.email) {
      return NextResponse.json({ error: 'Session expired. Please start over.' }, { status: 401 });
    }

    const email = session.email;

    const rateLimited = await checkRateLimit(email);
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Resend OTP via Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      console.error('Supabase OTP error:', otpError);
      return NextResponse.json({ error: 'Failed to resend OTP.' }, { status: 500 });
    }

    // Store tracking record for rate limiting
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: dbError } = await supabase.from('otps').insert({
      email,
      otp: 'supabase-auth',
      discord_id: session.discord_id,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error('Supabase tracking error:', dbError);
      // Don't fail the request if tracking fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
