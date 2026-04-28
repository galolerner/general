import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { habitColor, useTheme } from '@/theme';
import { dayKey } from '@/utils/dates';
import { isScheduled, isCompleted } from '@/utils/streaks';
import type { Habit } from '@/types';

type Props = { habit: Habit; days?: number };

export const WeekStrip = ({ habit, days = 7 }: Props) => {
  const theme = useTheme();
  const c = habitColor(habit.color);
  const cells: Date[] = [];
  for (let i = days - 1; i >= 0; i--) cells.push(addDays(new Date(), -i));

  return (
    <View style={styles.row}>
      {cells.map((d) => {
        const k = dayKey(d);
        const scheduled = isScheduled(habit.frequency, d);
        const done = isCompleted(habit, d);
        const isToday = k === dayKey();
        return (
          <View key={k} style={styles.col}>
            <Text style={[theme.typography.tiny, { color: theme.colors.textMuted }]}>
              {format(d, 'EEEEEE').toUpperCase()}
            </Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: done
                    ? c.base
                    : scheduled
                    ? c.soft
                    : theme.colors.divider,
                  borderColor: isToday ? theme.colors.text : 'transparent',
                },
              ]}
            >
              <Text style={[styles.dayNum, { color: done ? 'white' : theme.colors.textMuted }]}>
                {format(d, 'd')}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 6, flex: 1 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayNum: { fontSize: 12, fontWeight: '700' },
});
