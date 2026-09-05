import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/badge';
import { PillTabs } from '@/components/pill-tabs';
import { ProductCard } from '@/components/product-card';
import { Rating } from '@/components/rating';
import { SplitBookingSheet } from '@/components/split-booking-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ANIMAL_LABELS,
  SERVICE_LABELS,
  getFarm,
  type SlaughterOption,
} from '@/data/farms';
import { useCart } from '@/lib/cart';

const TABS = [
  { key: 'produce', label: 'Produce & Meats' },
  { key: 'slaughter', label: 'Slaughter' },
  { key: 'activities', label: 'Activities' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function FarmProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const cart = useCart();

  const farm = useMemo(() => getFarm(id), [id]);
  const [tab, setTab] = useState<TabKey>('produce');
  const [splitOption, setSplitOption] = useState<SlaughterOption | null>(null);

  if (!farm) {
    return (
      <ThemedView style={styles.missing}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText type="heading">Farm not found</ThemedText>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="linkPrimary">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${farm.lat},${farm.lng}`;
    Linking.openURL(url);
  };
  const call = () => farm.phone && Linking.openURL(`tel:${farm.phone.replace(/[^\d+]/g, '')}`);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          alignSelf: 'center',
          width: '100%',
          maxWidth: MaxContentWidth,
        }}>
        {/* 0: hero */}
        <View>
          <Image source={farm.image} style={styles.hero} contentFit="cover" transition={200} />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + Spacing.two }]}>
            <SymbolView name="chevron.left" size={18} tintColor="#fff" />
          </Pressable>

          <View style={styles.heroBody}>
            <View style={styles.tagRow}>
              {farm.halalCertified && (
                <Badge label={`Halal · ${farm.certifier ?? 'certified'}`} variant="halal" />
              )}
              <Badge label={farm.town} variant="outline" />
            </View>
            <ThemedText type="title" style={styles.name}>
              {farm.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {farm.address}
            </ThemedText>
            <View style={styles.metaRow}>
              <Rating rating={farm.rating} reviewCount={farm.reviewCount} travelMin={farm.travelMin} />
              {farm.hours ? (
                <ThemedText type="small" themeColor="textSecondary">
                  · {farm.hours}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.actions}>
              <ActionButton icon="phone.fill" label="Call" onPress={call} filled />
              <ActionButton icon="location.fill" label="Directions" onPress={openDirections} />
            </View>

            <View style={styles.services}>
              {farm.services.map((s) => (
                <View key={s} style={styles.serviceItem}>
                  <SymbolView name="checkmark.seal.fill" size={14} tintColor={theme.primary} />
                  <ThemedText type="small">{SERVICE_LABELS[s]}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 1: sticky tab bar */}
        <PillTabs tabs={TABS} value={tab} onChange={setTab} />

        {/* 2: tab content */}
        <View style={styles.tabContent}>
          {tab === 'produce' && (
            <View style={styles.grid}>
              {farm.products.map((product) => (
                <View key={product.id} style={styles.gridCell}>
                  <ProductCard product={product} onAdd={cart.add} block />
                </View>
              ))}
              {farm.products.length === 0 && <EmptyNote text="No products listed yet." />}
            </View>
          )}

          {tab === 'slaughter' && (
            <View style={styles.stack}>
              {farm.slaughterOptions.map((option) => (
                <SlaughterRow
                  key={option.id}
                  option={option}
                  onSplit={() => setSplitOption(option)}
                  onRequest={() =>
                    Alert.alert('Booking requested', `${option.label} — the farm will confirm a time.`)
                  }
                />
              ))}
              {farm.slaughterOptions.length === 0 && (
                <EmptyNote text="This farm doesn't offer slaughter bookings." />
              )}
            </View>
          )}

          {tab === 'activities' && (
            <View style={styles.stack}>
              {farm.activities.map((activity) => (
                <ThemedView
                  key={activity.id}
                  type="surface"
                  style={[styles.activity, { borderColor: theme.border }]}>
                  <View style={styles.activityHead}>
                    <ThemedText type="smallBold">{activity.title}</ThemedText>
                    {activity.date ? <Badge label={activity.date} variant="neutral" /> : null}
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {activity.detail}
                  </ThemedText>
                </ThemedView>
              ))}
              {farm.activities.length === 0 && <EmptyNote text="No activities scheduled." />}
            </View>
          )}
        </View>
      </ScrollView>

      <SplitBookingSheet
        visible={splitOption != null}
        option={splitOption}
        onClose={() => setSplitOption(null)}
        onConfirm={(summary) => {
          setSplitOption(null);
          Alert.alert('Split booking requested', summary);
        }}
      />
    </ThemedView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: Parameters<typeof SymbolView>[0]['name'];
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: filled ? theme.primary : theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <SymbolView name={icon} size={14} tintColor={filled ? theme.onPrimary : theme.primary} />
      <ThemedText type="smallBold" style={{ color: filled ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SlaughterRow({
  option,
  onSplit,
  onRequest,
}: {
  option: SlaughterOption;
  onSplit: () => void;
  onRequest: () => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView type="surface" style={[styles.slaughter, { borderColor: theme.border }]}>
      <View style={styles.slaughterHead}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{option.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {ANIMAL_LABELS[option.animal]} · ~{option.yieldKg} kg · ready in {option.leadTimeDays} day
            {option.leadTimeDays === 1 ? '' : 's'}
          </ThemedText>
        </View>
        <ThemedText type="heading" themeColor="primary">
          ${option.price.toFixed(0)}
        </ThemedText>
      </View>

      <View style={styles.slaughterActions}>
        <Pressable
          onPress={onRequest}
          style={({ pressed }) => [
            styles.slaughterBtn,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold">Book whole</ThemedText>
        </Pressable>
        {option.splitAllowed && (
          <Pressable
            onPress={onSplit}
            style={({ pressed }) => [
              styles.slaughterBtn,
              { backgroundColor: theme.primary, borderColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <SymbolView name="person.2.fill" size={13} tintColor={theme.onPrimary} />
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Split booking
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.emptyNote}>
      {text}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.three,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  name: {
    marginTop: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
  },
  services: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tabContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridCell: {
    width: '47%',
    flexGrow: 1,
  },
  stack: {
    gap: Spacing.three,
  },
  slaughter: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  slaughterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  slaughterActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  slaughterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.two,
  },
  activity: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  activityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  emptyNote: {
    paddingVertical: Spacing.five,
    textAlign: 'center',
  },
});
