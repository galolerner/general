import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { habitColor, useTheme } from '@/theme';
import { dayKey } from '@/utils/dates';
import { isScheduled, isCompleted } from '@/utils/streaks';
import type { Habit } from '@/types';

type Props = { habit: Habit };

export const MonthHeatmap = ({ habit }: Props) => {
  const theme = useTheme();
  const c = habitColor(habit.color);
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return (
    <View>
      <Text
        style={[
          theme.typography.subheading,
          { color: theme.colors.text, marginBottom: 10 },
        ]}
      >
        {format(start, 'LLLL yyyy')}
      </Text>
      <View style={styles.grid}>
        {days.map((d) => {
          const scheduled = isScheduled(habit.frequency, d);
          const done = isCompleted(habit, d);
          return (
            <View
              key={dayKey(d)}
              style={[
                styles.cell,
                {
                  backgroundColor: done
                    ? c.base
                    : scheduled
                    ? c.soft
                    : theme.colors.divider,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const CELL = 14;
const GAP = 4;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 4,
  },
});
