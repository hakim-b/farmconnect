import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/** Fraction of the marker view that sits over the coordinate: {x:0.5,y:1} pins the bottom-center. */
export type MapAnchor = { x: number; y: number };

export type MapRegion = Region;

export type MapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

type MapProps = {
  children: ReactNode;
  initialRegion: MapRegion;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * The app-level map primitive. Keeping the screen coupled to this small API lets
 * web and native use the same markers, cards, and camera interactions.
 */
export const Map = forwardRef<MapHandle, MapProps>(function Map(
  { children, initialRegion, onPress, style },
  forwardedRef,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(forwardedRef, () => ({
    animateToRegion(region, duration = 450) {
      mapRef.current?.animateToRegion(region, duration);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      onPress={onPress}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}>
      {children}
    </MapView>
  );
});

type MapMarkerProps = {
  children: ReactNode;
  coordinate: MapCoordinate;
  onPress?: () => void;
  /** Keep re-rendering the marker view (e.g. it animates or its selected state changes). */
  live?: boolean;
  /** Which point of the marker view sits on the coordinate. Defaults to center. */
  anchor?: MapAnchor;
  /** Draw order relative to sibling markers — raise it for the selected one. */
  zIndex?: number;
};

export function MapMarker({ children, coordinate, onPress, live = false, anchor, zIndex }: MapMarkerProps) {
  // react-native-maps repaints a custom marker view every frame while
  // `tracksViewChanges` is true, which stutters the whole map once several are
  // on screen. Track during the first paint (and while `live`), then freeze.
  const [painted, setPainted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setPainted(true), 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={anchor}
      zIndex={zIndex}
      tracksViewChanges={live || !painted}>
      {children}
    </Marker>
  );
}

/** Content rendered at a marker's coordinate. */
export function MarkerContent({ children }: { children: ReactNode }) {
  return <View collapsable={false}>{children}</View>;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
