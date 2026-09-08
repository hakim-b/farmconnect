import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Wordmark } from "@/components/logo";
import { LoadingScreen, Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  authRedirectTo,
  signInWithOAuthProvider,
  type OAuthProvider,
} from "@/lib/auth";
import { toError } from "@/lib/errors";
import { supabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <Path
        fill="#FBBC05"
        d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </Svg>
  );
}

function FacebookMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        fill="#fff"
        d="M17 9a8 8 0 1 0-9.25 7.9v-5.59H5.9V9h1.85V7.02c0-1.83 1.09-2.84 2.76-2.84.8 0 1.64.14 1.64.14v1.8h-.92c-.91 0-1.2.57-1.2 1.15V9h2.04l-.33 2.31H9.03v5.59A8 8 0 0 0 17 9Z"
      />
    </Svg>
  );
}

export default function AuthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();

  const paramMode: AuthMode = params.mode === "sign-in" ? "sign-in" : "sign-up";
  const [modeOverride, setModeOverride] = useState<AuthMode | null>(null);
  const mode = modeOverride ?? paramMode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) return <Redirect href="/" />;

  const trimmedEmail = email.trim();
  const canSubmit =
    trimmedEmail.includes("@") &&
    password.length >= 6 &&
    (mode === "sign-in" || password === confirm);

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setError(toError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () =>
    run(async () => {
      if (mode === "sign-up" && password !== confirm) {
        throw new Error("Passwords do not match.");
      }
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: { emailRedirectTo: authRedirectTo },
        });
        if (signUpError?.code === "over_email_send_rate_limit") {
          throw new Error(
            "Email delivery is temporarily rate-limited. Wait and try again, or configure custom SMTP in Supabase.",
          );
        }
        if (signUpError) throw signUpError;
        if (!data.session) {
          setPassword("");
          setConfirm("");
          setModeOverride("sign-in");
          setNotice("Check your email to confirm your account, then sign in.");
        }
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) throw signInError;
    });

  const submitOAuth = (provider: OAuthProvider) =>
    run(async () => {
      await signInWithOAuthProvider(provider);
    });

  const sendReset = () =>
    run(async () => {
      if (!trimmedEmail.includes("@")) {
        throw new Error("Enter your email first.");
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: authRedirectTo,
        },
      );
      if (resetError) throw resetError;
      setNotice("Check your email for a password reset link.");
    });

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
  ];

  return (
    <Screen>
      <View style={styles.hero}>
        <Wordmark markSize={26} style={styles.brand} />
        <ThemedText type="title">
          {mode === "sign-up" ? "Create an account" : "Welcome back"}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.lede}>
          {mode === "sign-up"
            ? "Use your email, or continue with Google or Facebook."
            : "Sign in with email, Google, or Facebook."}
        </ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={inputStyle}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete={mode === "sign-up" ? "new-password" : "password"}
          textContentType={mode === "sign-up" ? "newPassword" : "password"}
          secureTextEntry
          style={inputStyle}
        />
        {mode === "sign-up" ? (
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            style={inputStyle}
          />
        ) : (
          <Pressable
            onPress={() => void sendReset()}
            disabled={busy}
            hitSlop={8}
            style={styles.forgot}
          >
            <ThemedText type="linkPrimary">Forgot password?</ThemedText>
          </Pressable>
        )}

        <Button
          isDisabled={busy || !canSubmit}
          style={{ backgroundColor: theme.primary }}
          onPress={() => void submitEmail()}
        >
          {busy
            ? "Please wait…"
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </Button>

        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: theme.border }]} />
          <ThemedText type="small" themeColor="textSecondary">
            or
          </ThemedText>
          <View style={[styles.orLine, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          onPress={() => void submitOAuth("google")}
          disabled={busy}
          style={({ pressed }) => [
            styles.social,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
              opacity: pressed || busy ? 0.7 : 1,
            },
          ]}
        >
          <GoogleMark />
          <ThemedText type="smallBold">Continue with Google</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          onPress={() => void submitOAuth("facebook")}
          disabled={busy}
          style={({ pressed }) => [
            styles.social,
            {
              backgroundColor: "#1877F2",
              borderColor: "#1877F2",
              opacity: pressed || busy ? 0.7 : 1,
            },
          ]}
        >
          <FacebookMark />
          <ThemedText type="smallBold" style={styles.facebookLabel}>
            Continue with Facebook
          </ThemedText>
        </Pressable>
      </ThemedView>

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
      {notice ? (
        <ThemedText type="small" themeColor="textSecondary">
          {notice}
        </ThemedText>
      ) : null}

      <View style={styles.switchRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {mode === "sign-up" ? "Already have an account?" : "New here?"}
        </ThemedText>
        <Pressable
          onPress={() => {
            setModeOverride(mode === "sign-up" ? "sign-in" : "sign-up");
            setError(null);
            setNotice(null);
          }}
          hitSlop={8}
        >
          <ThemedText type="linkPrimary">
            {mode === "sign-up" ? "Sign in" : "Create an account"}
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.replace("/welcome")}
        hitSlop={8}
        style={styles.back}
      >
        <ThemedText type="linkPrimary">Back</ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: Spacing.two,
    paddingTop: Spacing.six,
    marginBottom: Spacing.two,
  },
  brand: {
    marginBottom: Spacing.two,
  },
  lede: {
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
    minHeight: 52,
  },
  forgot: {
    alignSelf: "flex-end",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  social: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  facebook: {
    backgroundColor: "#1877F2",
    borderColor: "#1877F2",
  },
  facebookLabel: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flexWrap: "wrap",
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: Spacing.four,
  },
  error: {
    color: "#B42318",
  },
});
