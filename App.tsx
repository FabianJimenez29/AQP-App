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
import ReportPreviewScreen from './screens/ReportPreviewScreen';

// Admin screens
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import AdminReportsScreen from './screens/AdminReportsScreen';
import AdminInventoryScreen from './screens/AdminInventoryScreen';
import AdminProjectsScreen from './screens/AdminProjectsScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminMonthlyReportScreen from './screens/AdminMonthlyReportScreen';

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
        <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
        <Stack.Screen name="ReportHistory" component={ReportHistoryScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboardScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
        <Stack.Screen name="AdminInventory" component={AdminInventoryScreen} />
        <Stack.Screen name="AdminProjects" component={AdminProjectsScreen} />
        <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
        <Stack.Screen name="AdminMonthlyReport" component={AdminMonthlyReportScreen} />
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
