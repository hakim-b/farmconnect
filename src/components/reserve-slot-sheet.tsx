import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from 'heroui-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSupabase } from '@/hooks/use-supabase';
import { useTheme } from '@/hooks/use-theme';
import { toError } from '@/lib/errors';
import { formatPrice, type Activity, type AvailabilitySlot, type SlaughterOffering } from '@/lib/types';

export type ReserveTarget =
  | { kind: 'slaughter'; offering: SlaughterOffering }
  | { kind: 'activity'; activity: Activity };

/** yyyy-mm-dd for a local Date. */
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeRange(startIso: string, endIso: string) {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString([], opts)} – ${new Date(endIso).toLocaleTimeString([], opts)}`;
}

const looksLikeEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

/**
 * Slide-up sheet for reserving a slaughter or activity time. Shows the times a
 * farmer has posted (grouped by day, live via the parent's refetch), lets the
 * customer pick one, and — for slaughter — invite others by email to split it.
 *
 * Mount with `key` tied to the target so it resets when a different offering
 * opens it.
 */
export function ReserveSlotSheet({
  target,
  farmId,
  farmName,
  slots,
  onClose,
  onReserved,
}: {
  target: ReserveTarget | null;
  farmId: number;
  farmName: string;
  /** All of the farm's upcoming slots; filtered to the right type here. */
  slots: AvailabilitySlot[];
  onClose: () => void;
  onReserved: (message: string) => void;
}) {
  const theme = useTheme();
  const { profile } = useProfile();
  const supabase = useSupabase();

  const kind = target?.kind ?? 'slaughter';
  const mySlots = useMemo(
    () =>
      slots
        .filter((s) => s.slot_type === kind)
        .slice()
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [slots, kind],
  );
  const openSlots = mySlots.filter((s) => s.remaining > 0);

  const [slotId, setSlotId] = useState<number | null>(openSlots[0]?.id ?? null);
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!target) return null;

  const name = target.kind === 'slaughter' ? target.offering.name : target.activity.name;
  const price = target.kind === 'slaughter' ? target.offering.price : target.activity.price;
  const maxInvitees =
    target.kind === 'slaughter' ? Math.max(0, target.offering.max_split_participants - 1) : 0;
  const perPerson = price / (emails.length + 1);

  const byDay = new Map<string, AvailabilitySlot[]>();
  for (const s of mySlots) {
    const key = dayKey(new Date(s.starts_at));
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  const addEmail = () => {
    const value = draft.trim().toLowerCase();
    if (!looksLikeEmail(value)) {
      setError('Enter a valid email address.');
      return;
    }
    if (emails.includes(value)) {
      setDraft('');
      return;
    }
    if (emails.length >= maxInvitees) return;
    setEmails((prev) => [...prev, value]);
    setDraft('');
    setError(null);
  };

  const reserve = async () => {
    if (!profile) {
      setError('Sign in as a customer to reserve a place.');
      return;
    }
    if (mySlots.length > 0 && slotId == null) {
      setError('Pick a time first.');
      return;
    }
    setBusy(true);
    setError(null);

    const slot = mySlots.find((s) => s.id === slotId) ?? null;
    const scheduledAt = slot?.starts_at ?? new Date(Date.now() + 86_400_000).toISOString();

    const { data, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        farm_id: farmId,
        customer_profile_id: profile.id,
        booking_type: target.kind,
        slaughter_offering_id: target.kind === 'slaughter' ? target.offering.id : null,
        activity_id: target.kind === 'activity' ? target.activity.id : null,
        slot_id: slot?.id ?? null,
        scheduled_at: scheduledAt,
        total_price: price,
        notes: emails.length ? `Splitting with ${emails.join(', ')}` : null,
      })
      .select()
      .single();

    if (bookingError) {
      setBusy(false);
      setError(
        /slot_full/.test(bookingError.message)
          ? 'That time just filled up — pick another.'
          : toError(bookingError).message,
      );
      return;
    }

    if (emails.length && data) {
      await supabase
        .from('booking_invitees')
        .insert(emails.map((email) => ({ booking_id: data.id, invitee_email: email })));
    }

    setBusy(false);
    onReserved(
      slot
        ? `Reserved ${name} · ${dayLabel(slot.starts_at)}, ${timeRange(slot.starts_at, slot.ends_at)}. The farm will confirm.`
        : `Requested ${name}. The farm will confirm a time.`,
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView type="surface" style={styles.sheet}>
          <View style={styles.handle} />

          <ThemedText type="heading">{name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {farmName}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="primary">
            {formatPrice(price)}
            {maxInvitees > 0 ? ` · split up to ${maxInvitees + 1} ways` : ''}
          </ThemedText>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              {mySlots.length > 0 ? 'Pick a time' : 'Times'}
            </ThemedText>

            {mySlots.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                This farm hasn&apos;t posted times yet. You can still request one and they&apos;ll
                propose a slot.
              </ThemedText>
            ) : (
              [...byDay.entries()].map(([key, daySlots]) => (
                <View key={key} style={styles.dayGroup}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {dayLabel(daySlots[0].starts_at)}
                  </ThemedText>
                  {daySlots.map((slot) => {
                    const full = slot.remaining <= 0;
                    const selected = slot.id === slotId;
                    return (
                      <Pressable
                        key={slot.id}
                        disabled={full}
                        onPress={() => setSlotId(slot.id)}
                        style={[
                          styles.slot,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                            opacity: full ? 0.45 : 1,
                          },
                        ]}>
                        <ThemedText type="small">
                          {timeRange(slot.starts_at, slot.ends_at)}
                        </ThemedText>
                        <ThemedText type="small" themeColor={full ? 'accent' : 'textSecondary'}>
                          {full
                            ? 'Full'
                            : `${slot.remaining} ${slot.remaining === 1 ? 'spot' : 'spots'} left`}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ))
            )}

            {maxInvitees > 0 ? (
              <View style={styles.inviteBlock}>
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Invite people to split (optional)
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {emails.length + 1} {emails.length === 0 ? 'person' : 'people'} ·{' '}
                  {formatPrice(perPerson)} each
                </ThemedText>

                {emails.map((email) => (
                  <View
                    key={email}
                    style={[styles.chip, { borderColor: theme.border }]}>
                    <ThemedText type="small">{email}</ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="accent"
                      onPress={() => setEmails((prev) => prev.filter((e) => e !== email))}>
                      Remove
                    </ThemedText>
                  </View>
                ))}

                {emails.length < maxInvitees ? (
                  <View style={styles.inviteRow}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      placeholder="name@email.com"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="done"
                      onSubmitEditing={addEmail}
                      style={[
                        styles.input,
                        { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                      ]}
                    />
                    <Button size="sm" variant="secondary" onPress={addEmail}>
                      Add
                    </Button>
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    That&apos;s the most this animal can be split.
                  </ThemedText>
                )}
              </View>
            ) : null}
          </ScrollView>

          {error ? (
            <ThemedText type="small" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <Button size="lg" isDisabled={busy} onPress={reserve}>
            {busy
              ? 'Reserving…'
              : mySlots.length > 0
                ? 'Reserve this time'
                : 'Request a time'}
          </Button>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.4)',
    marginBottom: Spacing.two,
  },
  scroll: { flexGrow: 0, flexShrink: 1, marginVertical: Spacing.two },
  scrollBody: { gap: Spacing.two, paddingBottom: Spacing.two },
  sectionLabel: { marginTop: Spacing.one },
  dayGroup: { gap: Spacing.one },
  slot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  inviteBlock: { gap: Spacing.one, marginTop: Spacing.two },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 44,
  },
  chip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  error: { color: '#B42318', marginTop: Spacing.one },
});
