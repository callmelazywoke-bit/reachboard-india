import { createServerClient } from '@supabase/ssr';
import type { cookies as cookiesFn } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client scoped to the current request's authenticated
 * user. Uses @supabase/ssr's createServerClient which reads the auth cookies
 * set by the browser client, so RLS policies see a non-NULL auth.uid().
 *
 * Returns null when no valid session cookie is present.
 */
export function createServerSupabase(cookieStore: ReturnType<typeof cookiesFn>) {
  try {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component, cookies are read-only. setAll is a no-op
          // here; the browser client handles cookie writes client-side.
          // In Route Handlers, we could set them, but we don't need to.
        },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Returns the authenticated user's id for the current request, or null.
 */
export async function getAuthenticatedUserId(cookieStore: ReturnType<typeof cookiesFn>): Promise<string | null> {
  const client = createServerSupabase(cookieStore);
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
