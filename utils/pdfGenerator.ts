/**
 * Utilidad para generar PDFs localmente en el dispositivo
 * Usando expo-print para compatibilidad con Expo
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Convierte una imagen local a base64
 */
export const convertImageToBase64 = async (uri: string): Promise<string | null> => {
  if (!uri) {
    console.log('⚠️ URI de imagen vacía');
    return null;
  }
  
  try {
    console.log('🔄 Convirtiendo imagen:', uri);
    
    // Si ya es base64, devolverla tal cual
    if (uri.startsWith('data:image')) {
      console.log('✅ Imagen ya está en base64');
      return uri;
    }

    // Si es una URL HTTP, devolverla tal cual (puede ser del servidor)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('🌐 Imagen es URL remota:', uri);
      return uri;
    }

    // Convertir file:// a base64
    console.log('📁 Leyendo archivo local...');
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Detectar el tipo de imagen
    const extension = uri.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

    const base64Image = `data:${mimeType};base64,${base64}`;
    console.log('✅ Imagen convertida a base64, tamaño:', base64.length, 'chars');
    
    return base64Image;
  } catch (error) {
    console.error('❌ Error al convertir imagen a base64:', error);
    console.error('URI problemática:', uri);
    return null;
  }
};

/**
 * Genera un PDF desde HTML
 * @param html - Contenido HTML del reporte
 * @param fileName - Nombre del archivo (sin extensión)
 * @returns Ruta del PDF generado
 */
export const generatePDF = async (html: string, fileName: string): Promise<string> => {
  try {
    console.log('📄 Generando PDF:', fileName);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 595,    // A4 width in points (210mm)
      height: 842,   // A4 height in points (297mm)
    });

    // Mover el archivo a un directorio permanente con el nombre deseado
    const pdfPath = `${FileSystem.documentDirectory}${fileName}.pdf`;
    await FileSystem.moveAsync({
      from: uri,
      to: pdfPath,
    });
    
    console.log('✅ PDF generado exitosamente:', pdfPath);
    return pdfPath;
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw new Error('No se pudo generar el PDF');
  }
};

/**
 * Comparte un PDF usando el diálogo nativo del sistema
 * @param filePath - Ruta del archivo PDF
 */
export const sharePDF = async (filePath: string): Promise<void> => {
  try {
    console.log('📤 Compartiendo PDF:', filePath);
    
    // Verifica que el archivo existe
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      throw new Error('El archivo no existe');
    }

    // Verifica que la funcionalidad de compartir está disponible
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('La función de compartir no está disponible en este dispositivo');
    }

    // Crear una copia con nombre limpio mejora compatibilidad en algunos destinos (ej. WhatsApp en iOS).
    const cleanName = `reporte_${Date.now()}.pdf`;
    const sharePath = `${FileSystem.cacheDirectory}${cleanName}`;
    await FileSystem.copyAsync({
      from: filePath,
      to: sharePath,
    });

    // iOS es mas estable compartiendo PDF sin mimeType explicito.
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(sharePath, {
        dialogTitle: 'Compartir Reporte',
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Sharing.shareAsync(sharePath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte',
        UTI: 'com.adobe.pdf',
      });
    }

    console.log('✅ PDF compartido exitosamente');
  } catch (error) {
    console.error('❌ Error al compartir PDF:', error);
    throw error;
  }
};

/**
 * Descarga un PDF remoto al almacenamiento local del dispositivo
 * @param fileUrl - URL absoluta del PDF
 * @param fileName - Nombre base del archivo (opcional)
 */
export const downloadPDF = async (fileUrl: string, fileName?: string): Promise<string> => {
  try {
    if (!fileUrl) {
      throw new Error('URL de PDF inválida');
    }

    const baseName = (fileName || `reporte_${Date.now()}`)
      .replace(/\.pdf$/i, '')
      .replace(/[/\\?%*:|"<>]/g, '_');

    const targetPath = `${FileSystem.documentDirectory}${baseName}.pdf`;
    const downloadResult = await FileSystem.downloadAsync(fileUrl, targetPath);

    return downloadResult.uri;
  } catch (error) {
    console.error('❌ Error descargando PDF remoto:', error);
    throw new Error('No se pudo descargar el PDF del servidor');
  }
};

/**
 * Elimina un PDF del dispositivo
 * @param filePath - Ruta del archivo PDF
 */
export const deletePDF = async (filePath: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    console.log('🗑️ PDF eliminado:', filePath);
  } catch (error) {
    console.error('⚠️ Error al eliminar PDF:', error);
    // No lanzamos error porque es solo limpieza
  }
};

/**
 * Obtiene información de un archivo PDF
 * @param filePath - Ruta del archivo PDF
 */
export const getPDFInfo = async (filePath: string): Promise<{
  exists: boolean;
  size?: number;
  uri?: string;
}> => {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return {
      exists: info.exists,
      size: info.exists && 'size' in info ? (info as any).size : undefined,
      uri: info.uri
    };
  } catch (error) {
    console.error('⚠️ Error al obtener info del PDF:', error);
    return { exists: false };
  }
};

/**
 * Genera el nombre de archivo para un reporte
 * @param reportNumber - Número del reporte
 * @param projectName - Nombre del proyecto
 */
export const generateFileName = (reportNumber?: string, projectName?: string): string => {
  const number = reportNumber || 'SinNumero';
  const project = projectName || 'SinProyecto';
  
  // Sanitizar el nombre del archivo (remover caracteres no permitidos)
  // Primero eliminar # y luego reemplazar otros caracteres especiales por _
  const sanitizedNumber = number.replace(/#/g, '').replace(/[/\\?%*:|"<>\s]/g, '_');
  const sanitizedProject = project.replace(/#/g, '').replace(/[/\\?%*:|"<>\s]/g, '_');
  
  return `reporte_${sanitizedNumber}_${sanitizedProject}`;
};
