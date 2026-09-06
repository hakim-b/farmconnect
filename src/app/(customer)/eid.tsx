import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'heroui-native';

import { Wordmark } from '@/components/logo';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { usePublicSupabase, useSupabase } from '@/hooks/use-supabase';
import type { EidRegistration, Farm } from '@/lib/types';

export default function CustomerEidScreen() {
  const { profile } = useProfile();
  const supabase = useSupabase();
  const publicClient = usePublicSupabase();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [tickets, setTickets] = useState<EidRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const farmsQuery = publicClient
      .from('farms')
      .select('id, name, city, region, eid_enabled')
      .eq('is_published', true)
      .eq('eid_enabled', true);
    const ticketsQuery = profile
      ? supabase
          .from('eid_registrations')
          .select('*, farms(id, name), availability_slots(id, starts_at, ends_at)')
          .eq('customer_profile_id', profile.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] });

    const [{ data: farmRows }, { data: ticketRows }] = await Promise.all([farmsQuery, ticketsQuery]);
    setFarms((farmRows as Farm[]) ?? []);
    setTickets((ticketRows as EidRegistration[]) ?? []);
    setLoading(false);
  }, [profile, publicClient, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function register(farm: Farm, animalType: string) {
    if (!profile) return;
    setMessage(null);
    const { error } = await supabase.from('eid_registrations').insert({
      farm_id: farm.id,
      customer_profile_id: profile.id,
      animal_type: animalType,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(`Registered at ${farm.name} for ${animalType}.`);
    await load();
  }

  if (loading) return <LoadingScreen />;

  return (
    <Screen>
      <Wordmark markSize={22} style={styles.brand} />
      <ThemedText type="subtitle">Eid al-Adha</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Pre-register with a farm. The farmer assigns your date and time from their queue.
      </ThemedText>

      {message ? (
        <ThemedText type="small" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}

      <ThemedText type="smallBold">Your tickets</ThemedText>
      {tickets.length === 0 ? (
        <EmptyState title="No tickets yet" body="Register with a participating farm below." />
      ) : (
        tickets.map((ticket) => (
          <ThemedView key={ticket.id} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{ticket.ticket_number}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ticket.farms?.name} · {ticket.animal_type} · {ticket.status}
            </ThemedText>
            {ticket.availability_slots ? (
              <ThemedText type="small">
                Assigned {new Date(ticket.availability_slots.starts_at).toLocaleString()}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Waiting for a date assignment
              </ThemedText>
            )}
          </ThemedView>
        ))
      )}

      <ThemedText type="smallBold">Participating farms</ThemedText>
      {farms.length === 0 ? (
        <EmptyState title="No Eid farms listed" body="Farms can turn on Eid booking from their profile." />
      ) : (
        farms.map((farm) => (
          <ThemedView key={farm.id} type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{farm.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {[farm.city, farm.region].filter(Boolean).join(', ')}
            </ThemedText>
            <View style={styles.row}>
              <Button size="sm" onPress={() => register(farm, 'goat')}>
                Register goat
              </Button>
              <Button size="sm" variant="secondary" onPress={() => register(farm, 'lamb')}>
                Register lamb
              </Button>
            </View>
          </ThemedView>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { marginBottom: Spacing.two },
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
  message: {
    color: '#2F6B3A',
  },
});
