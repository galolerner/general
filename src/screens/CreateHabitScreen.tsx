import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { habitColor, palette, useTheme } from '@/theme';
import { useHabits } from '@/store/habitsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { Frequency, HabitColor } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateHabit'>;
type RouteT = RouteProp<RootStackParamList, 'CreateHabit'>;

const EMOJIS = [
  '💪',
  '📚',
  '💧',
  '🏃',
  '🧘',
  '🥗',
  '😴',
  '✍️',
  '🎯',
  '🧠',
  '🌱',
  '💸',
  '🎸',
  '🎨',
  '☕',
  '🚭',
];

const COLORS: HabitColor[] = [
  'violet',
  'blue',
  'green',
  'orange',
  'pink',
  'red',
  'teal',
  'yellow',
];

const WEEKDAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export const CreateHabitScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const editingId = route.params?.habitId;

  const habits = useHabits((s) => s.habits);
  const addHabit = useHabits((s) => s.addHabit);
  const updateHabit = useHabits((s) => s.updateHabit);
  const editing = useMemo(
    () => habits.find((h) => h.id === editingId),
    [habits, editingId],
  );

  const [name, setName] = useState(editing?.name ?? '');
  const [emoji, setEmoji] = useState(editing?.emoji ?? '💪');
  const [color, setColor] = useState<HabitColor>(editing?.color ?? 'violet');
  const [freqKind, setFreqKind] = useState<Frequency['kind']>(
    editing?.frequency.kind ?? 'daily',
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    editing?.frequency.kind === 'specific' ? editing.frequency.weekdays : [1, 3, 5],
  );
  const [timesPerWeek, setTimesPerWeek] = useState<number>(
    editing?.frequency.kind === 'weekly' ? editing.frequency.timesPerWeek : 3,
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    Boolean(editing?.reminderTime),
  );
  const [reminderTime, setReminderTime] = useState(
    editing?.reminderTime ?? '08:00',
  );
  const [stackedAfter, setStackedAfter] = useState<string | undefined>(
    editing?.stackedAfter,
  );

  const buildFrequency = (): Frequency => {
    if (freqKind === 'daily') return { kind: 'daily' };
    if (freqKind === 'weekly') return { kind: 'weekly', timesPerWeek };
    return { kind: 'specific', weekdays };
  };

  const onSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updateHabit(editing.id, {
        name: trimmed,
        emoji,
        color,
        frequency: buildFrequency(),
        reminderTime: reminderEnabled ? reminderTime : undefined,
        stackedAfter,
      });
    } else {
      addHabit({
        name: trimmed,
        emoji,
        color,
        frequency: buildFrequency(),
        reminderTime: reminderEnabled ? reminderTime : undefined,
        stackedAfter,
      });
    }
    nav.goBack();
  };

  const accent = habitColor(color).base;
  const otherHabits = habits.filter((h) => h.id !== editingId && !h.archivedAt);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={() => nav.goBack()} hitSlop={12}>
            <Text style={[theme.typography.subheading, { color: theme.colors.textMuted }]}>
              Cancelar
            </Text>
          </Pressable>
          <Text style={[theme.typography.subheading, { color: theme.colors.text }]}>
            {editing ? 'Editar hábito' : 'Nuevo hábito'}
          </Text>
          <Pressable onPress={onSave} hitSlop={12} disabled={!name.trim()}>
            <Text
              style={[
                theme.typography.subheading,
                { color: name.trim() ? accent : theme.colors.textMuted },
              ]}
            >
              Guardar
            </Text>
          </Pressable>
        </View>

        <Section label="NOMBRE">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej. Leer 10 minutos"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            returnKeyType="done"
          />
        </Section>

        <Section label="ICONO">
          <View style={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[
                  styles.emojiCell,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: emoji === e ? accent : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section label="COLOR">
          <View style={styles.colorRow}>
            {COLORS.map((cName) => (
              <Pressable
                key={cName}
                onPress={() => setColor(cName)}
                style={[
                  styles.colorCell,
                  {
                    backgroundColor: palette[cName].base,
                    borderColor: color === cName ? theme.colors.text : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        </Section>

        <Section label="FRECUENCIA">
          <View style={styles.segment}>
            {(['daily', 'specific', 'weekly'] as const).map((k) => (
              <Pressable
                key={k}
                onPress={() => setFreqKind(k)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: freqKind === k ? accent : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: freqKind === k ? 'white' : theme.colors.text,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                >
                  {k === 'daily' ? 'Diario' : k === 'specific' ? 'Días' : 'X / semana'}
                </Text>
              </Pressable>
            ))}
          </View>

          {freqKind === 'specific' && (
            <View style={[styles.weekdayRow, { marginTop: 12 }]}>
              {WEEKDAYS.map((label, idx) => {
                const active = weekdays.includes(idx);
                return (
                  <Pressable
                    key={`${label}-${idx}`}
                    onPress={() =>
                      setWeekdays((prev) =>
                        prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
                      )
                    }
                    style={[
                      styles.weekday,
                      {
                        backgroundColor: active ? accent : theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? 'white' : theme.colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {freqKind === 'weekly' && (
            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setTimesPerWeek(n)}
                  style={[
                    styles.numCell,
                    {
                      backgroundColor:
                        timesPerWeek === n ? accent : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: timesPerWeek === n ? 'white' : theme.colors.text,
                      fontWeight: '700',
                    }}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        <Section label="RECORDATORIO">
          <View
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>
              Notificación diaria
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ true: accent, false: theme.colors.divider }}
            />
          </View>

          {reminderEnabled && (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  marginTop: 8,
                },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                Hora (HH:MM 24h)
              </Text>
              <TextInput
                value={reminderTime}
                onChangeText={(t) => setReminderTime(t)}
                placeholder="08:00"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                style={[
                  styles.timeInput,
                  {
                    color: theme.colors.text,
                    backgroundColor: theme.colors.cardElevated,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            </View>
          )}
        </Section>

        {otherHabits.length > 0 && (
          <Section label="HABIT STACKING (opcional)">
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted, marginBottom: 8 },
              ]}
            >
              Hazlo justo después de otro hábito que ya tengas.
            </Text>
            <View style={styles.stackList}>
              <Pressable
                onPress={() => setStackedAfter(undefined)}
                style={[
                  styles.stackItem,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: !stackedAfter ? accent : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                  Ninguno
                </Text>
              </Pressable>
              {otherHabits.map((h) => (
                <Pressable
                  key={h.id}
                  onPress={() => setStackedAfter(h.id)}
                  style={[
                    styles.stackItem,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: stackedAfter === h.id ? accent : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>{h.emoji}</Text>
                  <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                    {h.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        )}

        <PrimaryButton
          label={editing ? 'Guardar cambios' : 'Crear hábito'}
          onPress={onSave}
          disabled={!name.trim()}
          style={{ marginTop: 24, backgroundColor: accent }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={[
          theme.typography.tiny,
          { color: theme.colors.textMuted, marginBottom: 10, letterSpacing: 1 },
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 3,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  numCell: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeInput: {
    minWidth: 80,
    height: 36,
    paddingHorizontal: 10,
    fontSize: 16,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
  },
  stackList: { gap: 8 },
  stackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
});
