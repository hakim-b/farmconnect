import { useAuth, useUser } from '@clerk/expo';
import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { startHostedAuth } = useHostedAuth();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.four }]}>
      <ThemedText type="title" style={styles.title}>
        Profile
      </ThemedText>

      {!isLoaded ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : isSignedIn ? (
        <View style={styles.body}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView name="person.fill" size={36} tintColor={theme.primary} />
          </View>
          <ThemedText type="heading">
            {user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? 'Signed in'}
          </ThemedText>
          {user?.primaryEmailAddress?.emailAddress ? (
            <ThemedText type="small" themeColor="textSecondary">
              {user.primaryEmailAddress.emailAddress}
            </ThemedText>
          ) : null}

          <View style={styles.menu}>
            <MenuRow icon="heart" label="Saved farms" />
            <MenuRow icon="clock" label="Order history" />
            <MenuRow icon="tray.full" label="Switch to vendor app" />
          </View>

          <Button label="Sign out" onPress={() => signOut()} variant="outline" />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView name="leaf.fill" size={36} tintColor={theme.primary} />
          </View>
          <ThemedText type="heading">Welcome to FarmConnect</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.blurb}>
            Sign in to buy produce, book slaughter appointments, and save your favourite farms.
          </ThemedText>
          <Button label="Sign in" onPress={() => startHostedAuth({ mode: 'sign-in' })} />
          <Button
            label="Create an account"
            onPress={() => startHostedAuth({ mode: 'sign-up' })}
            variant="outline"
          />
        </View>
      )}
    </ThemedView>
  );
}

function MenuRow({
  icon,
  label,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.menuRow, { borderColor: theme.border }]}>
      <SymbolView name={icon} size={16} tintColor={theme.textSecondary} />
      <ThemedText type="small" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      <SymbolView name="chevron.right" size={12} tintColor={theme.textSecondary} />
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = 'filled',
}: {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outline';
}) {
  const theme = useTheme();
  const filled = variant === 'filled';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: filled ? theme.primary : theme.surface,
          borderColor: filled ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: filled ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  title: {
    marginBottom: Spacing.four,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  blurb: {
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: Spacing.two,
  },
  menu: {
    alignSelf: 'stretch',
    marginVertical: Spacing.three,
    gap: Spacing.two,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
});
