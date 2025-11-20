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
  private currentVersion = '1.0.10'; 
  private checkInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  
  startAutoCheck(intervalMinutes: number = 30) {
    this.checkForUpdates();

    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }


  async checkForUpdates(showNoUpdateMessage: boolean = false): Promise<void> {
    try {
      if (this.isUpdating) {
        return;
      }

      if (Platform.OS !== 'android') {
        return;
      }

      const updateInfo = await this.getLatestVersion();

      if (!updateInfo) {
        if (showNoUpdateMessage) {
          Alert.alert('Sin actualizaciones', 'Ya tienes la última versión instalada');
        }
        return;
      }

      if (this.compareVersions(updateInfo.version, this.currentVersion) > 0) {
        this.promptUpdate(updateInfo);
      } else {
        if (showNoUpdateMessage) {
          Alert.alert('App actualizada', 'Ya tienes la última versión instalada');
        }
      }
    } catch (error) {
      if (showNoUpdateMessage) {
        console.error('Error al verificar actualizaciones:', error);
      }
    }
  }


  private async getLatestVersion(): Promise<UpdateInfo | null> {
    try {
      const response = await apiService.get('/app-version/latest');
      return response as UpdateInfo;
    } catch (error) {
      return null;
    }
  }


  private promptUpdate(updateInfo: UpdateInfo) {
    const message = `
Nueva versión ${updateInfo.version} disponible

${updateInfo.releaseNotes || 'Mejoras y correcciones'}

¿Deseas actualizar ahora?
    `.trim();

    if (updateInfo.mandatory) {
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


  private async downloadAndInstall(updateInfo: UpdateInfo) {
    try {
      this.isUpdating = true;

      Alert.alert(
        'Descargando actualización',
        'Por favor espera...',
        [],
        { cancelable: false }
      );

      const apkPath = `${FileSystem.documentDirectory}update.apk`;

      const fileInfo = await FileSystem.getInfoAsync(apkPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(apkPath);
      }

      const downloadResult = await FileSystem.downloadAsync(
        updateInfo.downloadUrl,
        apkPath
      );

      if (downloadResult.status !== 200) {
        throw new Error('Error al descargar la actualización');
      }

      await this.installApk(downloadResult.uri);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo descargar la actualización. Intenta nuevamente más tarde.'
      );
    } finally {
      this.isUpdating = false;
    }
  }


  private async installApk(apkUri: string) {
    try {
      const contentUri = await FileSystem.getContentUriAsync(apkUri);

      await IntentLauncher.startActivityAsync(
        'android.intent.action.INSTALL_PACKAGE',
        {
          data: contentUri,
          flags: 1,
          type: 'application/vnd.android.package-archive',
        }
      );
    } catch (error) {
      if (apkUri.startsWith('file://')) {
        Linking.openURL(apkUri);
      }
    }
  }


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



  getCurrentVersion(): string {
    return this.currentVersion;
  }
}

export default new UpdateService();
