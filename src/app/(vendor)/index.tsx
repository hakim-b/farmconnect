import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AccountHeader } from '@/components/account-header';
import { RevenueBars } from '@/components/bar-chart';
import { LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddButton, PillButton, TogglePill } from '@/components/vendor-ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVendorFarm } from '@/hooks/use-vendor-farm';
import { FARM_TYPE_LABELS } from '@/lib/types';
import { computeFarmStats, money, type StatBooking } from '@/lib/vendor-stats';

export default function VendorDashboardScreen() {
  const theme = useTheme();
  const { farm, loading, refresh, profile, supabase } = useVendorFarm();
  const [bookings, setBookings] = useState<StatBooking[]>([]);
  const [certLabel, setCertLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const farmId = farm?.id;

  const loadBookings = useCallback(async () => {
    if (!farmId) return;
    const { data } = await supabase
      .from('bookings')
      .select('status, total_price, scheduled_at')
      .eq('farm_id', farmId);
    setBookings((data as StatBooking[]) ?? []);
  }, [farmId, supabase]);

  useFocusEffect(
    useCallback(() => {
      void loadBookings();
      void refresh();
    }, [loadBookings, refresh]),
  );

  const stats = useMemo(() => computeFarmStats(bookings), [bookings]);

  if (loading) return <LoadingScreen />;
  if (!farm) return <Redirect href="/farm-setup" />;

  const location = [farm.city, farm.region].filter(Boolean).join(', ') || 'No location set';

  const togglePublished = async () => {
    await supabase.from('farms').update({ is_published: !farm.is_published }).eq('id', farm.id);
    await refresh();
  };
  const toggleEid = async () => {
    await supabase.from('farms').update({ eid_enabled: !farm.eid_enabled }).eq('id', farm.id);
    await refresh();
  };

  const addCertification = async () => {
    const label = certLabel.trim();
    if (label.length < 2) return;
    setError(null);
    const { error: insertError } = await supabase
      .from('farm_certifications')
      .insert({ farm_id: farm.id, label });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCertLabel('');
    await refresh();
  };

  const removeCertification = (id: number, label: string) => {
    Alert.alert('Remove certification', `Remove "${label}"?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error: e } = await supabase.from('farm_certifications').delete().eq('id', id);
          if (e) setError(e.message);
          else await refresh();
        },
      },
    ]);
  };

  const certs = farm.farm_certifications ?? [];

  return (
    <Screen>
      <AccountHeader title="My Farm" profile={profile} />

      {/* ---- farm summary ---- */}
      <ThemedView type="surface" style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.cardHead}>
          <ThemedText type="heading" style={{ flex: 1 }}>
            {farm.name}
          </ThemedText>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: farm.is_published ? theme.primary : theme.backgroundSelected },
            ]}>
            <ThemedText
              type="small"
              style={{ color: farm.is_published ? theme.onPrimary : theme.textSecondary }}>
              {farm.is_published ? 'Visible to customers' : 'Draft'}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {FARM_TYPE_LABELS[farm.farm_type]} · {location}
        </ThemedText>
        <View style={styles.row}>
          <TogglePill
            on={farm.is_published}
            onLabel="Hide from customers"
            offLabel="Make visible"
            onToggle={togglePublished}
          />
          <PillButton
            label={farm.eid_enabled ? 'Eid queue: on' : 'Eid queue: off'}
            onPress={toggleEid}
          />
        </View>
      </ThemedView>

      {/* ---- sales ---- */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Sales
      </ThemedText>
      <View style={styles.tiles}>
        <StatTile label="Completed" value={String(stats.completed)} />
        <StatTile label="Money earned" value={money(stats.revenue)} />
        <StatTile label="Waiting" value={String(stats.pending)} tone={stats.pending > 0 ? 'alert' : 'default'} />
      </View>

      <ThemedView type="surface" style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">Money earned by week</ThemedText>
        <RevenueBars data={stats.weekly} />
      </ThemedView>

      {/* ---- certifications ---- */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Certifications
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Show customers your farm is certified — for example Halal Certified, Organic, or Grass-Fed.
      </ThemedText>

      {certs.length > 0 ? (
        <View style={styles.chips}>
          {certs.map((c) => (
            <PillButton
              key={c.id}
              label={`${c.label}  ✕`}
              onPress={() => removeCertification(c.id, c.label)}
            />
          ))}
        </View>
      ) : null}

      <TextInput
        value={certLabel}
        onChangeText={setCertLabel}
        placeholder="Certification name"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="words"
        style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
      />
      <AddButton label="Add certification" onPress={addCertification} />

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

function StatTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'alert';
}) {
  const theme = useTheme();
  return (
    <ThemedView type="surface" style={[styles.tile, { borderColor: theme.border }]}>
      <ThemedText
        style={[styles.tileValue, { color: tone === 'alert' ? theme.accent : theme.text }]}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionTitle: { marginTop: Spacing.three },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.half,
    alignItems: 'flex-start',
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    minHeight: 52,
  },
  error: { color: '#B42318' },
});
