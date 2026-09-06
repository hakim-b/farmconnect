import { getClerkInstance } from '@clerk/expo';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY. Add them to .env.local.',
  );
}

type AccessToken = () => Promise<string | null>;

async function clerkToken(): Promise<string | null> {
  try {
    return (await getClerkInstance()?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

/**
 * App-wide authenticated client. Its reference is STABLE for the life of the
 * app — the Clerk token is fetched fresh on every request via `accessToken`,
 * so the client never needs to be re-created when the session changes.
 * Re-creating it on every render is what caused the onboarding screens to loop.
 */
export const authedSupabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  accessToken: clerkToken,
});

/** Anonymous client for public reads. */
export const publicSupabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** @deprecated Use `authedSupabase`. Kept for compatibility. */
export function createClerkSupabaseClient(accessToken: AccessToken): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, { accessToken });
}
