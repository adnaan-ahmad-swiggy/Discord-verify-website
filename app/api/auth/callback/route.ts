import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/error-page?type=oauth_error`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/error-page?type=oauth_error`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/error-page?type=oauth_error`);
    }

    const user = await userResponse.json();

    // Create session
    const session = await getSession();
    session.discord_id = user.id;
    session.discord_username = user.username;
    session.discord_avatar = user.avatar || '';
    session.access_token = accessToken;
    await session.save();

    return NextResponse.redirect(`${baseUrl}/`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/error-page?type=oauth_error`);
  }
}
