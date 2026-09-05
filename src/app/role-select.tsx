import { useAuth } from "@clerk/expo";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LoadingScreen, Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import type { UserRole } from "@/lib/types";

export default function RoleSelectScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { profile, loading, saveRole } = useProfile();
  const router = useRouter();
  const [saving, setSaving] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect href="/welcome" />;
  if (profile && !saving) {
    return (
      <Redirect
        href={profile.role === "vendor" ? "/(vendor)" : "/(customer)"}
      />
    );
  }

  async function choose(role: UserRole) {
    setSaving(role);
    setError(null);
    try {
      await saveRole(role);
      router.replace(role === "vendor" ? "/(vendor)" : "/(customer)");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not save your role. Check the Supabase and Clerk configuration.",
      );
      setSaving(null);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <ThemedText type="subtitle">How will you use FarmConnect?</ThemedText>
        <ThemedText themeColor="textSecondary">
          You can switch later from your dashboard. This decides which home
          screen you see first.
        </ThemedText>
      </View>

      <Pressable onPress={() => choose("customer")} disabled={saving !== null}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Customer</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Buy produce and meats, book slaughter appointments, and find farm
            activities.
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Pressable onPress={() => choose("vendor")} disabled={saving !== null}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Vendor / Farmer</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            List your farm, manage inventory, and schedule customer bookings.
          </ThemedText>
        </ThemedView>
      </Pressable>

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    paddingTop: Spacing.six,
    marginBottom: Spacing.two,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  error: {
    color: "#B42318",
  },
});
