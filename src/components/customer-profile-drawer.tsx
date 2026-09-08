import { useAuth } from "@/hooks/use-auth";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Button } from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Radius, Spacing } from "@/constants/theme";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { pickPhoto, uploadItemPhoto } from "@/lib/upload-photo";

function splitName(
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
  } | null,
) {
  if (profile?.first_name != null || profile?.last_name != null) {
    return { first: profile.first_name ?? "", last: profile.last_name ?? "" };
  }
  const parts = (profile?.display_name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

function initials(first: string, last: string, fallback: string) {
  const a = first.trim()[0] ?? fallback.trim()[0] ?? "?";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase();
}

/**
 * Round profile button for the customer home header. Tapping it slides a
 * profile panel in from the right: profile photo, first / last name, sign out.
 */
export function CustomerProfileButton() {
  const theme = useTheme();
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);

  const name = splitName(profile);
  const label = initials(name.first, name.last, profile?.display_name ?? "FC");

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Open your profile"
        style={({ pressed }) => [
          styles.trigger,
          { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {profile?.avatar_url ? (
          <Image
            source={profile.avatar_url}
            style={styles.triggerImage}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.triggerFallback,
              { backgroundColor: theme.backgroundSelected },
            ]}
          >
            <ThemedText type="smallBold">{label}</ThemedText>
          </View>
        )}
      </Pressable>
      <ProfileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProfileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();

  const panelW = Math.min(360, Math.round(width * 0.86));
  const [anim] = useState(() => new Animated.Value(0)); // 0 hidden, 1 shown
  const [mounted, setMounted] = useState(open);

  const saved = useMemo(() => splitName(profile), [profile]);
  const [first, setFirst] = useState(saved.first);
  const [last, setLast] = useState(saved.last);
  const [busy, setBusy] = useState<null | "photo" | "name">(null);
  const [note, setNote] = useState<string | null>(null);

  // Re-sync the fields whenever the panel opens or the profile changes underneath.
  useEffect(() => {
    if (open) {
      setFirst(saved.first);
      setLast(saved.last);
      setNote(null);
    }
  }, [open, saved.first, saved.last]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [panelW, 0],
  });
  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  const changePhoto = async (source: "camera" | "library") => {
    if (busy) return;
    setBusy("photo");
    setNote(null);
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      const url = await uploadItemPhoto(uri);
      await updateProfile({ avatarUrl: url });
      setNote("Photo updated.");
    } catch (err) {
      Alert.alert(
        "Could not update photo",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  const saveName = async () => {
    if (busy) return;
    if (!first.trim()) {
      setNote("Enter your first name.");
      return;
    }
    setBusy("name");
    setNote(null);
    try {
      await updateProfile({ firstName: first, lastName: last });
      setNote("Saved.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  };

  const dirty =
    first.trim() !== saved.first.trim() || last.trim() !== saved.last.trim();

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.panelWrap,
            { width: panelW, transform: [{ translateX }] },
          ]}
        >
          <ThemedView type="surface" style={styles.panel}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Your profile</ThemedText>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityLabel="Close"
              >
                <SymbolView
                  name="xmark"
                  size={18}
                  tintColor={theme.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.avatarBlock}>
                {profile?.avatar_url ? (
                  <Image
                    source={profile.avatar_url}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarFallback,
                      { backgroundColor: theme.backgroundSelected },
                    ]}
                  >
                    <SymbolView
                      name="person.fill"
                      size={36}
                      tintColor={theme.textSecondary}
                    />
                  </View>
                )}
                {busy === "photo" ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : null}
              </View>

              <View style={styles.photoButtons}>
                <Pressable
                  onPress={() => changePhoto("camera")}
                  disabled={busy != null}
                  style={[
                    styles.photoBtn,
                    { borderColor: theme.border, opacity: busy ? 0.5 : 1 },
                  ]}
                >
                  <SymbolView
                    name="camera.fill"
                    size={16}
                    tintColor={theme.primary}
                  />
                  <ThemedText type="small">Camera</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => changePhoto("library")}
                  disabled={busy != null}
                  style={[
                    styles.photoBtn,
                    { borderColor: theme.border, opacity: busy ? 0.5 : 1 },
                  ]}
                >
                  <SymbolView
                    name="photo.on.rectangle"
                    size={16}
                    tintColor={theme.primary}
                  />
                  <ThemedText type="small">
                    {profile?.avatar_url ? "Change photo" : "Add photo"}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">First name</ThemedText>
                <TextInput
                  value={first}
                  onChangeText={setFirst}
                  placeholder="First name"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold">Last name</ThemedText>
                <TextInput
                  value={last}
                  onChangeText={setLast}
                  placeholder="Last name"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                    },
                  ]}
                />
              </View>

              <Button
                size="md"
                isDisabled={busy != null || !dirty}
                style={{ backgroundColor: theme.primary }}
                onPress={saveName}
              >
                {busy === "name" ? "Saving…" : "Save name"}
              </Button>

              {note ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.note}
                >
                  {note}
                </ThemedText>
              ) : null}

              <View
                style={[styles.divider, { backgroundColor: theme.border }]}
              />

              <Button size="md" variant="secondary" onPress={() => signOut()}>
                Sign out
              </Button>
            </ScrollView>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  triggerImage: { width: "100%", height: "100%" },
  triggerFallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  root: { flex: 1 },
  backdrop: { backgroundColor: "#000" },
  panelWrap: { position: "absolute", top: 0, bottom: 0, right: 0 },
  panel: {
    flex: 1,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.four,
    paddingBottom: Spacing.two,
  },
  body: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },

  avatarBlock: { alignSelf: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  photoButtons: { flexDirection: "row", gap: Spacing.two },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    minHeight: 44,
  },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 48,
  },
  note: { textAlign: "center" },
  divider: { height: 1, marginVertical: Spacing.two },
});
