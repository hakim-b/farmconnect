import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Map, MapMarker, MarkerContent, MarkerTooltip, type MapHandle, type MapRegion } from '@/components/ui/mapcn-marker-tooltip';
import { LoadingScreen } from '@/components/screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePublicSupabase } from '@/hooks/use-supabase';
import { USER_LOCATION } from '@/lib/location';
import { FARM_TYPE_LABELS, formatRating, type Farm } from '@/lib/types';

type Category = 'Produce & Meats' | 'Slaughter' | 'Activities' | 'Mixed';
type BadgeFilter = 'Halal Certified' | 'Organic' | 'Grass-Fed';
type PriceFilter = '$' | '$$' | '$$$';
type RatingFilter = '4.0+' | '4.5+';
const CATEGORIES: Category[] = ['Produce & Meats', 'Slaughter', 'Activities', 'Mixed'];
const BADGES: BadgeFilter[] = ['Halal Certified', 'Organic', 'Grass-Fed'];
const PRICES: PriceFilter[] = ['$', '$$', '$$$'];
const RATINGS: RatingFilter[] = ['4.0+', '4.5+'];
const PRICE_TIER: Record<PriceFilter, number> = { $: 1, $$: 2, $$$: 3 };

function categoryFor(farm: Farm): Category {
  if (farm.farm_type === 'slaughter_only') return 'Slaughter';
  if (farm.farm_type === 'produce_and_meats') return 'Produce & Meats';
  return 'Mixed';
}
function matchesCategory(farm: Farm, category: Category): boolean {
  switch (category) {
    case 'Slaughter':
      return farm.farm_type === 'slaughter_only';
    case 'Produce & Meats':
      return farm.farm_type === 'produce_and_meats';
    case 'Mixed':
      return farm.farm_type === 'mixed';
    case 'Activities':
      return (farm.activities?.length ?? 0) > 0;
    default:
      return true;
  }
}
function priceLabel(tier: number): PriceFilter {
  return tier <= 1 ? '$' : tier === 2 ? '$$' : '$$$';
}
function tierColor(tier: number): string {
  return tier <= 1 ? Colors.light.primary : tier === 2 ? Colors.light.ochre : Colors.light.accent;
}
function badgesFor(farm: Farm): string[] {
  const certs = farm.farm_certifications ?? [];
  const ordered = [...certs].sort((a, b) => Number(b.is_verified) - Number(a.is_verified));
  return [...new Set(ordered.map((cert) => cert.label))].slice(0, 3);
}
function hasBadge(farm: Farm, badge: BadgeFilter): boolean {
  const key = badge.toLowerCase().split(' ')[0];
  return badgesFor(farm).some((label) => label.toLowerCase().includes(key));
}
function regionFor(latitude: number, longitude: number): MapRegion {
  return { latitude, longitude, latitudeDelta: 0.13, longitudeDelta: 0.13 };
}
function pinEmoji(farm: Farm): string {
  return farm.farm_type === 'slaughter_only' ? '🥩' : farm.farm_type === 'produce_and_meats' ? '🥦' : '🚜';
}
function pinSummary(farm: Farm): string {
  return `${pinEmoji(farm)} ${priceLabel(farm.price_tier)} · ${categoryFor(farm)}`;
}

