import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { validateEmail, checkRateLimit } from '@/lib/otp';
import { isDisposableEmail } from '@/lib/disposable-emails';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.discord_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed.' },
        { status: 400 }
      );
    }

    const rateLimited = await checkRateLimit(email);
    if (rateLimited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Send OTP via Supabase Auth (8-digit code)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      console.error('Supabase OTP error:', otpError);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Store email and timestamp in our tracking table for rate limiting
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: dbError } = await supabase.from('otps').insert({
      email,
      otp: 'supabase-auth', // Placeholder since Supabase Auth manages the actual OTP
      discord_id: session.discord_id,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error('Supabase tracking error:', dbError);
      // Don't fail the request if tracking fails, OTP was already sent
    }

    console.log('OTP sent successfully via Supabase Auth to:', email);

    // Store email in session
    session.email = email;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
