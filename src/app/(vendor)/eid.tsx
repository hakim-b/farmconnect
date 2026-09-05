import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import type { AvailabilitySlot, EidRegistration } from '@/lib/types';

export default function VendorEidScreen() {
  const { farm, loading, supabase } = useVendorFarm();
  const [tickets, setTickets] = useState<EidRegistration[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const load = useCallback(async () => {
    if (!farm) return;
    const [ticketRes, slotRes] = await Promise.all([
      supabase
        .from('eid_registrations')
        .select('*, availability_slots(id, starts_at, ends_at)')
        .eq('farm_id', farm.id)
        .order('created_at'),
      supabase
        .from('availability_slots')
        .select('*')
        .eq('farm_id', farm.id)
        .eq('slot_type', 'slaughter')
        .order('starts_at'),
    ]);
    setTickets((ticketRes.data as EidRegistration[]) ?? []);
    setSlots((slotRes.data as AvailabilitySlot[]) ?? []);
  }, [farm, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;
  if (!farm) {
    return (
      <Screen>
        <EmptyState title="Create a farm first" body="Turn on Eid from the dashboard after listing." />
      </Screen>
    );
  }

  async function assign(ticket: EidRegistration, slot: AvailabilitySlot) {
    await supabase
      .from('eid_registrations')
      .update({
        status: 'assigned',
        assigned_slot_id: slot.id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', ticket.id);
    await load();
  }

  const availableSlots = slots.filter((slot) => slot.remaining > 0);

  return (
    <Screen>
      <ThemedText type="subtitle">Eid queue</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Assign dates to registered customers. Enable Eid on the dashboard if this list is empty.
      </ThemedText>

      {tickets.length === 0 ? (
        <EmptyState title="Queue is empty" body="Customer pre-registrations will appear as tickets." />
      ) : (
        tickets.map((ticket) => (
          <ThemedView key={ticket.id} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{ticket.ticket_number}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ticket.animal_type} · {ticket.status}
            </ThemedText>
            {ticket.availability_slots ? (
              <ThemedText type="small">
                Assigned {new Date(ticket.availability_slots.starts_at).toLocaleString()}
              </ThemedText>
            ) : (
              <View style={styles.row}>
                {availableSlots.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No open slaughter slots — add some in Schedule.
                  </ThemedText>
                ) : (
                  availableSlots.slice(0, 5).map((slot) => (
                    <Button
                      key={slot.id}
                      size="sm"
                      variant="secondary"
                      onPress={() => assign(ticket, slot)}>
                      Assign {new Date(slot.starts_at).toLocaleString()} · {slot.remaining} left
                    </Button>
                  ))
                )}
              </View>
            )}
          </ThemedView>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
