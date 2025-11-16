import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { store } from './store';
import notificationService from './services/notificationService';
import updateService from './services/updateService';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import NewReportScreen from './screens/NewReportScreen';
import UnifiedNewReportScreen from './screens/UnifiedNewReportScreen';
import ReportHistoryScreen from './screens/ReportHistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductsScreen from './DISABLED_app-old-routes/products';
import CartScreen from './DISABLED_app-old-routes/cart';

const Stack = createStackNavigator();

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppContent() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Iniciar verificación automática de actualizaciones cada 30 minutos
    updateService.startAutoCheck(30);

    // Listener para cuando se recibe una notificación (app en primer plano)
    const notificationListener = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notificación recibida:', notification);
        
        // Mostrar alerta con la notificación
        Alert.alert(
          notification.request.content.title || 'Notificación',
          notification.request.content.body || '',
          [{ text: 'OK' }]
        );
      }
    );

    // Listener para cuando el usuario toca una notificación
    const responseListener = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('👆 Notificación tocada:', response);
        
        // Aquí puedes navegar a una pantalla específica basado en los datos
        const data = response.notification.request.content.data;
        
        if (data?.screen && navigationRef.current) {
          navigationRef.current.navigate(data.screen, data.params || {});
        }
      }
    );

    // Cleanup
    return () => {
      notificationListener.remove();
      responseListener.remove();
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
