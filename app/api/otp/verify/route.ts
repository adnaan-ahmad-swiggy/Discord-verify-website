import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { validateOTP } from '@/lib/otp';
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

    // Fetch latest OTP record for this user
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otps')
      .select('*')
      .eq('discord_id', session.discord_id)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    const result = validateOTP(otp, otpRecord.otp, new Date(otpRecord.expires_at));

    if (result.expired) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.', expired: true },
        { status: 400 }
      );
    }

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

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
      email: session.email || otpRecord.email,
      verified: true,
      verified_at: new Date().toISOString(),
      role_assigned: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
