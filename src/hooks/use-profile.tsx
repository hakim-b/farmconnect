import { useUser } from '@clerk/expo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { authedSupabase } from '@/lib/supabase';
import { clearPendingRole } from '@/lib/pending-role';
import type { Profile, UserRole } from '@/lib/types';

type ProfileValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveRole: (role: UserRole) => Promise<Profile>;
  isSignedIn: boolean;
};

const ProfileContext = createContext<ProfileValue | null>(null);

/**
 * One shared profile fetch for the whole app. Screens read the same state,
 * so saving a role updates everyone at once — no per-screen refetch races.
 */
export function ProfileProvider({ children }: PropsWithChildren) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await authedSupabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (queryError) {
      setError(queryError.message);
    } else {
      setError(null);
      setProfile((data as Profile | null) ?? null);
    }
    setLoading(false);
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRole = useCallback(
    async (role: UserRole) => {
      if (!user || !userId) {
        throw new Error('Still signing you in — please try again in a moment.');
      }
      const payload = {
        clerk_user_id: userId,
        role,
        display_name:
          user.fullName ??
          user.firstName ??
          user.primaryEmailAddress?.emailAddress ??
          'FarmConnect member',
        avatar_url: user.imageUrl ?? null,
      };
      // upsert so a retry (or a bounce back to role-select) can't fail on a
      // duplicate clerk_user_id.
      const { data, error: saveError } = await authedSupabase
        .from('profiles')
        .upsert(payload, { onConflict: 'clerk_user_id' })
        .select()
        .single();
      if (saveError) throw saveError;
      const row = data as Profile;
      setProfile(row);
      void clearPendingRole();
      return row;
    },
    [user, userId],
  );

  const value = useMemo<ProfileValue>(
    () => ({
      profile,
      loading: !isLoaded || loading,
      error,
      refresh,
      saveRole,
      isSignedIn: Boolean(isSignedIn),
    }),
    [profile, isLoaded, loading, error, refresh, saveRole, isSignedIn],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
