import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiService from './api';

// Configurar el comportamiento de las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Registrar el dispositivo para recibir notificaciones
   */
  async registerForPushNotifications(userId: string, token: string): Promise<string | null> {
    try {
      console.log('🔔 Iniciando registro de notificaciones...');
      console.log('   User ID:', userId);
      
      // Verificar que sea un dispositivo físico
      if (!Device.isDevice) {
        console.warn('❌ Las notificaciones push solo funcionan en dispositivos físicos');
        return null;
      }
      console.log('✅ Es un dispositivo físico');

      // Solicitar permisos
      console.log('📋 Solicitando permisos...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log('   Estado actual de permisos:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('   Nuevo estado después de solicitar:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.warn('❌ No se otorgaron permisos para notificaciones');
        return null;
      }
      console.log('✅ Permisos otorgados');

      // Obtener el Expo Push Token
      console.log('🎫 Obteniendo Expo Push Token...');
      console.log('   Project ID:', Constants.expoConfig?.extra?.eas?.projectId);
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('✅ Expo Push Token obtenido:', this.expoPushToken);

      // Enviar el token al backend
      console.log('📤 Enviando token al backend...');
      await this.sendTokenToBackend(userId, this.expoPushToken, token);
      console.log('✅ Token enviado al backend exitosamente');

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        console.log('🔧 Configurando canal de Android...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0284c7',
        });
        console.log('✅ Canal de Android configurado');
      }

      console.log('🎉 Registro de notificaciones completado exitosamente');
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error registrando notificaciones:', error);
      throw error;
    }
  }

  /**
   * Enviar el token al backend para guardarlo
   */
  async sendTokenToBackend(
    userId: string,
    pushToken: string,
    authToken: string
  ): Promise<void> {
    try {
      const platform = Platform.OS;
      const deviceName = Device.modelName || 'Unknown Device';

      console.log('📤 Datos a enviar al backend:');
      console.log('   userId:', userId);
      console.log('   pushToken:', pushToken);
      console.log('   platform:', platform);
      console.log('   deviceName:', deviceName);
      console.log('   authToken:', authToken ? 'Presente' : 'Ausente');

      const response = await apiService.post(
        '/notifications/push-token',
        {
          userId,
          pushToken,
          platform,
          deviceName,
        },
        authToken
      );

      console.log('✅ Respuesta del backend:', response);
    } catch (error) {
      console.error('❌ Error guardando push token en backend:', error);
      throw error;
    }
  }

  /**
   * Agregar listener para notificaciones recibidas
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Agregar listener para cuando el usuario toca una notificación
   */
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Obtener el token actual
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Obtener el badge count actual
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Establecer el badge count
   */
  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();
