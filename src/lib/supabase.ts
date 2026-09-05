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

export function createClerkSupabaseClient(accessToken: AccessToken): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    accessToken,
  });
}

export const publicSupabase = createClient(supabaseUrl, supabaseKey);
