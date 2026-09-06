import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { AccountHeader } from '@/components/account-header';
import { FarmCalendar, dateKey, todayString } from '@/components/farm-calendar';
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
  '*, slaughter_offerings(name, animal_type), activities(name), booking_invitees(invitee_email), customer:profiles!customer_profile_id(display_name)';

function clockLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function VendorBookingsScreen() {
  const theme = useTheme();
  const { farm, loading, profile, supabase } = useVendorFarm();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(todayString());

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

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const pendingCount = rows.filter((b) => b.status === 'pending').length;

  const marks = useMemo(() => {
    const byDay = new Map<string, { pending: boolean }>();
    for (const b of rows) {
      if (b.status === 'declined' || b.status === 'cancelled') continue;
      const key = dateKey(new Date(b.scheduled_at));
      const cur = byDay.get(key) ?? { pending: false };
      if (b.status === 'pending') cur.pending = true;
      byDay.set(key, cur);
    }
    const m: Record<string, { color: string }> = {};
    for (const [key, v] of byDay) m[key] = { color: v.pending ? theme.accent : theme.primary };
    return m;
  }, [rows, theme.accent, theme.primary]);

  const dayRows = useMemo(
    () => rows.filter((b) => dateKey(new Date(b.scheduled_at)) === selected),
    [rows, selected],
  );

  if (loading) return <LoadingScreen />;
  if (!farm) return null;

  const setStatus = async (id: number, status: BookingStatus) => {
    setBusy(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) Alert.alert('Could not update', error.message);
    await load();
    setBusy(false);
  };

  const titleFor = (b: Row) =>
    b.slaughter_offerings?.name ??
    b.activities?.name ??
    (b.booking_type === 'slaughter' ? 'Slaughter' : 'Activity');
  const nameFor = (b: Row) => b.customer?.display_name ?? 'A customer';

  const jumpToFirstPending = () => {
    const first = rows.find((b) => b.status === 'pending');
    if (first) setSelected(dateKey(new Date(first.scheduled_at)));
  };

  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Screen>
      <AccountHeader title="Bookings" profile={profile} />

      {pendingCount > 0 ? (
        <Pressable onPress={jumpToFirstPending}>
          <ThemedView type="surface" style={[styles.banner, { borderColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {pendingCount} {pendingCount === 1 ? 'request needs' : 'requests need'} your answer
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Orange dots on the calendar are days with a new request. Tap here to jump to the first
              one.
            </ThemedText>
          </ThemedView>
        </Pressable>
      ) : null}

      <FarmCalendar selected={selected} onSelect={setSelected} marks={marks} allowPast />

      <View style={styles.dayHeader}>
        <ThemedText type="heading">{selectedLabel}</ThemedText>
      </View>

      {dayRows.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          No bookings on this day.
        </ThemedText>
      ) : (
        dayRows.map((b) => (
          <ThemedView
            key={b.id}
            type="surface"
            style={[styles.card, { borderColor: theme.border }]}>
            <ThemedText type="heading">{titleFor(b)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {nameFor(b)} · {clockLabel(b.scheduled_at)} · {money(b.total_price)}
            </ThemedText>
            {(() => {
              const emails = (b.booking_invitees ?? [])
                .map((i) => i.invitee_email)
                .filter(Boolean);
              return emails.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Splitting with {emails.join(', ')}
                </ThemedText>
              ) : b.notes ? (
                <ThemedText type="small" style={styles.notes}>
                  “{b.notes}”
                </ThemedText>
              ) : null;
            })()}

            {b.status === 'pending' ? (
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
              </View>
            ) : b.status === 'accepted' ? (
              <View style={styles.actions}>
                <Button
                  size="lg"
                  variant="secondary"
                  isDisabled={busy}
                  onPress={() => setStatus(b.id, 'completed')}>
                  Mark as done
                </Button>
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {b.status === 'completed'
                  ? 'Done'
                  : b.status === 'declined'
                    ? 'You declined this'
                    : 'Cancelled'}
              </ThemedText>
            )}
          </ThemedView>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { lineHeight: 22 },
  dayHeader: { marginTop: Spacing.two },
  banner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  notes: { fontStyle: 'italic' },
  actions: { gap: Spacing.two, marginTop: Spacing.two },
});
