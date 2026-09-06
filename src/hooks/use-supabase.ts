import { authedSupabase, publicSupabase } from '@/lib/supabase';

/** Stable, app-wide client that carries the current Clerk session token. */
export function useSupabase() {
  return authedSupabase;
}

/** Stable, app-wide anonymous client. */
export function usePublicSupabase() {
  return publicSupabase;
}
