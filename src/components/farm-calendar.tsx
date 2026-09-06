import { useColorScheme } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const todayString = () => new Date().toISOString().slice(0, 10);

/** yyyy-mm-dd for a local Date. */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Mark = { color: string };

/**
 * A big, plain month calendar. Tap a day to select it. `marks` puts a
 * coloured dot under days that have something on them.
 */
export function FarmCalendar({
  selected,
  onSelect,
  marks,
  allowPast = false,
}: {
  selected: string;
  onSelect: (dateString: string) => void;
  marks?: Record<string, Mark>;
  allowPast?: boolean;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();

  const markedDates: Record<string, object> = {};
  for (const [d, m] of Object.entries(marks ?? {})) {
    markedDates[d] = { marked: true, dotColor: m.color };
  }
  markedDates[selected] = {
    ...(markedDates[selected] ?? {}),
    selected: true,
    selectedColor: theme.primary,
    selectedTextColor: theme.onPrimary,
  };

  return (
    <Calendar
      // force a fresh render when the colour scheme flips
      key={`${scheme ?? 'light'}-${theme.surface}`}
      current={selected}
      minDate={allowPast ? undefined : todayString()}
      onDayPress={(d: DateData) => onSelect(d.dateString)}
      markedDates={markedDates}
      enableSwipeMonths
      firstDay={0}
      style={{ borderRadius: Radius.md, borderWidth: 1, borderColor: theme.border }}
      theme={{
        calendarBackground: theme.surface,
        monthTextColor: theme.text,
        textMonthFontWeight: '700',
        textMonthFontSize: 18,
        arrowColor: theme.primary,
        dayTextColor: theme.text,
        textDayFontSize: 16,
        textDayFontWeight: '500',
        textSectionTitleColor: theme.textSecondary,
        textDayHeaderFontSize: 13,
        textDisabledColor: theme.border,
        todayTextColor: theme.primary,
        todayBackgroundColor: theme.backgroundSelected,
        selectedDayBackgroundColor: theme.primary,
        selectedDayTextColor: theme.onPrimary,
        dotColor: theme.accent,
        selectedDotColor: theme.onPrimary,
      }}
    />
  );
}
