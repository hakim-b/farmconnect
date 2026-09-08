import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

import { subscribeToAuthUrls } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AuthValue = {
  session: Session | null;
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoaded(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setIsLoaded(true);
    });

    const unsubscribeUrls =
      Platform.OS === 'web'
        ? null
        : subscribeToAuthUrls((err) => {
            console.warn('[auth] could not complete sign-in from link', err);
          });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      unsubscribeUrls?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user,
      isLoaded,
      isSignedIn: Boolean(session),
      signOut,
    }),
    [session, user, isLoaded, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
