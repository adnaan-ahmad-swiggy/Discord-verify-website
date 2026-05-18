import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { generateOTP, checkRateLimit } from '@/lib/otp';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from('otps').insert({
      email,
      otp,
      discord_id: session.discord_id,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Swiggy Builders Club <onboarding@resend.dev>',
      to: email,
      subject: 'Your Verification Code - Swiggy Builders Club',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2>Swiggy Builders Club</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; text-align: center; background: #f4f4f4; padding: 16px; border-radius: 8px;">${otp}</h1>
          <p style="color: #666;">This code expires in 5 minutes.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend error:', JSON.stringify(emailError));
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
