import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { FARM_TYPE_LABELS, formatRating, type Farm } from '@/lib/types';

export function CertificationRow({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <View style={styles.chipRow}>
      {labels.map((label) => (
        <View key={label} style={styles.chip}>
          <ThemedText type="small" style={styles.chipText}>
            {label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export function FarmCard({ farm }: { farm: Farm }) {
  const labels = (farm.farm_certifications ?? []).map((item) => item.label);

  return (
    <Link href={{ pathname: '/farm/[id]', params: { id: String(farm.id) } }} asChild>
      <Pressable>
        <ThemedView type="backgroundElement" style={styles.card}>
          <Image
            source={{ uri: farm.thumbnail_url ?? undefined }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <ThemedText type="smallBold" style={styles.name}>
                {farm.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                ★ {formatRating(farm.average_rating)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {[farm.city, farm.region].filter(Boolean).join(', ')} · {FARM_TYPE_LABELS[farm.farm_type]}
            </ThemedText>
            <CertificationRow labels={labels} />
          </View>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#D6D3D1',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
    fontSize: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  chip: {
    backgroundColor: '#E4F0E6',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: '#2F6B3A',
    fontSize: 12,
  },
});
