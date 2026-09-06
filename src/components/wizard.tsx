import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Font, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type WizardShellProps = {
  step: number; // 1-based
  total: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
  children: ReactNode;
};

export function WizardShell({
  step,
  total,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextBusy = false,
  children,
}: WizardShellProps) {
  const theme = useTheme();
  const progress = Math.min(1, Math.max(0, step / total));

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
            {backLabel === 'Back' ? (
              <SymbolView name="chevron.left" size={22} tintColor={theme.text} />
            ) : null}
            <ThemedText type="smallBold">{backLabel}</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            Step {step} of {total}
          </ThemedText>
        </View>

        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[styles.fill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            {subtitle ? (
              <ThemedText style={styles.subtitle} themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
            <View style={styles.body}>{children}</View>
          </ScrollView>

          <View style={[styles.footer, { borderColor: theme.border }]}>
            <Button
              size="lg"
              isDisabled={nextDisabled || nextBusy}
              onPress={onNext}>
              {nextBusy ? 'Please wait…' : nextLabel}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** A large tappable option card — the primary control for wizard choices. */
export function BigChoice({
  title,
  description,
  selected,
  onPress,
  icon,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  icon?: Parameters<typeof SymbolView>[0]['name'];
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.9 : 1,
        },
      ]}>
      {icon ? (
        <View style={[styles.choiceIcon, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView name={icon} size={26} tintColor={theme.primary} />
        </View>
      ) : null}
      <View style={styles.choiceText}>
        <ThemedText type="heading">{title}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <SymbolView
        name={selected ? 'checkmark.circle.fill' : 'circle'}
        size={24}
        tintColor={selected ? theme.primary : theme.border}
      />
    </Pressable>
  );
}

/** Two big Yes / No buttons. */
export function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.stack}>
      <BigChoice title="Yes" selected={value === true} onPress={() => onChange(true)} />
      <BigChoice title="No" selected={value === false} onPress={() => onChange(false)} />
    </View>
  );
}

/** A large labelled text input sized for the wizard. */
export function WizardField({
  label,
  hint,
  style,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border },
          style,
        ]}
        {...rest}
      />
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  track: {
    height: 6,
    marginHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.pill },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    marginTop: Spacing.two,
  },
  body: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  footer: {
    borderTopWidth: 1,
    padding: Spacing.four,
  },
  stack: { gap: Spacing.three },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    minHeight: 76,
  },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { flex: 1, gap: Spacing.half },
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontFamily: Font.regular,
    fontSize: 17,
    minHeight: 52,
  },
});
