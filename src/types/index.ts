export type Frequency =
  | { kind: 'daily' }
  | { kind: 'weekly'; timesPerWeek: number }
  | { kind: 'specific'; weekdays: number[] };

export type HabitColor =
  | 'violet'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'red'
  | 'teal'
  | 'yellow';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  frequency: Frequency;
  createdAt: string;
  reminderTime?: string;
  stackedAfter?: string;
  archivedAt?: string;
  completions: Record<string, { at: string }>;
};

export type AppState = {
  habits: Habit[];
  hasOnboarded: boolean;
};
