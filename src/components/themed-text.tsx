import { StyleSheet, Text, type TextProps } from 'react-native';

import { Font, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'eyebrow'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'subtitle' && styles.subtitle,
        type === 'heading' && styles.heading,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'eyebrow' && styles.eyebrow,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Font.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: Font.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  heading: {
    fontFamily: Font.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  small: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  eyebrow: {
    fontFamily: Font.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    fontFamily: Font.medium,
    fontSize: 14,
    lineHeight: 30,
  },
  linkPrimary: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 30,
    color: '#2C5F2D',
  },
  code: {
    fontFamily: 'ui-monospace',
    fontSize: 12,
  },
});
