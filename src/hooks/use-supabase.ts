import { useSession } from "@clerk/expo";
import { useMemo } from "react";

import { createClerkSupabaseClient, publicSupabase } from "@/lib/supabase";

export function useSupabase() {
  const { session } = useSession();

  return useMemo(
    () =>
      createClerkSupabaseClient(async () => {
        if (!session) return null;
        return session.getToken();
      }),
    [session],
  );
}

export function usePublicSupabase() {
  return publicSupabase;
}
