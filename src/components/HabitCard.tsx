import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { habitColor, useTheme } from '@/theme';
import { currentStreak } from '@/utils/streaks';
import { dayKey } from '@/utils/dates';
import type { Habit } from '@/types';

type Props = {
  habit: Habit;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
};

const HabitCardBase = ({ habit, onToggle, onPress }: Props) => {
  const theme = useTheme();
  const c = habitColor(habit.color);
  const completedToday = Boolean(habit.completions[dayKey()]);
  const streak = currentStreak(habit);

  const checkScale = useSharedValue(completedToday ? 1 : 0);
  const checkOpacity = useSharedValue(completedToday ? 1 : 0);
  React.useEffect(() => {
    checkScale.value = withSpring(completedToday ? 1 : 0, {
      damping: 12,
      stiffness: 220,
    });
    checkOpacity.value = withTiming(completedToday ? 1 : 0, { duration: 140 });
  }, [completedToday, checkScale, checkOpacity]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handleToggle = useCallback(() => {
    void Haptics.impactAsync(
      completedToday
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    onToggle(habit.id);
  }, [habit.id, completedToday, onToggle]);

  return (
    <Pressable
      onPress={() => onPress(habit.id)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: completedToday ? c.base : theme.colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: c.soft }]}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={[theme.typography.subheading, { color: theme.colors.text }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.row}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
            {streak} {streak === 1 ? 'día' : 'días'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleToggle}
        hitSlop={12}
        style={[
          styles.checkBox,
          {
            borderColor: completedToday ? c.base : theme.colors.border,
            backgroundColor: completedToday ? c.base : 'transparent',
          },
        ]}
      >
        <Animated.Text style={[styles.check, checkStyle]}>✓</Animated.Text>
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  middle: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
  flame: { fontSize: 12 },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 18,
  },
});

export const HabitCard = memo(HabitCardBase);
