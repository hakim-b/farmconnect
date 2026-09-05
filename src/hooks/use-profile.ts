import { useUser } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';

import { useSupabase } from '@/hooks/use-supabase';
import type { Profile, UserRole } from '@/lib/types';

export function useProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user.id)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setProfile(null);
    } else {
      setError(null);
      setProfile((data as Profile | null) ?? null);
    }
    setLoading(false);
  }, [isLoaded, isSignedIn, supabase, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRole = useCallback(
    async (role: UserRole) => {
      if (!user) throw new Error('You need to sign in first.');

      const payload = {
        clerk_user_id: user.id,
        role,
        display_name:
          user.fullName ??
          user.firstName ??
          user.primaryEmailAddress?.emailAddress ??
          'FarmConnect member',
        avatar_url: user.imageUrl ?? null,
      };

      const query = profile
        ? supabase.from('profiles').update({ role }).eq('id', profile.id).select().single()
        : supabase.from('profiles').insert(payload).select().single();

      const { data, error: saveError } = await query;
      if (saveError) throw saveError;
      setProfile(data as Profile);
      return data as Profile;
    },
    [profile, supabase, user],
  );

  return {
    profile,
    loading: !isLoaded || loading,
    error,
    refresh,
    saveRole,
    isSignedIn: Boolean(isSignedIn),
  };
}
