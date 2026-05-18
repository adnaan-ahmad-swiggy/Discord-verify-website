import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { assignRole, removeRole } from '@/lib/discord';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.discord_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp } = await request.json();

    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid OTP format.' },
        { status: 400 }
      );
    }

    // Verify OTP via Supabase Auth
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: session.email!,
      token: otp,
      type: 'email',
    });

    if (verifyError) {
      console.error('OTP verify error:', verifyError);
      if (verifyError.message.includes('expired')) {
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new one.', expired: true },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

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
    const { error: dbError } = await supabase.from('users').upsert({
      discord_id: session.discord_id,
      discord_username: session.discord_username,
      email: session.email,
      verified: true,
      verified_at: new Date().toISOString(),
      role_assigned: true,
    });

    if (dbError) {
      console.error('DB error storing user:', dbError);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
