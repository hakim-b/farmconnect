import { useCallback, useEffect, useState } from 'react';

import { useProfile } from '@/hooks/use-profile';
import { useSupabase } from '@/hooks/use-supabase';
import type { Farm } from '@/lib/types';

export function useVendorFarm() {
  const { profile, loading: profileLoading } = useProfile();
  const supabase = useSupabase();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const profileId = profile?.id;

  const refresh = useCallback(async () => {
    if (!profileId) {
      setFarm(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('farms')
      .select('*, farm_certifications(*)')
      .eq('owner_profile_id', profileId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    setFarm((data as Farm | null) ?? null);
    setLoading(false);
    // key on the primitive id, not the profile object (its ref changes on
    // every useProfile refetch) — otherwise this loops.
  }, [profileId, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { farm, loading: profileLoading || loading, refresh, profile, supabase };
}
