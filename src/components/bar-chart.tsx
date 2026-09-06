import { Fragment, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Datum = { label: string; value: number };

/**
 * Simple weekly-revenue bar chart. One series, one colour, value labelled on
 * top of each bar — nothing to hover, nothing to decode.
 */
export function RevenueBars({ data, height = 160 }: { data: Datum[]; height?: number }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const allZero = data.every((d) => d.value === 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const padTop = 24;
  const padBottom = 20;
  const plotH = height - padTop - padBottom;
  const n = data.length;
  const gap = 6;
  const barW = width > 0 ? Math.max(4, (width - gap * (n - 1)) / n) : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
      {allZero || width === 0 ? (
        <View style={[styles.empty, { height }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {width === 0 ? '' : 'No earnings yet — your first booking will show up here.'}
          </ThemedText>
        </View>
      ) : (
        <Svg width={width} height={height}>
          <Line
            x1={0}
            y1={padTop + plotH}
            x2={width}
            y2={padTop + plotH}
            stroke={theme.border}
            strokeWidth={1}
          />
          {data.map((d, i) => {
            const x = i * (barW + gap);
            const h = d.value > 0 ? Math.max(3, (d.value / max) * plotH) : 0;
            const y = padTop + plotH - h;
            return (
              <Fragment key={i}>
                {h > 0 ? (
                  <Rect x={x} y={y} width={barW} height={h} rx={4} fill={theme.primary} />
                ) : null}
                {d.value > 0 ? (
                  <SvgText
                    x={x + barW / 2}
                    y={y - 6}
                    fill={theme.text}
                    fontSize={10}
                    fontWeight="600"
                    textAnchor="middle">
                    {`$${d.value}`}
                  </SvgText>
                ) : null}
                <SvgText
                  x={x + barW / 2}
                  y={height - 5}
                  fill={theme.textSecondary}
                  fontSize={9}
                  textAnchor="middle">
                  {d.label}
                </SvgText>
              </Fragment>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
