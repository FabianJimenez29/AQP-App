import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import ApiService from '../services/api';
import { convertImageToBase64, generatePDF, sharePDF } from '../utils/pdfGenerator';
import * as FileSystem from 'expo-file-system/legacy';

interface BreakdownPreviewScreenProps {
  route: any;
  navigation: any;
}

const escapeHtml = (value: string = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildBreakdownHTML = (reportData: any, photo1Base64: string | null, photo2Base64: string | null, logoBase64: string | null) => {
  const createdAtDate = reportData?.createdAt ? new Date(reportData.createdAt) : new Date();
  const dateText = createdAtDate.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const timeText = createdAtDate.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #1f2937; background: #ffffff; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; }
    </style>
  </head>
  <body>
    <!-- HEADER BLANCO CON LOGO Y TEXTO NEGRO -->
    <div style="background-color: white; color: black; padding: 20px; text-align: center; margin-bottom: 0; border-bottom: 2px solid #1e40af;">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo AQP" style="width: 200px; height: auto; max-width: 100%; margin: 0 auto 12px auto; display: block;" />` : ''}
      <h1 style="font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; color: black;">Reporte de Avería</h1>
      <p style="font-size: 14px; margin-top: 6px; font-weight: 500; color: black; opacity: 0.85;">🔧 Documento técnico de mantenimiento</p>
    </div>

    <!-- CONTENIDO BLANCO -->
    <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
      
      <!-- INFO GRID -->
      <table style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
        <tr>
          <td style="width: 50%; padding-right: 10px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 4px;">Proyecto</div>
            <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 16px;">${escapeHtml(reportData?.projectName || '—')}</div>
            
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 4px;">Técnico Responsable</div>
            <div style="font-size: 14px; font-weight: 700; color: #1f2937;">${escapeHtml(reportData?.technicianName || '—')}</div>
          </td>
          <td style="width: 50%; padding-left: 10px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 4px;">Área / Elemento</div>
            <div style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 16px;">${escapeHtml(reportData?.poolName || '—')}</div>
            
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 4px;">Fecha y Hora</div>
            <div style="font-size: 14px; font-weight: 700; color: #1f2937;">${escapeHtml(dateText)} • ${escapeHtml(timeText)}</div>
          </td>
        </tr>
      </table>

      <!-- DESCRIPCIÓN -->
      <div style="margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 8px;">Descripción de la Avería</div>
        <div style="font-size: 14px; line-height: 1.65; color: #1f2937; white-space: pre-wrap; word-wrap: break-word; padding: 12px; background-color: #EFF6FF; border-left: 4px solid #1e40af; border-radius: 4px;">${escapeHtml(reportData?.description || '—')}</div>
      </div>

      <!-- FOTOS -->
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e40af; letter-spacing: 0.3px; margin-bottom: 12px;">Evidencia Fotográfica</div>
        <table style="width: 100%;">
          <tr>
            <td style="width: 48%; padding-right: 12px;">
              <img src="${photo1Base64 || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22250%22 height=%22250%22/%3E%3C/svg%3E'}" alt="Fotografía 1" style="width: 100%; height: 250px; object-fit: cover; border-radius: 6px; border: 2px solid #1e40af; background: #f9fafb; display: block;" />
              <div style="font-size: 12px; font-weight: 700; color: #1e40af; margin-top: 6px; text-align: center;">Fotografía 1</div>
            </td>
            <td style="width: 48%; padding-left: 12px;">
              <img src="${photo2Base64 || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22250%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22250%22 height=%22250%22/%3E%3C/svg%3E'}" alt="Fotografía 2" style="width: 100%; height: 250px; object-fit: cover; border-radius: 6px; border: 2px solid #1e40af; background: #f9fafb; display: block;" />
              <div style="font-size: 12px; font-weight: 700; color: #1e40af; margin-top: 6px; text-align: center;">Fotografía 2</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- FOOTER -->
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #f0f0f0; font-size: 11px; color: #9ca3af; text-align: center;">
        Reporte generado automáticamente • Sistema Aqua Pool Blue CR
      </div>
    </div>
  </body>
  </html>
  `;
};

const buildFallbackBreakdownFileName = (projectName?: string, reportSequence?: number) => {
  const safeProjectName = String(projectName || 'PROYECTO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();

  const parsedSequence = Number.isFinite(Number(reportSequence)) ? Number(reportSequence) : 0;
  const paddedSequence = String(Math.max(0, parsedSequence)).padStart(3, '0');

  return `RA-${safeProjectName || 'PROYECTO'}-${paddedSequence}`;
};

const BreakdownPreviewScreen: React.FC<BreakdownPreviewScreenProps> = ({ route, navigation }) => {
  const { reportData } = route.params;
  const { token } = useAppSelector((state) => state.auth);
  const [photo1Base64, setPhoto1Base64] = useState<string | null>(null);
  const [photo2Base64, setPhoto2Base64] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [htmlReady, setHtmlReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    const preparePreview = async () => {
      try {
        setHtmlReady(false);
        const [p1, p2] = await Promise.all([
          convertImageToBase64(reportData.photo1Local),
          convertImageToBase64(reportData.photo2Local),
        ]);
        
        let logo = null;
        try {
          const logoSource = require('../assets/images/AQPLogoBlack.png');
          const logoUri = Image.resolveAssetSource(logoSource).uri;
          logo = await convertImageToBase64(logoUri);
        } catch (logoError) {
          console.warn('⚠️ No se pudo cargar el logo:', logoError);
        }
        
        setPhoto1Base64(p1);
        setPhoto2Base64(p2);
        setLogoBase64(logo);
      } catch (error) {
        console.error('Error preparando vista previa:', error);
        Alert.alert('Error', 'No se pudo preparar la vista previa.');
      } finally {
        setHtmlReady(true);
      }
    };

    preparePreview();
  }, [reportData]);

  const htmlContent = htmlReady ? buildBreakdownHTML(reportData, photo1Base64, photo2Base64, logoBase64) : '';

  const handleGeneratePDF = async () => {
    if (!htmlReady) return;

    setLoading(true);
    try {
      const fileName = buildFallbackBreakdownFileName(reportData.projectName);
      const filePath = await generatePDF(htmlContent, fileName);
      setPdfPath(filePath);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePDF = async () => {
    if (!token) {
      Alert.alert('Sesion invalida', 'Vuelve a iniciar sesion para enviar el reporte.');
      return;
    }

    setSharing(true);
    try {
      setIsSubmittingReport(true);

      let localPdfPath = pdfPath;
      if (!localPdfPath) {
        const fileName = buildFallbackBreakdownFileName(reportData.projectName);
        localPdfPath = await generatePDF(htmlContent, fileName);
        setPdfPath(localPdfPath);
      }

      const localPdfBase64 = await FileSystem.readAsStringAsync(localPdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const [upload1, upload2] = await Promise.all([
        ApiService.uploadImage(reportData.photo1Local, token, `breakdown_${Date.now()}_1`),
        ApiService.uploadImage(reportData.photo2Local, token, `breakdown_${Date.now()}_2`),
      ]);

      const created: any = await ApiService.createBreakdownReport(
        {
          projectId: reportData.projectId,
          projectPoolId: reportData.projectPoolId,
          description: reportData.description,
          photo1Url: upload1.url,
          photo2Url: upload2.url,
          createdAt: reportData.createdAt,
          localPdfBase64,
          localPdfFileName: `${buildFallbackBreakdownFileName(reportData.projectName)}.pdf`,
        },
        token
      );

      // Compartir siempre el PDF local generado desde la vista previa.
      await sharePDF(localPdfPath);

      Alert.alert('Reporte enviado', created?.message || 'El reporte de averia fue enviado correctamente.');
      navigation.navigate('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo compartir el reporte de averia.');
    } finally {
      setIsSubmittingReport(false);
      setSharing(false);
    }
  };

  const handleFinish = () => {
    Alert.alert('Finalizar', '¿Deseas cerrar la vista previa y volver al inicio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        onPress: () => navigation.navigate('Dashboard'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleFinish}>
            <Ionicons name="close-outline" size={28} color="#060606" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Ionicons name="warning-outline" size={24} color="#1976D2" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Vista Previa del Reporte</Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <View style={styles.previewContainer}>
        {!htmlReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Preparando vista previa...</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            style={styles.webview}
            originWhitelist={['*']}
            scalesPageToFit
            showsVerticalScrollIndicator
          />
        )}
      </View>

      <View style={styles.actionBar}>
        {!pdfPath ? (
          <TouchableOpacity
            style={[styles.button, styles.generateButton, (loading || !htmlReady) && styles.buttonDisabled]}
            onPress={handleGeneratePDF}
            disabled={loading || !htmlReady}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generar PDF</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.shareButton, (sharing || isSubmittingReport) && styles.buttonDisabled]}
            onPress={handleSharePDF}
            disabled={sharing || isSubmittingReport}
          >
            {sharing || isSubmittingReport ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonIcon}>📤</Text>
                <Text style={styles.buttonText}>Enviar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {pdfPath && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>✅ PDF generado y listo para compartir</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 4,
    width: 40,
    marginTop: 10,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingTop: 10,
  },
  headerPlaceholder: {
    width: 40,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#0066cc',
  },
  shareButton: {
    backgroundColor: '#25D366',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  statusBar: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BreakdownPreviewScreen;
