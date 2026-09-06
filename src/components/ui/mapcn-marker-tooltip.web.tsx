import {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  createContext,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/** Fraction of the marker view that sits over the coordinate: {x:0.5,y:1} pins the bottom-center. */
export type MapAnchor = { x: number; y: number };

export type MapRegion = MapCoordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

type MapContextValue = { region: MapRegion };
const MapContext = createContext<MapContextValue | null>(null);

type MapProps = {
  children: ReactNode;
  initialRegion: MapRegion;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Dependency-free web map surface. It preserves real geographic positioning,
 * camera movement, marker selection, and pan-safe surrounding-map dismissal.
 * Native builds use Apple/Google map tiles through react-native-maps.
 */
export const Map = forwardRef<MapHandle, MapProps>(function Map(
  { children, initialRegion, onPress, style },
  forwardedRef,
) {
  const [region, setRegion] = useState(initialRegion);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const layoutRef = useRef({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (layoutRef.current.width === width && layoutRef.current.height === height) return;
    layoutRef.current = { width, height };
    // The web marker positions are percentage based. Re-rendering after a
    // resize keeps those overlays aligned with the resized map surface.
    setLayoutVersion((version) => version + 1);
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    animateToRegion(nextRegion) {
      setRegion(nextRegion);
    },
  }));

  return (
    <MapContext.Provider value={{ region }}>
      <View key={layoutVersion} onLayout={handleLayout} style={[styles.map, style]}>
        <Pressable accessibilityLabel="Map" onPress={onPress} style={styles.canvas}>
          <View pointerEvents="none" style={styles.terrain}>
            <View style={styles.river} />
            <View style={[styles.road, styles.roadOne]} />
            <View style={[styles.road, styles.roadTwo]} />
          </View>
        </Pressable>
        <View pointerEvents="box-none" style={styles.markerLayer}>
          {children}
        </View>
      </View>
    </MapContext.Provider>
  );
});

type MapMarkerProps = {
  children: ReactNode;
  coordinate: MapCoordinate;
  onPress?: () => void;
  /** Accepted for parity with the native marker; the web marker always re-renders. */
  live?: boolean;
  /** Which point of the marker view sits on the coordinate. Defaults to center. */
  anchor?: MapAnchor;
  /** Draw order relative to sibling markers — raise it for the selected one. */
  zIndex?: number;
};

export function MapMarker({ children, coordinate, onPress, anchor, zIndex }: MapMarkerProps) {
  const context = useContext(MapContext);
  const position = useMemo(() => {
    if (!context) return { left: '50%' as const, top: '50%' as const };
    const { region } = context;
    return {
      left: `${50 + ((coordinate.longitude - region.longitude) / region.longitudeDelta) * 100}%` as const,
      top: `${50 - ((coordinate.latitude - region.latitude) / region.latitudeDelta) * 100}%` as const,
    };
  }, [context, coordinate.latitude, coordinate.longitude]);
  const offset = useMemo<ViewStyle>(() => ({
    transform: [
      { translateX: `${-100 * (anchor?.x ?? 0.5)}%` },
      { translateY: `${-100 * (anchor?.y ?? 0.5)}%` },
    ] as ViewStyle['transform'],
  }), [anchor?.x, anchor?.y]);

  return (
    <View pointerEvents="box-none" style={[styles.marker, position, offset, zIndex != null && { zIndex }]}>
      <Pressable onPress={onPress} style={styles.markerPressable}>
        {children}
      </Pressable>
    </View>
  );
}

export function MarkerContent({ children }: { children: ReactNode }) {
  return <View>{children}</View>;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#D9E8D5',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  markerLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  terrain: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#D9E8D5',
  },
  river: {
    position: 'absolute',
    width: '145%',
    height: 76,
    top: '43%',
    left: '-22%',
    backgroundColor: '#B9DDF0',
    transform: [{ rotate: '-18deg' }],
    borderRadius: 999,
  },
  road: {
    position: 'absolute',
    width: '145%',
    height: 5,
    left: '-20%',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(194, 179, 145, 0.52)',
  },
  roadOne: {
    top: '28%',
    transform: [{ rotate: '24deg' }],
  },
  roadTwo: {
    top: '69%',
    transform: [{ rotate: '-36deg' }],
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerPressable: {
    alignItems: 'center',
  },
});
