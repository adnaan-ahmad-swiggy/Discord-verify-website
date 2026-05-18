import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getSession();
    if (!session.discord_id || !session.email) {
      return NextResponse.json({ error: 'Session expired. Please start over.' }, { status: 401 });
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: session.email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      console.error('Supabase resend OTP error:', otpError);
      if (otpError.message.includes('rate')) {
        return NextResponse.json(
          { error: 'Too many attempts. Please wait before trying again.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: 'Failed to resend code.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
