import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { useHabits } from '@/store/habitsStore';
import { HabitCard } from '@/components/HabitCard';
import { EmptyState } from '@/components/EmptyState';
import { dayKey } from '@/utils/dates';
import { dueToday } from '@/utils/streaks';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const habits = useHabits((s) => s.habits);
  const toggleCompletion = useHabits((s) => s.toggleCompletion);

  const todayKey = dayKey();
  const visibleHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt),
    [habits],
  );
  const todays = useMemo(
    () => visibleHabits.filter((h) => dueToday(h)),
    [visibleHabits],
  );
  const completedCount = useMemo(
    () => todays.filter((h) => h.completions[todayKey]).length,
    [todays, todayKey],
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Buenas noches';
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const allDone = todays.length > 0 && completedCount === todays.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
          {greeting.toUpperCase()}
        </Text>
        <Text
          style={[
            theme.typography.title,
            { color: theme.colors.text, marginTop: 4 },
          ]}
        >
          {allDone ? '¡Día completo!' : 'Tus hábitos de hoy'}
        </Text>

        {todays.length > 0 && (
          <View
            style={[
              styles.progress,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.progressTextRow}>
              <Text style={[theme.typography.subheading, { color: theme.colors.text }]}>
                {completedCount} de {todays.length} completados
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                {Math.round((completedCount / todays.length) * 100)}%
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: theme.colors.divider }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${(completedCount / todays.length) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <View style={{ marginTop: 18 }}>
          {todays.length === 0 ? (
            <EmptyState
              emoji="✨"
              title="Crea tu primer hábito"
              subtitle="Pulsa el botón de abajo para empezar. Pequeñas acciones, grandes resultados."
            />
          ) : (
            todays.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                onToggle={toggleCompletion}
                onPress={(id) => nav.navigate('HabitDetail', { habitId: id })}
              />
            ))
          )}
        </View>

        {visibleHabits.length > todays.length && (
          <View style={{ marginTop: 24 }}>
            <Text style={[theme.typography.subheading, { color: theme.colors.textMuted }]}>
              Hoy no tocan
            </Text>
            <View style={{ marginTop: 10 }}>
              {visibleHabits
                .filter((h) => !dueToday(h))
                .map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    onToggle={toggleCompletion}
                    onPress={(id) => nav.navigate('HabitDetail', { habitId: id })}
                  />
                ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => nav.navigate('CreateHabit')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom + 16,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  progress: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barBg: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabPlus: { color: 'white', fontSize: 30, fontWeight: '300', lineHeight: 32 },
});
