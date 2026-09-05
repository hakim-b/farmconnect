import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FarmCard } from '@/components/farm-card';
import { EmptyState, LoadingScreen, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePublicSupabase } from '@/hooks/use-supabase';
import type { Farm } from '@/lib/types';

export default function MapScreen() {
  const supabase = usePublicSupabase();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('farms')
      .select('*, farm_certifications(*)')
      .eq('is_published', true)
      .order('city');
    setFarms((data as Farm[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingScreen />;

  return (
    <Screen>
      <ThemedText type="subtitle">Nearby farms</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Pins for every published farm. A native map layer can drop in once you add a development
        build with Expo Maps.
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.mapPreview}>
        {farms.map((farm) => (
          <View key={farm.id} style={styles.pin}>
            <ThemedText type="smallBold">{farm.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {farm.city}, {farm.region}
              {farm.latitude != null && farm.longitude != null
                ? ` · ${Number(farm.latitude).toFixed(3)}, ${Number(farm.longitude).toFixed(3)}`
                : ''}
            </ThemedText>
          </View>
        ))}
        {farms.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No farms to pin yet.
          </ThemedText>
        ) : null}
      </ThemedView>

      {farms.length === 0 ? (
        <EmptyState title="Nothing on the map" body="Published farms will show up here." />
      ) : (
        farms.map((farm) => <FarmCard key={farm.id} farm={farm} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapPreview: {
    minHeight: 180,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  pin: {
    gap: 2,
  },
});
