import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { pickPhoto, uploadItemPhoto } from "@/lib/upload-photo";

/**
 * Add several photos, one at a time. The first photo is the cover (used as the
 * farm card thumbnail). Order is add-order; tap a photo to remove it.
 */
export function PhotosField({
  value,
  onChange,
  max = 5,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const add = async (source: "camera" | "library") => {
    if (busy || value.length >= max) return;
    setBusy(true);
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      const url = await uploadItemPhoto(uri);
      onChange([...value, url]);
    } catch (err) {
      Alert.alert(
        "Could not add the photo",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <View style={styles.wrap}>
      {value.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {value.map((url, index) => (
            <Pressable
              key={url}
              onPress={() => remove(url)}
              style={styles.thumbWrap}
            >
              <Image
                source={url}
                style={styles.thumb}
                contentFit="cover"
                transition={150}
              />
              {index === 0 ? (
                <View
                  style={[styles.coverTag, { backgroundColor: theme.primary }]}
                >
                  <ThemedText type="small" style={styles.coverText}>
                    Cover
                  </ThemedText>
                </View>
              ) : null}
              <View style={styles.removeDot}>
                <SymbolView name="xmark" size={11} tintColor="#fff" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.placeholder,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          <SymbolView
            name="photo.on.rectangle"
            size={30}
            tintColor={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary">
            No photos yet
          </ThemedText>
        </View>
      )}

      {value.length < max ? (
        <View style={styles.buttons}>
          {Platform.OS === "web" ? (
            <Pressable
              onPress={() => add("library")}
              disabled={busy}
              style={[
                styles.btn,
                { borderColor: theme.border, opacity: busy ? 0.5 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <SymbolView
                  name="photo.on.rectangle"
                  size={18}
                  tintColor={theme.primary}
                />
              )}
              <ThemedText type="smallBold">Upload photo</ThemedText>
            </Pressable>
          ) : null}
          {Platform.OS !== "web" ? (
            <>
              <Pressable
                onPress={() => add("camera")}
                disabled={busy}
                style={[
                  styles.btn,
                  { borderColor: theme.border, opacity: busy ? 0.5 : 1 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <SymbolView
                      name="camera.fill"
                      size={18}
                      tintColor={theme.primary}
                    />
                    <ThemedText type="smallBold">Take a photo</ThemedText>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={() => add("library")}
                disabled={busy}
                style={[
                  styles.btn,
                  { borderColor: theme.border, opacity: busy ? 0.5 : 1 },
                ]}
              >
                <SymbolView
                  name="photo.on.rectangle"
                  size={18}
                  tintColor={theme.primary}
                />
                <ThemedText type="smallBold">Choose a photo</ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        {value.length > 0
          ? `${value.length} of ${max} · tap a photo to remove it`
          : `Add up to ${max}. The first one is your cover photo.`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  thumbWrap: { width: 128, height: 128 },
  thumb: { width: "100%", height: "100%", borderRadius: Radius.md },
  coverTag: {
    position: "absolute",
    left: Spacing.one,
    bottom: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
  },
  coverText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  removeDot: {
    position: "absolute",
    top: Spacing.one,
    right: Spacing.one,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 5 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  buttons: { flexDirection: "row", gap: Spacing.two },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
});
