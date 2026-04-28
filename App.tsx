import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useHabits } from '@/store/habitsStore';

const App = () => {
  const scheme = useColorScheme();
  const hydrate = useHabits((s) => s.hydrate);
  const hydrated = useHabits((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const themedNav = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: scheme === 'dark' ? '#0B0B0F' : '#F7F7FA',
    },
  };

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: scheme === 'dark' ? '#0B0B0F' : '#F7F7FA',
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={themedNav}>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
