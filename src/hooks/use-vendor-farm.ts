import { useCallback, useEffect, useState } from 'react';

import { useProfile } from '@/hooks/use-profile';
import { useSupabase } from '@/hooks/use-supabase';
import type { Farm } from '@/lib/types';

export function useVendorFarm() {
  const { profile, loading: profileLoading } = useProfile();
  const supabase = useSupabase();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile) {
      setFarm(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('farms')
      .select('*, farm_certifications(*)')
      .eq('owner_profile_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    setFarm((data as Farm | null) ?? null);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { farm, loading: profileLoading || loading, refresh, profile, supabase };
}
