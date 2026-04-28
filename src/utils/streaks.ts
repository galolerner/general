import { addDays, getDay } from 'date-fns';
import { dayKey } from './dates';
import type { Frequency, Habit } from '@/types';

export const isScheduled = (freq: Frequency, date: Date): boolean => {
  if (freq.kind === 'daily') return true;
  if (freq.kind === 'weekly') return true;
  return freq.weekdays.includes(getDay(date));
};

export const isCompleted = (habit: Habit, date: Date | string): boolean =>
  Boolean(habit.completions[dayKey(date)]);

export const currentStreak = (habit: Habit, ref: Date = new Date()): number => {
  let streak = 0;
  let cursor = new Date(ref);
  let allowMissToday = isCompleted(habit, cursor) === false;
  while (true) {
    if (isScheduled(habit.frequency, cursor)) {
      if (isCompleted(habit, cursor)) {
        streak += 1;
      } else if (allowMissToday) {
        allowMissToday = false;
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    if (streak > 3650) break;
    const created = new Date(habit.createdAt);
    if (cursor < created) break;
  }
  return streak;
};

export const bestStreak = (habit: Habit): number => {
  const created = new Date(habit.createdAt);
  let best = 0;
  let run = 0;
  let cursor = new Date(created);
  const end = new Date();
  while (cursor <= end) {
    if (isScheduled(habit.frequency, cursor)) {
      if (isCompleted(habit, cursor)) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    cursor = addDays(cursor, 1);
    if (best > 3650) break;
  }
  return best;
};

export const completionRate = (habit: Habit, days = 30): number => {
  let scheduled = 0;
  let done = 0;
  let cursor = addDays(new Date(), -(days - 1));
  for (let i = 0; i < days; i++) {
    if (cursor >= new Date(habit.createdAt) && isScheduled(habit.frequency, cursor)) {
      scheduled += 1;
      if (isCompleted(habit, cursor)) done += 1;
    }
    cursor = addDays(cursor, 1);
  }
  if (scheduled === 0) return 0;
  return Math.round((done / scheduled) * 100);
};

export const dueToday = (habit: Habit, ref: Date = new Date()): boolean =>
  isScheduled(habit.frequency, ref);
