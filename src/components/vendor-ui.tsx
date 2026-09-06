import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'heroui-native';

import { FarmConnectMark } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Font, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Full-screen form shell for the vendor "add / edit" flows. Big title,
 * scrollable body, one big action button pinned to the bottom.
 */
export function FormScreen({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  saving = false,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  saving?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.topBar, styles.topBarSplit]}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
            <SymbolView name="chevron.left" size={22} tintColor={theme.text} />
            <ThemedText type="smallBold">{backLabel}</ThemedText>
          </Pressable>
          <FarmConnectMark size={22} />
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
          {onSave ? (
            <View style={[styles.footer, { borderColor: theme.border }]}>
              <Button size="lg" isDisabled={saveDisabled || saving} onPress={onSave}>
                {saving ? 'Please wait…' : saveLabel}
              </Button>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** A labelled block wrapping a form control. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Big minus / plus number control — no keyboard needed. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  format = (n) => String(n),
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;
}) {
  const theme = useTheme();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(clamp(value - step))}
        disabled={value <= min}
        style={[
          styles.stepBtn,
          { borderColor: theme.border, opacity: value <= min ? 0.4 : 1 },
        ]}>
        <SymbolView name="minus" size={20} tintColor={theme.text} />
      </Pressable>
      <ThemedText style={styles.stepValue}>{format(value)}</ThemedText>
      <Pressable
        onPress={() => onChange(clamp(value + step))}
        disabled={value >= max}
        style={[
          styles.stepBtn,
          { borderColor: theme.border, opacity: value >= max ? 0.4 : 1 },
        ]}>
        <SymbolView name="plus" size={20} tintColor={theme.text} />
      </Pressable>
    </View>
  );
}

/** Row of big segmented buttons. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold" themeColor={active ? 'primary' : 'textSecondary'}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Horizontal scroll of upcoming days. `value`/`onChange` use a yyyy-mm-dd key. */
export function DayPicker({
  days,
  value,
  onChange,
}: {
  days: Date[];
  value: string;
  onChange: (d: Date) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
      {days.map((d) => {
        const key = d.toISOString().slice(0, 10);
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(d)}
            style={[
              styles.day,
              {
                backgroundColor: active ? theme.primary : theme.surface,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}>
            <ThemedText type="small" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
              {d.toLocaleDateString([], { weekday: 'short' })}
            </ThemedText>
            <ThemedText type="heading" style={{ color: active ? theme.onPrimary : theme.text }}>
              {d.getDate()}
            </ThemedText>
            <ThemedText type="small" style={{ color: active ? theme.onPrimary : theme.textSecondary }}>
              {d.toLocaleDateString([], { month: 'short' })}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const HOUR_LABELS = (h: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
};

/** Pick an hour (0–23) from a scroll of big buttons. */
export function HourPicker({
  value,
  onChange,
  minHour = 5,
  maxHour = 21,
}: {
  value: number | null;
  onChange: (h: number) => void;
  minHour?: number;
  maxHour?: number;
}) {
  const theme = useTheme();
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
      {hours.map((h) => {
        const active = h === value;
        return (
          <Pressable
            key={h}
            onPress={() => onChange(h)}
            style={[
              styles.hour,
              {
                backgroundColor: active ? theme.primary : theme.surface,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: active ? theme.onPrimary : theme.text }}>
              {HOUR_LABELS(h)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export { HOUR_LABELS as formatHour };

/** A large list row: optional photo, title, subtitle, optional right control. */
export function BigRow({
  title,
  subtitle,
  onPress,
  right,
  image,
  tone = 'default',
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  image?: string | null;
  tone?: 'default' | 'muted';
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.bigRow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: tone === 'muted' ? 0.6 : pressed ? 0.9 : 1,
        },
      ]}>
      {image !== undefined ? (
        image ? (
          <Image source={image} style={styles.thumb} contentFit="cover" transition={120} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: theme.backgroundSelected }]}>
            <SymbolView name="photo" size={18} tintColor={theme.textSecondary} />
          </View>
        )
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
      {onPress && !right ? (
        <SymbolView name="chevron.right" size={14} tintColor={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

/** Full-width primary "add" button. */
export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.addBtn,
        { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
      ]}>
      <SymbolView name="plus" size={20} tintColor={theme.onPrimary} />
      <ThemedText type="heading" style={{ color: theme.onPrimary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** A single labelled pill button. */
export function PillButton({
  label,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  onPress: () => void;
  tone?: 'neutral' | 'danger';
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: theme.backgroundSelected,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: tone === 'danger' ? theme.accent : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Big on/off pill for "In stock" / "Available". */
export function TogglePill({
  on,
  onLabel,
  offLabel,
  onToggle,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.toggle,
        {
          backgroundColor: on ? theme.primary : theme.backgroundSelected,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: on ? theme.onPrimary : theme.textSecondary }}>
        {on ? onLabel : offLabel}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  topBarSplit: { justifyContent: 'space-between' },
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  content: { padding: Spacing.four, paddingTop: Spacing.three },
  title: { fontFamily: Font.bold, fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 17, lineHeight: 24, marginTop: Spacing.two },
  body: { marginTop: Spacing.four, gap: Spacing.four },
  footer: { borderTopWidth: 1, padding: Spacing.four },
  field: { gap: Spacing.two },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontFamily: Font.bold, fontSize: 24 },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Radius.sm,
  },
  dayRow: { gap: Spacing.two, paddingVertical: Spacing.one, paddingRight: Spacing.three },
  day: {
    minWidth: 64,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  hour: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    minWidth: 76,
    alignItems: 'center',
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    minHeight: 64,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    minHeight: 60,
  },
  toggle: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
