import { createClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface InstagramProfile {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
}

/**
 * Deterministic synthetic email for an Instagram account. Re-linking the
 * same Instagram account always resolves to the same Supabase Auth user.
 */
function syntheticEmailForInstagramId(igId: string): string {
  return `ig_${igId}@reachboard.oauth`;
}

/**
 * Creates or links a Supabase Auth user for an Instagram-verified creator,
 * then upserts a `profiles` row with role='creator' and links the creator_id.
 *
 * Returns the Supabase Auth user id, or null on failure.
 */
export async function linkInstagramToSupabaseAuth(
  igProfile: InstagramProfile,
  creatorId: string
): Promise<string | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const syntheticEmail = syntheticEmailForInstagramId(igProfile.id);

  try {
    // Look up existing user by email. listUsersByQuery is not available in
    // all Supabase versions, so we search the first page of users.
    // The synthetic email is deterministic, so we can also try to create
    // and handle the "already exists" case.
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        display_name: igProfile.name || igProfile.username,
        role: 'creator',
        provider: 'instagram',
        instagram_id: igProfile.id,
      },
    });

    if (createError) {
      // User likely already exists — find them by email
      if (createError.message.includes('already') || createError.message.includes('registered')) {
        const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === syntheticEmail);
        if (existing) {
          // Update user_metadata and continue
          await admin.auth.admin.updateUserById(existing.id, {
            user_metadata: {
              display_name: igProfile.name || igProfile.username,
              role: 'creator',
              provider: 'instagram',
              instagram_id: igProfile.id,
            },
          });
          return await upsertProfileAndReturn(admin, existing.id, igProfile, creatorId);
        }
      }
      console.error('Failed to create auth user for Instagram:', createError);
      return null;
    }

    if (!newUser || !newUser.user) return null;
    return await upsertProfileAndReturn(admin, newUser.user.id, igProfile, creatorId);
  } catch (err) {
    console.error('linkInstagramToSupabaseAuth failed:', err);
    return null;
  }
}

async function upsertProfileAndReturn(
  admin: ReturnType<typeof getAdminClient>,
  authUserId: string,
  igProfile: InstagramProfile,
  creatorId: string
): Promise<string> {
  const { error: profileError } = await admin!.from('profiles').upsert(
    {
      id: authUserId,
      role: 'creator',
      display_name: igProfile.name || igProfile.username,
      creator_id: creatorId,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('Profile upsert failed:', profileError);
  }

  return authUserId;
}

/**
 * Mints a real Supabase session for an OAuth-linked user by temporarily
 * setting a known password, signing in with it, then resetting the password
 * to a random value. The session tokens are set as standard Supabase auth
 * cookies on the response.
 *
 * Returns true on success.
 */
export async function setSessionCookiesForUser(
  response: NextResponse,
  igId: string
): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;

  const syntheticEmail = syntheticEmailForInstagramId(igId);
  const tempPassword = crypto.randomUUID() + crypto.randomUUID();

  try {
    // Find the user by email.
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = listData?.users?.find((u) => u.email === syntheticEmail);
    if (!user) {
      console.error('User not found for session minting:', syntheticEmail);
      return false;
    }

    // Set a temporary known password.
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });
    if (updateError) {
      console.error('Failed to set temp password:', updateError);
      return false;
    }

    // Sign in with the temp password to get a real session.
    const anon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      email: syntheticEmail,
      password: tempPassword,
    });

    // Reset the password to random immediately.
    await admin.auth.admin.updateUserById(user.id, {
      password: crypto.randomUUID() + crypto.randomUUID(),
    });

    if (signInError || !signInData.session) {
      console.error('Temp sign-in failed:', signInError);
      return false;
    }

    const session = signInData.session;
    const ref = new URL(supabaseUrl).hostname.split('.')[0];
    const cookieName = `sb-${ref}-auth-token`;

    const cookieValue = btoa(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: session.user,
      })
    );

    response.cookies.set(cookieName, cookieValue, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return true;
  } catch (err) {
    console.error('setSessionCookiesForUser failed:', err);
    return false;
  }
}
