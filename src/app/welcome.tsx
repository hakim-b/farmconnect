import { Redirect, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { FarmConnectMark } from "@/components/logo";
import { RoleOptionCard } from "@/components/role-cards";
import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { setPendingRole } from "@/lib/pending-role";
import type { UserRole } from "@/lib/types";

type AuthMode = "sign-in" | "sign-up";

export default function WelcomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAuth = async (mode: AuthMode) => {
    if (!role || busy) return;
    setBusy(true);
    await setPendingRole(role);
    router.push({ pathname: "/auth", params: { mode } });
    setBusy(false);
  };

  if (isLoaded && isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.hero}>
        <View style={styles.lockup}>
          <FarmConnectMark size={44} />
          <ThemedText type="title" style={styles.title}>
            FarmConnect
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={styles.kicker}>
          Local farms, one place
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lede}>
          Buy produce and meats, book slaughter appointments, and find farm
          activities — without hunting through WhatsApp groups.
        </ThemedText>
      </View>

      {!role ? (
        <View style={styles.step}>
          <ThemedText type="smallBold">First, who are you?</ThemedText>
          <RoleOptionCard role="customer" onPress={setRole} />
          <RoleOptionCard role="vendor" onPress={setRole} />
        </View>
      ) : (
        <ThemedView type="backgroundElement" style={styles.panel}>
          <View style={styles.panelHead}>
            <ThemedText type="smallBold">
              Joining as {role === "vendor" ? "a farmer" : "a customer"}
            </ThemedText>
            <Pressable
              onPress={() => setRole(null)}
              disabled={busy}
              hitSlop={8}
            >
              <ThemedText type="linkPrimary">Change</ThemedText>
            </Pressable>
          </View>
          <Button
            isDisabled={busy}
            style={{ backgroundColor: theme.primary }}
            onPress={() => void handleAuth("sign-up")}
          >
            Create an account
          </Button>
          <Button
            isDisabled={busy}
            variant="secondary"
            onPress={() => void handleAuth("sign-in")}
          >
            Sign in
          </Button>
        </ThemedView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  kicker: {
    color: "#2F6B3A",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
  },
  step: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
    marginBottom: Spacing.four,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
