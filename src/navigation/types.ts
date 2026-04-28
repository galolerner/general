export type RootStackParamList = {
  Tabs: undefined;
  CreateHabit: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
  Onboarding: undefined;
};

export type TabParamList = {
  Home: undefined;
  Dashboard: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
