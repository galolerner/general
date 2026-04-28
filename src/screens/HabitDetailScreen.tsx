import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { habitColor, useTheme } from '@/theme';
import { useHabits } from '@/store/habitsStore';
import { StatPill } from '@/components/StatPill';
import { WeekStrip } from '@/components/WeekStrip';
import { MonthHeatmap } from '@/components/MonthHeatmap';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  bestStreak,
  completionRate,
  currentStreak,
  isCompleted,
} from '@/utils/streaks';
import { suggestSmartReminder } from '@/services/notifications';
import type { RootStackParamList } from '@/navigation/types';

type RouteT = RouteProp<RootStackParamList, 'HabitDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export const HabitDetailScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteT>();
  const nav = useNavigation<Nav>();

  const habit = useHabits((s) => s.habits.find((h) => h.id === route.params.habitId));
  const toggleCompletion = useHabits((s) => s.toggleCompletion);
  const deleteHabit = useHabits((s) => s.deleteHabit);
  const updateHabit = useHabits((s) => s.updateHabit);

  const smartTime = useMemo(
    () => (habit ? suggestSmartReminder(habit) : undefined),
    [habit],
  );

  if (!habit) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ color: theme.colors.textMuted }}>Hábito no encontrado.</Text>
      </View>
    );
  }

  const c = habitColor(habit.color);
  const todayDone = isCompleted(habit, new Date());

  const onDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      'Se borrará junto con todo su historial. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteHabit(habit.id);
            nav.goBack();
          },
        },
      ],
    );
  };

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
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}>
          <Text style={[theme.typography.subheading, { color: theme.colors.textMuted }]}>
            ← Atrás
          </Text>
        </Pressable>
        <Pressable
          onPress={() => nav.navigate('CreateHabit', { habitId: habit.id })}
          hitSlop={12}
        >
          <Text style={[theme.typography.subheading, { color: c.base }]}>Editar</Text>
        </Pressable>
      </View>

      <View style={[styles.heroIcon, { backgroundColor: c.soft }]}>
        <Text style={{ fontSize: 36 }}>{habit.emoji}</Text>
      </View>
      <Text style={[theme.typography.title, { color: theme.colors.text, marginTop: 12 }]}>
        {habit.name}
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginTop: 4 }]}>
        {habit.frequency.kind === 'daily'
          ? 'Cada día'
          : habit.frequency.kind === 'weekly'
          ? `${habit.frequency.timesPerWeek}x por semana`
          : 'Días específicos'}
        {habit.reminderTime ? ` • Recordatorio ${habit.reminderTime}` : ''}
      </Text>

      <View style={[styles.statsRow, { marginTop: 16 }]}>
        <StatPill label="Racha" value={currentStreak(habit)} accent={c.base} />
        <View style={{ width: 10 }} />
        <StatPill label="Mejor" value={bestStreak(habit)} />
        <View style={{ width: 10 }} />
        <StatPill label="% mes" value={`${completionRate(habit, 30)}%`} />
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[theme.typography.subheading, { color: theme.colors.text }]}>
          Esta semana
        </Text>
        <View style={{ marginTop: 12 }}>
          <WeekStrip habit={habit} />
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <MonthHeatmap habit={habit} />
      </View>

      {smartTime && smartTime !== habit.reminderTime && (
        <Pressable
          onPress={() => updateHabit(habit.id, { reminderTime: smartTime })}
          style={[
            styles.smartCard,
            { backgroundColor: c.soft, borderColor: c.base },
          ]}
        >
          <Text style={{ fontSize: 22 }}>🧠</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[theme.typography.subheading, { color: theme.colors.text }]}>
              Recordatorio inteligente
            </Text>
            <Text
              style={[theme.typography.caption, { color: theme.colors.textMuted, marginTop: 2 }]}
            >
              Solés completar este hábito sobre las {smartTime}. Activarlo a esa hora.
            </Text>
          </View>
        </Pressable>
      )}

      <PrimaryButton
        label={todayDone ? 'Desmarcar hoy' : 'Marcar como hecho'}
        onPress={() => toggleCompletion(habit.id)}
        style={{ marginTop: 20, backgroundColor: todayDone ? theme.colors.cardElevated : c.base }}
      />

      <PrimaryButton
        label="Eliminar hábito"
        variant="danger"
        onPress={onDelete}
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statsRow: { flexDirection: 'row' },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  smartCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
