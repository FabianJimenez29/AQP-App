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
  private currentVersion = '1.0.12'; 
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

      console.log('📥 Iniciando descarga de actualización...');
      console.log('   URL:', updateInfo.downloadUrl);

      Alert.alert(
        '📥 Descargando',
        'Descargando actualización...\nPuede tardar unos segundos.',
        [],
        { cancelable: false }
      );

      const apkPath = `${FileSystem.documentDirectory}update.apk`;
      console.log('   Guardando en:', apkPath);

      // Eliminar APK anterior si existe
      const fileInfo = await FileSystem.getInfoAsync(apkPath);
      if (fileInfo.exists) {
        console.log('🗑️  Eliminando APK anterior...');
        await FileSystem.deleteAsync(apkPath);
      }

      // Descargar el nuevo APK
      const downloadResult = await FileSystem.downloadAsync(
        updateInfo.downloadUrl,
        apkPath
      );

      console.log('📥 Descarga completada. Status:', downloadResult.status);

      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar (código ${downloadResult.status})`);
      }

      // Verificar el archivo descargado
      const downloadedFileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      console.log('📦 Archivo descargado:', downloadedFileInfo);

      if (!downloadedFileInfo.exists) {
        throw new Error('El archivo no se descargó correctamente');
      }

      const fileSizeMB = downloadedFileInfo.size 
        ? (downloadedFileInfo.size / 1024 / 1024).toFixed(2) 
        : 'desconocido';
      
      console.log(`✅ APK listo (${fileSizeMB} MB)`);

      // Cerrar el alert de descarga
      Alert.alert(
        '✅ Descarga Completa',
        `APK descargado (${fileSizeMB} MB)\n\nAhora se abrirá el instalador.`,
        [
          {
            text: 'Instalar',
            onPress: () => this.installApk(downloadResult.uri)
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Error en descarga:', error);
      Alert.alert(
        'Error al descargar',
        `No se pudo descargar la actualización.\n\nError: ${error.message}\n\nIntenta nuevamente o descarga el APK manualmente desde GitHub.`,
        [
          {
            text: 'Reintentar',
            onPress: () => this.downloadAndInstall(updateInfo)
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } finally {
      this.isUpdating = false;
    }
  }


  private async installApk(apkUri: string) {
    try {
      console.log('📦 Instalando APK desde:', apkUri);
      
      // Obtener el content URI para Android
      const contentUri = await FileSystem.getContentUriAsync(apkUri);
      console.log('📦 Content URI:', contentUri);

      // Intentar con Intent Launcher primero
      try {
        await IntentLauncher.startActivityAsync(
          'android.intent.action.INSTALL_PACKAGE',
          {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/vnd.android.package-archive',
          }
        );
        console.log('✅ Intent Launcher exitoso');
      } catch (intentError) {
        console.log('⚠️ Intent Launcher falló, intentando con Linking...');
        
        // Fallback: Usar Linking directamente
        const fileUrl = contentUri.startsWith('content://') ? contentUri : `file://${apkUri}`;
        const canOpen = await Linking.canOpenURL(fileUrl);
        
        if (canOpen) {
          await Linking.openURL(fileUrl);
          console.log('✅ Linking exitoso');
        } else {
          throw new Error('No se puede abrir el instalador');
        }
      }
    } catch (error: any) {
      console.error('❌ Error instalando APK:', error);
      
      // Mostrar instrucciones manuales
      Alert.alert(
        'Instalación Manual',
        'No se pudo abrir el instalador automáticamente.\n\nPasos:\n1. Ve a Descargas o Archivos\n2. Busca "update.apk"\n3. Tócalo para instalar\n4. Permite instalación de fuentes desconocidas si te lo pide',
        [{ text: 'Entendido' }]
      );
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
