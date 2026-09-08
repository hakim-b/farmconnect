import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Provider, Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const authRedirectTo = makeRedirectUri({ path: 'auth' });

export type OAuthProvider = Extract<Provider, 'google' | 'facebook'>;

function metaString(user: User | null, ...keys: string[]): string | null {
  const meta = user?.user_metadata ?? {};
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Name, email, and avatar from a Supabase Auth user (email or OAuth). */
export function identityFromUser(user: User | null) {
  const full = metaString(user, 'full_name', 'name');
  const first = metaString(user, 'given_name', 'first_name') ?? full?.split(/\s+/)[0] ?? null;
  const last = metaString(user, 'family_name', 'last_name') ?? null;
  return {
    full,
    first,
    last,
    email: user?.email ?? null,
    avatar: metaString(user, 'avatar_url', 'picture'),
  };
}

export async function createSessionFromUrl(url: string): Promise<Session | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const code = params.code;
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (code) {
    const { data: existing } = await supabase.auth.getSession();
    if (existing.session) return existing.session;
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  const redirectTo = authRedirectTo;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });
  if (error) throw error;
  if (Platform.OS === 'web') return;

  const result = await WebBrowser.openAuthSessionAsync(data.url ?? '', redirectTo);
  if (result.type === 'success') {
    await createSessionFromUrl(result.url);
  }
}

/** Complete email-confirm / recovery / OAuth redirects that open the app. */
export function subscribeToAuthUrls(onError?: (err: unknown) => void) {
  const handle = (url: string | null) => {
    if (!url) return;
    void createSessionFromUrl(url).catch((err) => onError?.(err));
  };

  void Linking.getInitialURL().then(handle);
  const sub = Linking.addEventListener('url', ({ url }) => handle(url));
  return () => sub.remove();
}