export default function MapScreen() {
  const supabase = usePublicSupabase();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState({ latitude: USER_LOCATION.lat, longitude: USER_LOCATION.lng });
  const [sheetTop, setSheetTop] = useState(350);
  const [category, setCategory] = useState<Category | null>(null);
  const [badges, setBadges] = useState<BadgeFilter[]>([]);
  const [price, setPrice] = useState<PriceFilter | null>(null);
  const [rating, setRating] = useState<RatingFilter | null>(null);

  const load = useCallback(async () => {
    // Filtering happens on the client below: the result set is already bounded
    // by "published + has coordinates", and instant chip toggles beat a network
    // round-trip per tap. Push category/price/rating into this query with
    // `.eq` / `.gte` once a single city returns more than a few hundred farms.
    const { data } = await supabase
      .from('farms')
      .select('*, farm_certifications(*), activities(id)')
      .eq('is_published', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('average_rating', { ascending: false })
      .limit(250);
    setFarms((data as Farm[]) ?? []);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    let subscription: Location.LocationSubscription | undefined;
    async function startLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const apply = (latitude: number, longitude: number, recenter = false) => {
        if (!active) return;
        setUserLocation({ latitude, longitude });
        if (recenter) mapRef.current?.animateToRegion(regionFor(latitude, longitude));
      };
      const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 5_000 });
      if (last) apply(last.coords.latitude, last.coords.longitude, true);
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      apply(current.coords.latitude, current.coords.longitude, true);
      subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 20 }, (next: Location.LocationObject) => apply(next.coords.latitude, next.coords.longitude));
    }
    void startLocation();
    return () => { active = false; subscription?.remove(); };
  }, []);

  const visibleFarms = useMemo(() => farms.filter((farm) => {
    if (category && !matchesCategory(farm, category)) return false;
    if (price && farm.price_tier !== PRICE_TIER[price]) return false;
    if (rating && farm.average_rating < Number(rating.slice(0, -1))) return false;
    return badges.every((badge) => hasBadge(farm, badge));
  }), [badges, category, farms, price, rating]);

  const openFarm = useCallback((farm: Farm) => {
    router.push({ pathname: '/farm/[id]', params: { id: String(farm.id) } });
  }, [router]);

  const recenter = useCallback(() => {
    mapRef.current?.animateToRegion(regionFor(userLocation.latitude, userLocation.longitude));
  }, [userLocation.latitude, userLocation.longitude]);

  function selectFarm(farm: Farm) {
    if (farm.latitude == null || farm.longitude == null) return;
    setSelectedFarmId(farm.id);
    mapRef.current?.animateToRegion(regionFor(farm.latitude, farm.longitude));
  }
  function toggleBadge(badge: BadgeFilter) {
    setBadges((current) => current.includes(badge) ? current.filter((item) => item !== badge) : [...current, badge]);
  }
  if (loading) return <LoadingScreen />;

  return <View style={styles.root}>
    <Map ref={mapRef} initialRegion={regionFor(userLocation.latitude, userLocation.longitude)} onPress={() => setSelectedFarmId(null)}>
      <UserLocationMarker coordinate={userLocation} />
      {visibleFarms.map((farm) => {
        if (farm.latitude == null || farm.longitude == null) return null;
        const selected = selectedFarmId === farm.id;
        return <MapMarker key={farm.id} live={selected} coordinate={{ latitude: farm.latitude, longitude: farm.longitude }} onPress={() => selectFarm(farm)}>
          <MarkerContent>
            <View style={[styles.pin, { borderColor: tierColor(farm.price_tier) }, selected && styles.pinSelected]}>
              <Text style={styles.pinEmoji}>{pinEmoji(farm)}</Text>
            </View>
          </MarkerContent>
          {selected ? <MarkerTooltip onPress={() => openFarm(farm)}><FarmPreview farm={farm} onOpen={() => openFarm(farm)} /></MarkerTooltip> : null}
        </MapMarker>;
      })}
    </Map>

    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.filterOverlay}>
      <FilterBar
        category={category}
        badges={badges}
        price={price}
        rating={rating}
        onCategory={(value) => setCategory(category === value ? null : value)}
        onBadge={toggleBadge}
        onPrice={(value) => setPrice(price === value ? null : value)}
        onRating={(value) => setRating(rating === value ? null : value)}
      />
    </SafeAreaView>

    <RecenterButton onPress={recenter} bottom={sheetTop + Spacing.three} />

    <NearbySheet farms={visibleFarms} selectedFarmId={selectedFarmId} onSelect={selectFarm} onHeightChange={setSheetTop} />
  </View>;
}

function UserLocationMarker({ coordinate }: { coordinate: { latitude: number; longitude: number } }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.in(Easing.quad), useNativeDriver: true })]));
    animation.start(); return animation.stop;
  }, [pulse]);
  return <MapMarker coordinate={coordinate} live><MarkerContent><View style={styles.userMarker}><Animated.View style={[styles.userPulse, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.85] }) }] }]} /><View style={styles.userDot} /></View></MarkerContent></MapMarker>;
}

