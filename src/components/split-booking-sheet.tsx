import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { type SlaughterOption } from '@/data/farms';

const CONTACTS = [
  'Bilal Haddad',
  'Yusuf Rahman',
  'Amina Cherif',
  'Omar Diallo',
  'Sana Iqbal',
  'Idris Kone',
];

type SplitBookingSheetProps = {
  visible: boolean;
  option: SlaughterOption | null;
  onClose: () => void;
  onConfirm: (summary: string) => void;
};

/** Contact-picker sheet to split cost & yield — DESIGN.md §2.4 "Split Flow". */
export function SplitBookingSheet({ visible, option, onClose, onConfirm }: SplitBookingSheetProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>([]);

  if (!option) return null;

  const shares = selected.length + 1; // you + invitees
  const perPerson = option.price / shares;
  const kgPerPerson = option.yieldKg / shares;

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const reset = () => setSelected([]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView type="surface" style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <ThemedText type="heading">Split this booking</ThemedText>
            <Pressable hitSlop={10} onPress={onClose}>
              <SymbolView name="xmark.circle.fill" size={24} tintColor={theme.textSecondary} />
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {option.label} · ${option.price.toFixed(0)} · ~{option.yieldKg} kg dressed
          </ThemedText>

          <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.section}>
            Invite people to share
          </ThemedText>
          <View style={styles.contacts}>
            {CONTACTS.map((name) => {
              const on = selected.includes(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => toggle(name)}
                  style={[
                    styles.contact,
                    { borderColor: on ? theme.primary : theme.border },
                    on && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <SymbolView
                    name={on ? 'checkmark.circle.fill' : 'circle'}
                    size={18}
                    tintColor={on ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText type="small">{name}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedView style={[styles.summary, { backgroundColor: theme.backgroundSelected }]}>
            <View style={styles.summaryRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Split
              </ThemedText>
              <ThemedText type="smallBold">
                1/{shares} {shares > 1 ? `(you + ${selected.length})` : '(whole animal)'}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Your cost
              </ThemedText>
              <ThemedText type="smallBold">${perPerson.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Your yield
              </ThemedText>
              <ThemedText type="smallBold">~{kgPerPerson.toFixed(1)} kg</ThemedText>
            </View>
          </ThemedView>

          <Pressable
            onPress={() => {
              onConfirm(
                `${option.label} · 1/${shares} share · $${perPerson.toFixed(2)} · ~${kgPerPerson.toFixed(1)} kg`,
              );
              reset();
            }}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              {selected.length > 0 ? `Request split booking` : `Request whole booking`}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: Spacing.three,
  },
  contacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  summary: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cta: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
