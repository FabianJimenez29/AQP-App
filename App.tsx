import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { store } from './store';
import updateService from './services/updateService';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { Alert } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import NewReportScreen from './screens/NewReportScreen';
import UnifiedNewReportScreen from './screens/UnifiedNewReportScreen';
import ReportHistoryScreen from './screens/ReportHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductsScreen from './screens/ProductsScreen';
import CartScreen from './screens/CartScreen';
import ReportPreviewScreen from './screens/ReportPreviewScreen';
import BreakdownReportScreen from './screens/BreakdownReportScreen';
import BreakdownPreviewScreen from './screens/BreakdownPreviewScreen';
import AdminReportPreviewScreen from './screens/AdminReportPreviewScreen';

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
    // Servicio de actualización de APK para Android
    updateService.startAutoCheck(30);
    
    // Forzar verificación de OTA updates (Expo Updates)
    checkForOTAUpdates();
    
    return () => {
      updateService.stopAutoCheck();
    };
  }, []);

  const checkForOTAUpdates = async () => {
    try {
      const isExpoGo = Constants.appOwnership === 'expo';
      if (__DEV__ || isExpoGo || !Updates.isEnabled) {
        console.log('ℹ️ OTA omitido: disponible solo en build instalada (no Expo Go).');
        return;
      }

      console.log('🔍 Verificando actualizaciones OTA...');
      
      // Verificar si hay actualizaciones disponibles
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        console.log('✅ Actualización OTA disponible, descargando...');
        
        // Descargar la actualización
        await Updates.fetchUpdateAsync();
        
        console.log('✅ Actualización descargada, aplicando...');
        
        // Mostrar alerta y reiniciar
        Alert.alert(
          '🎉 Actualización Disponible',
          'Se ha descargado una nueva versión. La app se reiniciará para aplicar los cambios.',
          [
            {
              text: 'Reiniciar Ahora',
              onPress: async () => {
                await Updates.reloadAsync();
              }
            }
          ]
        );
      } else {
        console.log('ℹ️ No hay actualizaciones OTA disponibles');
      }
    } catch (error) {
      console.error('❌ Error al verificar actualizaciones OTA:', error);
    }
  };

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
        <Stack.Screen name="BreakdownReport" component={BreakdownReportScreen} />
        <Stack.Screen name="BreakdownPreview" component={BreakdownPreviewScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
        {/* Admin Screens */}
        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboardScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
        <Stack.Screen name="AdminReportPreview" component={AdminReportPreviewScreen} />
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
