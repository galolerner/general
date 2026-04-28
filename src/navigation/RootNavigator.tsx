import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';
import { HomeScreen } from '@/screens/HomeScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { CreateHabitScreen } from '@/screens/CreateHabitScreen';
import { HabitDetailScreen } from '@/screens/HabitDetailScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import type { RootStackParamList, TabParamList } from './types';
import { useHabits } from '@/store/habitsStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

const HomeTabs = () => {
  const theme = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Hoy',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Progreso',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tabs.Navigator>
  );
};

export const RootNavigator = () => {
  const hasOnboarded = useHabits((s) => s.hasOnboarded);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Tabs" component={HomeTabs} />
          <Stack.Screen
            name="CreateHabit"
            component={CreateHabitScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
