import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import 'react-native-reanimated';

import { store } from '../store';

const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" component={() => null} />
          <Stack.Screen name="login" component={() => null} />
          <Stack.Screen name="dashboard" component={() => null} />
          <Stack.Screen name="new-report" component={() => null} />
          <Stack.Screen name="unified-new-report" component={() => null} />
          <Stack.Screen name="report-history" component={() => null} />
          <Stack.Screen name="products" component={() => null} />
          <Stack.Screen name="profile" component={() => null} />
          <Stack.Screen name="cart" component={() => null} />
          <Stack.Screen name="not-found" component={() => null} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </Provider>
  );
}
