import { format, startOfDay, addDays, differenceInCalendarDays } from 'date-fns';

export const dayKey = (d: Date | string = new Date()): string =>
  format(typeof d === 'string' ? new Date(d) : d, 'yyyy-MM-dd');

export const today = (): string => dayKey(new Date());

export const yesterday = (): string => dayKey(addDays(new Date(), -1));

export const lastNDays = (n: number): string[] => {
  const out: string[] = [];
  const base = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(addDays(base, -i)));
  return out;
};

export const daysBetween = (a: string, b: string): number =>
  differenceInCalendarDays(new Date(b), new Date(a));

export const weekdayShort = (d: Date | string): string =>
  format(typeof d === 'string' ? new Date(d) : d, 'EEEEEE');

export const monthLabel = (d: Date | string): string =>
  format(typeof d === 'string' ? new Date(d) : d, 'MMM yyyy');
