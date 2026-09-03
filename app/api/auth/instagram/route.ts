import { NextResponse } from 'next/server';
import { OAUTH_STATE_COOKIE, createOAuthState, sessionCookieOptions } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          'Instagram OAuth is not configured. Set INSTAGRAM_CLIENT_ID (your Instagram App ID from Meta) and INSTAGRAM_CLIENT_SECRET in your environment variables.',
      },
      { status: 503 }
    );
  }

  const redirectUri = 'https://reachboard-india-n1dr.bolt.host/api/auth/callback';

  const state = createOAuthState();

  const params = new URLSearchParams({
    enable_fb_login: '0',
    force_authentication: '1',
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'instagram_business_basic,instagram_business_manage_insights,instagram_business_manage_messages',
  });

  const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  // Short-lived anti-forgery token; the callback refuses any code that does not carry it back.
  response.cookies.set(OAUTH_STATE_COOKIE, state, sessionCookieOptions(600));
  return response;
}
