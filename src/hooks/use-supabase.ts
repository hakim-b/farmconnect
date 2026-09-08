import { supabase } from '@/lib/supabase';

/** Stable, app-wide client. Carries the current Supabase Auth session when signed in. */
export function useSupabase() {
  return supabase;
}

/** Same client as `useSupabase`. Public reads work signed-out (anon) or signed-in. */
export function usePublicSupabase() {
  return supabase;
}
