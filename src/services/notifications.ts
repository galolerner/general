import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const ensurePermissions = async (): Promise<boolean> => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
};

export const ensureAndroidChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('habit-reminders', {
    name: 'Recordatorios de hábitos',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
};

const reminderId = (habitId: string) => `reminder-${habitId}`;

export const scheduleHabitReminder = async (habit: Habit): Promise<void> => {
  if (!habit.reminderTime) return;
  const ok = await ensurePermissions();
  if (!ok) return;
  await ensureAndroidChannel();

  await Notifications.cancelScheduledNotificationAsync(reminderId(habit.id)).catch(
    () => undefined,
  );

  const [hh, mm] = habit.reminderTime.split(':').map((s) => parseInt(s, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: reminderId(habit.id),
    content: {
      title: `${habit.emoji}  ${habit.name}`,
      body: 'Hora de tu hábito. Marca tu racha de hoy.',
      data: { habitId: habit.id },
    },
    trigger: {
      hour: hh,
      minute: mm,
      repeats: true,
      channelId: 'habit-reminders',
    },
  });
};

export const cancelHabitReminder = async (habitId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(reminderId(habitId)).catch(
    () => undefined,
  );
};

export const suggestSmartReminder = (habit: Habit): string | undefined => {
  const times = Object.values(habit.completions)
    .map((c) => new Date(c.at))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (times.length < 3) return undefined;
  const minutes = times.map((d) => d.getHours() * 60 + d.getMinutes());
  minutes.sort((a, b) => a - b);
  const median = minutes[Math.floor(minutes.length / 2)];
  const target = Math.max(0, median - 15);
  const hh = Math.floor(target / 60).toString().padStart(2, '0');
  const mm = (target % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};
