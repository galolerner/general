import { create } from 'zustand';
import type { AppState, Habit, HabitColor, Frequency } from '@/types';
import { loadState, saveState } from '@/services/storage';
import { dayKey } from '@/utils/dates';
import {
  scheduleHabitReminder,
  cancelHabitReminder,
} from '@/services/notifications';

type Store = AppState & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  finishOnboarding: () => void;
  addHabit: (input: {
    name: string;
    emoji: string;
    color: HabitColor;
    frequency: Frequency;
    reminderTime?: string;
    stackedAfter?: string;
  }) => Habit;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (id: string, date?: string) => void;
};

const persist = (state: AppState) => {
  void saveState(state);
};

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useHabits = create<Store>((set, get) => ({
  habits: [],
  hasOnboarded: false,
  hydrated: false,

  hydrate: async () => {
    const stored = await loadState();
    if (stored) {
      set({
        habits: stored.habits,
        hasOnboarded: stored.hasOnboarded,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  finishOnboarding: () => {
    set({ hasOnboarded: true });
    persist({ habits: get().habits, hasOnboarded: true });
  },

  addHabit: (input) => {
    const habit: Habit = {
      id: newId(),
      name: input.name,
      emoji: input.emoji,
      color: input.color,
      frequency: input.frequency,
      reminderTime: input.reminderTime,
      stackedAfter: input.stackedAfter,
      createdAt: new Date().toISOString(),
      completions: {},
    };
    const next = [...get().habits, habit];
    set({ habits: next });
    persist({ habits: next, hasOnboarded: get().hasOnboarded });
    if (habit.reminderTime) void scheduleHabitReminder(habit);
    return habit;
  },

  updateHabit: (id, patch) => {
    const next = get().habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
    set({ habits: next });
    persist({ habits: next, hasOnboarded: get().hasOnboarded });
    const updated = next.find((h) => h.id === id);
    if (updated) {
      if (updated.reminderTime) void scheduleHabitReminder(updated);
      else void cancelHabitReminder(updated.id);
    }
  },

  deleteHabit: (id) => {
    const next = get().habits.filter((h) => h.id !== id);
    set({ habits: next });
    persist({ habits: next, hasOnboarded: get().hasOnboarded });
    void cancelHabitReminder(id);
  },

  toggleCompletion: (id, date) => {
    const key = date ?? dayKey();
    const next = get().habits.map((h) => {
      if (h.id !== id) return h;
      const completions = { ...h.completions };
      if (completions[key]) {
        delete completions[key];
      } else {
        completions[key] = { at: new Date().toISOString() };
      }
      return { ...h, completions };
    });
    set({ habits: next });
    persist({ habits: next, hasOnboarded: get().hasOnboarded });
  },
}));