function RecenterButton({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel="Center the map on my location"
    onPress={onPress}
    style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}>
    <View style={styles.fabRing} />
    <View style={styles.fabDot} />
  </Pressable>;
}

function FilterBar({ category, badges, price, rating, onCategory, onBadge, onPrice, onRating }: { category: Category | null; badges: BadgeFilter[]; price: PriceFilter | null; rating: RatingFilter | null; onCategory: (value: Category) => void; onBadge: (value: BadgeFilter) => void; onPrice: (value: PriceFilter) => void; onRating: (value: RatingFilter) => void }) {
  return <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    style={styles.filterScroll}
    contentContainerStyle={styles.filterBar}>
    {CATEGORIES.map((value) => <FilterChip key={value} label={value} active={category === value} onPress={() => onCategory(value)} />)}
    {BADGES.map((value) => <FilterChip key={value} label={value} active={badges.includes(value)} onPress={() => onBadge(value)} />)}
    {PRICES.map((value) => <FilterChip key={value} label={value} active={price === value} onPress={() => onPrice(value)} />)}
    {RATINGS.map((value) => <FilterChip key={value} label={`★ ${value}`} active={rating === value} onPress={() => onRating(value)} />)}
  </ScrollView>;
}
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text numberOfLines={1} style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text></Pressable>;
}

function FarmPreview({ farm, onOpen }: { farm: Farm; onOpen: () => void }) {
  const labels = badgesFor(farm);
  return <Pressable accessibilityRole="button" onPress={onOpen} style={styles.previewCard}>
    <Image source={{ uri: farm.thumbnail_url ?? undefined }} contentFit="cover" style={styles.previewImage} />
    <View style={styles.previewContent}><Text numberOfLines={1} style={styles.previewName}>{farm.name}</Text><Text numberOfLines={1} style={styles.previewMeta}>{[farm.city, farm.region].filter(Boolean).join(', ')} · {FARM_TYPE_LABELS[farm.farm_type]}</Text><Text style={styles.previewRating}>★ {formatRating(farm.average_rating)} · {priceLabel(farm.price_tier)}</Text><View style={styles.badgeRow}>{labels.map((label) => <View key={label} style={styles.badge}><Text numberOfLines={1} style={styles.badgeText}>{label}</Text></View>)}</View><View style={styles.viewProfileButton}><Text style={styles.viewProfileText}>View Profile</Text></View></View>
  </Pressable>;
}

