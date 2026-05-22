import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { assignRole, removeRole } from '@/lib/discord';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.discord_id || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp } = await request.json();

    if (!otp || typeof otp !== 'string' || otp.length !== 8) {
      return NextResponse.json(
        { error: 'Invalid OTP format.' },
        { status: 400 }
      );
    }

    // Verify OTP using Supabase Auth
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: session.email,
      token: otp,
      type: 'email',
    });

    if (verifyError || !verifyData.user) {
      console.error('OTP verification error:', verifyError);
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    console.log('OTP verified successfully for:', session.email);

    // Mark OTP as verified in our tracking table
    await supabase
      .from('otps')
      .update({ verified: true })
      .eq('discord_id', session.discord_id)
      .eq('email', session.email)
      .eq('verified', false);

    // Assign roles
    try {
      await assignRole(session.discord_id, process.env.VERIFIED_ROLE_ID!);
      await assignRole(session.discord_id, process.env.EXPLORER_ROLE_ID!);
      await removeRole(session.discord_id, process.env.UNVERIFIED_ROLE_ID!);
      await removeRole(session.discord_id, process.env.VERIFICATION_PENDING_ROLE_ID!);
    } catch (roleError) {
      console.error('Role assignment error:', roleError);
      return NextResponse.json(
        { error: 'Verification succeeded but role assignment failed. Please contact an admin.', type: 'role_error' },
        { status: 500 }
      );
    }

    // Store verified user record
    await supabase.from('users').upsert({
      discord_id: session.discord_id,
      discord_username: session.discord_username,
      email: session.email,
      verified: true,
      verified_at: new Date().toISOString(),
      role_assigned: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
