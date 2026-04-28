import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState } from '@/types';

const KEY = 'habitos.state.v1';

export const loadState = async (): Promise<AppState | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
};

export const saveState = async (state: AppState): Promise<void> => {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
};

export const clearState = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEY);
};
