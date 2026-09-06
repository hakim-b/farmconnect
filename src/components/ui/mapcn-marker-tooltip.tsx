import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Callout, Marker, type Region } from 'react-native-maps';

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

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
};

export function MapMarker({ children, coordinate, onPress }: MapMarkerProps) {
  return (
    <Marker coordinate={coordinate} onPress={onPress} tracksViewChanges>
      {children}
    </Marker>
  );
}

/** Content rendered at a marker's coordinate. */
export function MarkerContent({ children }: { children: ReactNode }) {
  return <View collapsable={false}>{children}</View>;
}

/** Native callout counterpart to the web floating marker tooltip. */
export function MarkerTooltip({ children }: { children: ReactNode }) {
  return (
    <Callout tooltip>
      <View>{children}</View>
    </Callout>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