function NearbySheet({ farms, selectedFarmId, onSelect, onHeightChange }: { farms: Farm[]; selectedFarmId: number | null; onSelect: (farm: Farm) => void; onHeightChange?: (height: number) => void }) {
  const { height } = useWindowDimensions(); const minHeight = 248; const maxHeight = Math.min(520, Math.max(340, height * 0.7));
  const [sheetHeight, setSheetHeight] = useState(350); const sheetHeightRef = useRef(sheetHeight); const dragStart = useRef(sheetHeight);
  // Report the resting height to the parent on settle only (not every drag
  // frame) so overlay elements track the sheet without re-rendering the map
  // mid-gesture.
  const report = useCallback((next: number) => { onHeightChange?.(next); }, [onHeightChange]);
  useEffect(() => {
    const next = Math.min(Math.max(sheetHeightRef.current, minHeight), maxHeight);
    sheetHeightRef.current = next; setSheetHeight(next); report(next);
  }, [maxHeight, report]);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
    onPanResponderGrant: () => { dragStart.current = sheetHeightRef.current; },
    onPanResponderMove: (_, gesture) => { const next = Math.min(maxHeight, Math.max(minHeight, dragStart.current - gesture.dy)); sheetHeightRef.current = next; setSheetHeight(next); },
    onPanResponderRelease: (_, gesture) => { const next = gesture.vy < -0.3 || sheetHeightRef.current > (minHeight + maxHeight) / 2 ? maxHeight : minHeight; sheetHeightRef.current = next; setSheetHeight(next); report(next); },
  }), [maxHeight, report]);
  return <View style={[styles.sheet, { height: sheetHeight }]}>
    <View {...panResponder.panHandlers} style={styles.sheetHandleArea}><View style={styles.sheetHandle} /></View>
    <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{farms.length} nearby farms</Text></View>
    <FlatList data={farms} keyExtractor={(farm) => String(farm.id)} contentContainerStyle={styles.sheetList} showsVerticalScrollIndicator={false} ListEmptyComponent={<Text style={styles.emptyText}>No farms match those filters.</Text>} renderItem={({ item: farm }) => <Pressable accessibilityRole="button" onPress={() => onSelect(farm)} style={[styles.listCard, selectedFarmId === farm.id && styles.listCardSelected]}><Image source={{ uri: farm.thumbnail_url ?? undefined }} contentFit="cover" style={styles.listImage} /><View style={styles.listContent}><Text numberOfLines={1} style={styles.listName}>{farm.name}</Text><Text numberOfLines={1} style={styles.listMeta}>{[farm.city, farm.region].filter(Boolean).join(', ')} · {categoryFor(farm)}</Text><Text style={styles.listRating}>★ {formatRating(farm.average_rating)} · {pinSummary(farm)}</Text></View></Pressable>} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', height: '100%', position: 'relative', alignSelf: 'stretch', backgroundColor: Colors.light.background },
  filterOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  filterScroll: { flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' }, filterBar: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 10 },
  filterChip: { flexShrink: 0, flexGrow: 0, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: Colors.light.border, shadowColor: '#2E2A26', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }, filterChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, filterChipText: { fontSize: 13, fontWeight: '700', color: Colors.light.text }, filterChipTextActive: { color: Colors.light.onPrimary },
  pin: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, backgroundColor: Colors.light.backgroundElement, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 5, elevation: 3 }, pinSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary, transform: [{ scale: 1.18 }] }, pinEmoji: { fontSize: 16, lineHeight: 20 },
  userMarker: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, userPulse: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: '#2563EB' }, userDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 3, borderColor: '#FFFFFF' },
  fab: { position: 'absolute', right: Spacing.three, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.backgroundElement, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }, fabPressed: { opacity: 0.85 }, fabRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.light.primary }, fabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.primary },
  previewCard: { width: 260, overflow: 'hidden', backgroundColor: Colors.light.backgroundElement, borderRadius: Radius.lg, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14, elevation: 8 }, previewImage: { width: '100%', height: 110, backgroundColor: '#D6D3D1' }, previewContent: { padding: 12, gap: 4 }, previewName: { color: Colors.light.text, fontSize: 16, fontWeight: '800' }, previewMeta: { color: Colors.light.textSecondary, fontSize: 12 }, previewRating: { color: Colors.light.text, fontSize: 13, fontWeight: '700' }, badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, badge: { maxWidth: 112, paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: '#E4F0E6' }, badgeText: { color: Colors.light.primary, fontSize: 10, fontWeight: '700' }, viewProfileButton: { marginTop: 4, alignItems: 'center', borderRadius: Radius.sm, paddingVertical: 8, backgroundColor: Colors.light.primary }, viewProfileText: { color: Colors.light.onPrimary, fontSize: 13, fontWeight: '800' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, backgroundColor: Colors.light.backgroundElement, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, elevation: 12 }, sheetHandleArea: { alignItems: 'center', paddingHorizontal: Spacing.three, paddingBottom: 2 }, sheetHandle: { width: 42, height: 5, borderRadius: Radius.pill, backgroundColor: '#C9C4BA', marginBottom: 3 }, sheetHeader: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two }, sheetTitle: { color: Colors.light.text, fontSize: 16, fontWeight: '800' }, sheetList: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.two }, listCard: { flexDirection: 'row', gap: 12, padding: 8, borderRadius: Radius.md, backgroundColor: Colors.light.background }, listCardSelected: { backgroundColor: '#E4F0E6', borderWidth: 1, borderColor: Colors.light.primary }, listImage: { width: 68, height: 68, borderRadius: Radius.sm, backgroundColor: '#D6D3D1' }, listContent: { flex: 1, justifyContent: 'center', gap: 3 }, listName: { color: Colors.light.text, fontSize: 14, fontWeight: '800' }, listMeta: { color: Colors.light.textSecondary, fontSize: 12 }, listRating: { color: Colors.light.text, fontSize: 12, fontWeight: '600' }, emptyText: { color: Colors.light.textSecondary, paddingVertical: Spacing.four, textAlign: 'center' },
});
