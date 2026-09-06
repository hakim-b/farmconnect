import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { AccountHeader } from '@/components/account-header';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { money } from '@/lib/vendor-items';
import type { Booking, BookingStatus } from '@/lib/types';

type Row = Booking & { customer?: { display_name: string | null } | null };

const SELECT =
  '*, slaughter_offerings(name, animal_type), activities(name), customer:profiles!customer_profile_id(display_name)';

function whenLabel(iso: string) {
  return new Date(iso).toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function VendorBookingsScreen() {
  const theme = useTheme();
  const { farm, loading, profile, supabase } = useVendorFarm();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const farmId = farm?.id;

  const load = useCallback(async () => {
    if (!farmId) return;
    const { data } = await supabase
      .from('bookings')
      .select(SELECT)
      .eq('farm_id', farmId)
      .order('scheduled_at', { ascending: true });
    setRows((data as Row[]) ?? []);
  }, [farmId, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) return null;

  const setStatus = async (id: number, status: BookingStatus) => {
    setBusy(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) Alert.alert('Could not update', error.message);
    await load();
    setBusy(false);
  };

  const now = Date.now();
  const pending = rows.filter((b) => b.status === 'pending');
  const upcoming = rows.filter(
    (b) => b.status === 'accepted' && new Date(b.scheduled_at).getTime() >= now,
  );
  const past = rows.filter((b) => !pending.includes(b) && !upcoming.includes(b));

  const titleFor = (b: Row) =>
    b.slaughter_offerings?.name ??
    b.activities?.name ??
    (b.booking_type === 'slaughter' ? 'Slaughter' : 'Activity');

  const nameFor = (b: Row) => b.customer?.display_name ?? 'A customer';

  const card = (b: Row, actions?: ReactNode) => (
    <ThemedView key={b.id} type="surface" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText type="heading">{titleFor(b)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {nameFor(b)} · {whenLabel(b.scheduled_at)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {money(b.total_price)}
      </ThemedText>
      {b.notes ? (
        <ThemedText type="small" style={styles.notes}>
          “{b.notes}”
        </ThemedText>
      ) : null}
      {actions}
    </ThemedView>
  );

  return (
    <Screen>
      <AccountHeader title="Bookings" profile={profile} />

      {rows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          No bookings yet. When a customer books a slaughter or an activity, it will show up here
          and you can accept or decline it.
        </ThemedText>
      ) : null}

      {pending.length > 0 ? (
        <Section title="Needs your answer">
          {pending.map((b) =>
            card(
              b,
              <View style={styles.actions}>
                <Button size="lg" isDisabled={busy} onPress={() => setStatus(b.id, 'accepted')}>
                  Accept
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => setStatus(b.id, 'declined')}>
                  Decline
                </Button>
              </View>,
            ),
          )}
        </Section>
      ) : null}

      {upcoming.length > 0 ? (
        <Section title="Coming up">
          {upcoming.map((b) =>
            card(
              b,
              <View style={styles.actions}>
                <Button
                  size="lg"
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => setStatus(b.id, 'completed')}>
                  Mark as done
                </Button>
              </View>,
            ),
          )}
        </Section>
      ) : null}

      {past.length > 0 ? (
        <Section title="Past">
          {past.map((b) => (
            <View key={b.id} style={styles.pastRow}>
              <ThemedText type="small">{titleFor(b)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {nameFor(b)} · {b.status}
              </ThemedText>
            </View>
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  note: { lineHeight: 22 },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  notes: { fontStyle: 'italic' },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
  pastRow: {
    paddingVertical: Spacing.two,
    gap: 2,
  },
});
