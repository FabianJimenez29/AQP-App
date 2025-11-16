import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert, Linking } from 'react-native';
import apiService from './api';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  mandatory: boolean;
}

class UpdateService {
  private currentVersion = '1.0.2'; // Debe coincidir con app.json
  private checkInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  /**
   * Iniciar verificación automática de actualizaciones
   */
  startAutoCheck(intervalMinutes: number = 30) {
    // Verificar inmediatamente al iniciar
    this.checkForUpdates();

    // Verificar periódicamente
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Detener verificación automática
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Verificar si hay actualizaciones disponibles
   */
  async checkForUpdates(showNoUpdateMessage: boolean = false): Promise<void> {
    try {
      if (this.isUpdating) {
        console.log('Ya hay una actualización en progreso');
        return;
      }

      // Solo funciona en Android
      if (Platform.OS !== 'android') {
        return;
      }

      console.log('🔍 Verificando actualizaciones...');

      // Llamar al backend para obtener la última versión
      const updateInfo = await this.getLatestVersion();

      if (!updateInfo) {
        if (showNoUpdateMessage) {
          Alert.alert('Sin actualizaciones', 'Ya tienes la última versión instalada');
        }
        return;
      }

      // Comparar versiones
      if (this.compareVersions(updateInfo.version, this.currentVersion) > 0) {
        console.log(`🆕 Nueva versión disponible: ${updateInfo.version}`);
        this.promptUpdate(updateInfo);
      } else {
        console.log('✅ App actualizada');
        if (showNoUpdateMessage) {
          Alert.alert('App actualizada', 'Ya tienes la última versión instalada');
        }
      }
    } catch (error) {
      console.error('Error al verificar actualizaciones:', error);
    }
  }

  /**
   * Obtener información de la última versión desde el backend
   */
  private async getLatestVersion(): Promise<UpdateInfo | null> {
    try {
      const response = await apiService.get('/app-version/latest');
      return response as UpdateInfo;
    } catch (error) {
      console.error('Error obteniendo última versión:', error);
      return null;
    }
  }

  /**
   * Mostrar diálogo para actualizar
   */
  private promptUpdate(updateInfo: UpdateInfo) {
    const message = `
Nueva versión ${updateInfo.version} disponible

${updateInfo.releaseNotes || 'Mejoras y correcciones'}

¿Deseas actualizar ahora?
    `.trim();

    if (updateInfo.mandatory) {
      // Actualización obligatoria
      Alert.alert(
        '⚠️ Actualización Requerida',
        message,
        [
          {
            text: 'Actualizar',
            onPress: () => this.downloadAndInstall(updateInfo),
          },
        ],
        { cancelable: false }
      );
    } else {
      // Actualización opcional
      Alert.alert(
        '🔄 Actualización Disponible',
        message,
        [
          {
            text: 'Más tarde',
            style: 'cancel',
          },
          {
            text: 'Actualizar',
            onPress: () => this.downloadAndInstall(updateInfo),
          },
        ]
      );
    }
  }

  /**
   * Descargar e instalar la actualización
   */
  private async downloadAndInstall(updateInfo: UpdateInfo) {
    try {
      this.isUpdating = true;

      Alert.alert(
        'Descargando actualización',
        'Por favor espera...',
        [],
        { cancelable: false }
      );

      // Ruta donde se guardará el APK
      const apkPath = `${FileSystem.documentDirectory}update.apk`;

      // Eliminar APK anterior si existe
      const fileInfo = await FileSystem.getInfoAsync(apkPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(apkPath);
      }

      console.log('📥 Descargando actualización...');

      // Descargar el APK
      const downloadResult = await FileSystem.downloadAsync(
        updateInfo.downloadUrl,
        apkPath
      );

      if (downloadResult.status !== 200) {
        throw new Error('Error al descargar la actualización');
      }

      console.log('✅ Descarga completada');

      // Instalar el APK
      await this.installApk(downloadResult.uri);
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert(
        'Error',
        'No se pudo descargar la actualización. Intenta nuevamente más tarde.'
      );
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Instalar APK (solo Android)
   */
  private async installApk(apkUri: string) {
    try {
      // Convertir file:// a content:// para Android 7+
      const contentUri = await FileSystem.getContentUriAsync(apkUri);

      console.log('📲 Instalando actualización...');

      // Abrir el instalador de Android
      await IntentLauncher.startActivityAsync(
        'android.intent.action.INSTALL_PACKAGE',
        {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.android.package-archive',
        }
      );

      // Nota: La app se cerrará cuando se instale la actualización
      // El usuario deberá abrir la app manualmente después de instalar
    } catch (error) {
      console.error('Error al instalar APK:', error);
      
      // Fallback: abrir con el navegador
      if (apkUri.startsWith('file://')) {
        Linking.openURL(apkUri);
      }
    }
  }

  /**
   * Comparar versiones (formato: X.Y.Z)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }

    return 0;
  }

  /**
   * Obtener versión actual de la app
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }
}

export default new UpdateService();
