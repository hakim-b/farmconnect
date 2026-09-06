import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickPhoto, uploadItemPhoto } from '@/lib/upload-photo';

export function PhotoField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);

  const add = async (source: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      const url = await uploadItemPhoto(uri);
      onChange(url);
    } catch (err) {
      Alert.alert(
        'Could not add the photo',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <ThemedText type="smallBold">Photo</ThemedText>

      {value ? (
        <View>
          <Image source={value} style={styles.preview} contentFit="cover" transition={150} />
          {busy ? (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.placeholder, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          {busy ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <SymbolView name="photo" size={32} tintColor={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                No photo yet
              </ThemedText>
            </>
          )}
        </View>
      )}

      <View style={styles.buttons}>
        <Pressable
          onPress={() => add('camera')}
          disabled={busy}
          style={[styles.btn, { borderColor: theme.border, opacity: busy ? 0.5 : 1 }]}>
          <SymbolView name="camera.fill" size={18} tintColor={theme.primary} />
          <ThemedText type="smallBold">Take a photo</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => add('library')}
          disabled={busy}
          style={[styles.btn, { borderColor: theme.border, opacity: busy ? 0.5 : 1 }]}>
          <SymbolView name="photo.on.rectangle" size={18} tintColor={theme.primary} />
          <ThemedText type="smallBold">Choose a photo</ThemedText>
        </Pressable>
      </View>

      {value && !busy ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          onPress={() => onChange(null)}
          style={styles.remove}>
          Remove photo
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: Radius.md,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  remove: {
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
  },
});
