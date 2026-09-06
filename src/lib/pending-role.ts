import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserRole } from '@/lib/types';

const KEY = 'farmconnect.pending_role';

/** Remember the role a user picked on the welcome screen, before they sign in. */
export async function setPendingRole(role: UserRole): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, role);
  } catch {
    // storage unavailable — role-select will fall back to the picker
  }
}

/** Read the pending role without clearing it. */
export async function peekPendingRole(): Promise<UserRole | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'customer' || value === 'vendor' ? value : null;
  } catch {
    return null;
  }
}

export async function clearPendingRole(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
