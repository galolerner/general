import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, habitColor } from '@/theme';
import { useHabits } from '@/store/habitsStore';
import { StatPill } from '@/components/StatPill';
import { WeekStrip } from '@/components/WeekStrip';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import { EmptyState } from '@/components/EmptyState';
import {
  bestStreak,
  completionRate,
  currentStreak,
} from '@/utils/streaks';

export const DashboardScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const habits = useHabits((s) => s.habits.filter((h) => !h.archivedAt));

  const stats = useMemo(() => {
    if (habits.length === 0) {
      return { current: 0, best: 0, rate: 0 };
    }
    const cur = Math.max(...habits.map((h) => currentStreak(h)));
    const best = Math.max(...habits.map((h) => bestStreak(h)));
    const rate = Math.round(
      habits.reduce((acc, h) => acc + completionRate(h, 30), 0) / habits.length,
    );
    return { current: cur, best, rate };
  }, [habits]);

  if (habits.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <EmptyState
          emoji="📊"
          title="Sin datos aún"
          subtitle="Crea hábitos y completa al menos uno para ver tu progreso."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
        TU PROGRESO
      </Text>
      <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 4 }]}>
        Dashboard
      </Text>

      <View style={styles.statsRow}>
        <StatPill label="Racha actual" value={stats.current} accent={theme.colors.primary} />
        <View style={{ width: 10 }} />
        <StatPill label="Mejor racha" value={stats.best} />
        <View style={{ width: 10 }} />
        <StatPill label="% mes" value={`${stats.rate}%`} accent={theme.colors.success} />
      </View>

      {habits.map((h) => {
        const c = habitColor(h.color);
        return (
          <View
            key={h.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBubble, { backgroundColor: c.soft }]}>
                <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[theme.typography.subheading, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {h.name}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                  Racha {currentStreak(h)} • Mejor {bestStreak(h)} • {completionRate(h, 30)}% mes
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 14 }}>
              <WeekStrip habit={h} />
            </View>
            <View style={{ marginTop: 18 }}>
              <MonthHeatmap habit={h} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  statsRow: { flexDirection: 'row', marginTop: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
