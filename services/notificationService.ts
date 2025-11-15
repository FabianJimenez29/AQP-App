import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
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
      // Verificar que sea un dispositivo físico
      if (!Device.isDevice) {
        console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('No se otorgaron permisos para notificaciones');
        return null;
      }

      // Obtener el token de Expo Push
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '5fb6376d-a84c-4505-b587-1f68067ad442', // Tu project ID de EAS
      });

      this.expoPushToken = tokenData.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);

      // Enviar el token al backend
      await this.sendTokenToBackend(userId, this.expoPushToken, token);

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0284c7',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registrando notificaciones:', error);
      return null;
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

      await apiService.post(
        '/notifications/push-token',
        {
          userId,
          pushToken,
          platform,
          deviceName,
        },
        authToken
      );

      console.log('✅ Push token saved to backend');
    } catch (error) {
      console.error('Error saving push token to backend:', error);
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
