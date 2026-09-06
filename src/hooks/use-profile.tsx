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
import { toError } from '@/lib/errors';
import { clearPendingRole } from '@/lib/pending-role';
import type { Profile, UserRole } from '@/lib/types';

type ProfileValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveRole: (role: UserRole, displayName?: string) => Promise<Profile>;
  updateProfile: (patch: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  }) => Promise<Profile>;
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
      console.error('[useProfile] load failed:', queryError);
      setError(toError(queryError).message);
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
    async (role: UserRole, displayName?: string) => {
      if (!user || !userId) {
        throw new Error('Still signing you in — please try again in a moment.');
      }
      const payload = {
        clerk_user_id: userId,
        role,
        display_name:
          displayName?.trim() ||
          user.fullName ||
          user.firstName ||
          user.primaryEmailAddress?.emailAddress ||
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
      if (saveError) {
        console.error('[useProfile] saveRole failed:', saveError);
        throw toError(saveError);
      }
      const row = data as Profile;
      setProfile(row);
      void clearPendingRole();
      return row;
    },
    [user, userId],
  );

  const updateProfile = useCallback(
    async (patch: { firstName?: string; lastName?: string; avatarUrl?: string | null }) => {
      if (!userId) {
        throw new Error('Still signing you in — please try again in a moment.');
      }
      const first = (patch.firstName ?? profile?.first_name ?? '').trim();
      const last = (patch.lastName ?? profile?.last_name ?? '').trim();

      const payload: Record<string, unknown> = {};
      if (patch.firstName !== undefined) payload.first_name = first || null;
      if (patch.lastName !== undefined) payload.last_name = last || null;
      if (patch.avatarUrl !== undefined) payload.avatar_url = patch.avatarUrl;
      if (patch.firstName !== undefined || patch.lastName !== undefined) {
        payload.display_name =
          `${first} ${last}`.trim() || profile?.display_name || 'FarmConnect member';
      }

      const { data, error: saveError } = await authedSupabase
        .from('profiles')
        .update(payload)
        .eq('clerk_user_id', userId)
        .select()
        .single();
      if (saveError) {
        console.error('[useProfile] updateProfile failed:', saveError);
        throw toError(saveError);
      }
      const row = data as Profile;
      setProfile(row);
      return row;
    },
    [userId, profile],
  );

  const value = useMemo<ProfileValue>(
    () => ({
      profile,
      loading: !isLoaded || loading,
      error,
      refresh,
      saveRole,
      updateProfile,
      isSignedIn: Boolean(isSignedIn),
    }),
    [profile, isLoaded, loading, error, refresh, saveRole, updateProfile, isSignedIn],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>');
  return ctx;
}
