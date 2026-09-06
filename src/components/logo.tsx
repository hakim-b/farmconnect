import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** FarmConnect mark — a shopping basket with a leaf. One colour, scalable. */
export function FarmConnectMark({ size = 40, color }: { size?: number; color?: string }) {
  const theme = useTheme();
  const fill = color ?? theme.primary;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      {/* stem */}
      <Path
        d="M47 45 C 47 31 51 22 61 18"
        stroke={fill}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {/* leaf */}
      <Path d="M57 27 C 59 12 71 3 85 6 C 83 21 70 30 57 27 Z" fill={fill} />
      {/* basket body + rim, with 3 slot holes (even-odd) */}
      <Path
        fillRule="evenodd"
        d="M18 39 Q11 39 11 46 Q11 53 18 53 L20 53 L25 84 Q25.5 88 30 88 L66 88 Q70.5 88 71 84 L76 53 L78 53 Q85 53 85 46 Q85 39 78 39 Z
           M32 61 Q32 58.5 34.5 58.5 Q37 58.5 37 61 L37 76 Q37 78.5 34.5 78.5 Q32 78.5 32 76 Z
           M45.5 61 Q45.5 58.5 48 58.5 Q50.5 58.5 50.5 61 L50.5 76 Q50.5 78.5 48 78.5 Q45.5 78.5 45.5 76 Z
           M59 61 Q59 58.5 61.5 58.5 Q64 58.5 64 61 L64 76 Q64 78.5 61.5 78.5 Q59 78.5 59 76 Z"
        fill={fill}
      />
      {/* knob where the stem meets the rim */}
      <Circle cx={47} cy={46} r={7} fill={fill} />
    </Svg>
  );
}

/** The mark next to the FarmConnect name — a horizontal lockup. */
export function Wordmark({
  markSize = 30,
  style,
}: {
  markSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.lockup, style]}>
      <FarmConnectMark size={markSize} />
      <ThemedText style={[styles.word, { fontSize: Math.round(markSize * 0.66) }]}>
        FarmConnect
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  word: {
    fontFamily: Font.bold,
  },
});
