import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { store } from './store';
import updateService from './services/updateService';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import NewReportScreen from './screens/NewReportScreen';
import UnifiedNewReportScreen from './screens/UnifiedNewReportScreen';
import ReportHistoryScreen from './screens/ReportHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductsScreen from './screens/ProductsScreen';
import CartScreen from './screens/CartScreen';

const Stack = createStackNavigator();

function AppContent() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    updateService.startAutoCheck(30);
    return () => {
      updateService.stopAutoCheck();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="NewReport" component={NewReportScreen} />
        <Stack.Screen name="UnifiedNewReport" component={UnifiedNewReportScreen} />
        <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
