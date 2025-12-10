/**
 * Pantalla de Vista Previa del Reporte para Administradores
 * Muestra el reporte en formato HTML y permite generarlo como PDF
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { generateReportHTML } from '../utils/reportHTMLTemplate';
import { generatePDF, sharePDF, generateFileName, convertImageToBase64 } from '../utils/pdfGenerator';

interface AdminReportPreviewScreenProps {
  route: any;
  navigation: any;
}

const AdminReportPreviewScreen: React.FC<AdminReportPreviewScreenProps> = ({ route, navigation }) => {
  const { reportData } = route.params;
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [processedReportData, setProcessedReportData] = useState(reportData);
  const [htmlReady, setHtmlReady] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const webViewRef = useRef<any>(null);

  /**
   * Carga y convierte el logo a base64
   */
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const logo = Asset.fromModule(require('../assets/images/AQPLogoBlack.png'));
        await logo.downloadAsync();
        console.log('📷 Logo descargado, URI:', logo.localUri);
        const base64Logo = await convertImageToBase64(logo.localUri || '');
        console.log('📷 Logo convertido a base64:', base64Logo ? 'OK' : 'FAIL');
        setLogoBase64(base64Logo || '');
      } catch (error) {
        console.error('❌ Error al cargar el logo:', error);
      }
    };
    loadLogo();
  }, []);

  /**
   * Convierte las imágenes a base64 al cargar
   */
  useEffect(() => {
    const convertImages = async () => {
      try {
        console.log('📸 Datos del reporte recibidos:', {
          photoCloroPh: reportData.photoCloroPh?.substring(0, 50) + '...',
          photoAlcalinidad: reportData.photoAlcalinidad?.substring(0, 50) + '...',
          photoDureza: reportData.photoDureza?.substring(0, 50) + '...',
          photoEstabilizador: reportData.photoEstabilizador?.substring(0, 50) + '...',
        });
        
        const processed = { ...reportData };
        
        // Convertir todas las fotos a base64
        if (reportData.photoCloroPh) {
          console.log('🔄 Convirtiendo photoCloroPh...');
          processed.photoCloroPh = await convertImageToBase64(reportData.photoCloroPh);
          console.log('✅ photoCloroPh convertida:', processed.photoCloroPh ? 'OK' : 'FAIL');
        }
        if (reportData.photoAlcalinidad) {
          console.log('🔄 Convirtiendo photoAlcalinidad...');
          processed.photoAlcalinidad = await convertImageToBase64(reportData.photoAlcalinidad);
          console.log('✅ photoAlcalinidad convertida:', processed.photoAlcalinidad ? 'OK' : 'FAIL');
        }
        if (reportData.photoDureza) {
          console.log('🔄 Convirtiendo photoDureza...');
          processed.photoDureza = await convertImageToBase64(reportData.photoDureza);
          console.log('✅ photoDureza convertida:', processed.photoDureza ? 'OK' : 'FAIL');
        }
        if (reportData.photoEstabilizador) {
          console.log('🔄 Convirtiendo photoEstabilizador...');
          processed.photoEstabilizador = await convertImageToBase64(reportData.photoEstabilizador);
          console.log('✅ photoEstabilizador convertida:', processed.photoEstabilizador ? 'OK' : 'FAIL');
        }
        
        console.log('✅ Todas las imágenes procesadas');
        setProcessedReportData(processed);
        setHtmlReady(true);
      } catch (error) {
        console.error('❌ Error al convertir imágenes:', error);
        // Si falla, usar los datos originales
        setProcessedReportData(reportData);
        setHtmlReady(true);
      }
    };

    // Solo convertir imágenes cuando el logo esté listo
    if (logoBase64) {
      convertImages();
    }
  }, [logoBase64]);

  // Genera el HTML del reporte con imágenes en base64
  const htmlContent = (htmlReady && logoBase64) ? generateReportHTML(processedReportData, logoBase64) : '';

  /**
   * Genera el PDF localmente
   */
  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const fileName = generateFileName(
        processedReportData.reportNumber,
        processedReportData.projectName || processedReportData.clientName
      );
      const filePath = await generatePDF(htmlContent, fileName);
      
      setPdfPath(filePath);
      console.log('✅ PDF generado:', filePath);
      
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'No se pudo generar el PDF. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Comparte el PDF por WhatsApp
   */
  const handleSharePDF = async () => {
    if (!pdfPath) {
      Alert.alert('Error', 'Primero debes generar el PDF');
      return;
    }

    setSharing(true);
    try {
      await sharePDF(pdfPath);
      console.log('✅ PDF compartido');
    } catch (error: any) {
      Alert.alert(
        'Error',
        'No se pudo compartir el PDF. Intenta nuevamente.'
      );
    } finally {
      setSharing(false);
    }
  };

  /**
   * Finaliza y vuelve al dashboard de administrador
   */
  const handleFinish = () => {
    Alert.alert(
      'Finalizar',
      '¿Deseas cerrar la vista previa y volver al panel de administrador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: () => navigation.navigate('AdminDashboard')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleFinish}
          >
            <Ionicons name="close-outline" size={28} color="#060606ff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Ionicons name="document-text" size={24} color="#1976D2" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Vista Previa del Reporte</Text>
          </View>
          
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      {/* WebView con vista previa */}
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
            scalesPageToFit={true}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>

      {/* Barra de acciones */}
      <View style={styles.actionBar}>
        {!pdfPath ? (
          // Botón para generar PDF
          <TouchableOpacity
            style={[styles.button, styles.generateButton, (loading || !htmlReady) && styles.buttonDisabled]}
            onPress={handleGeneratePDF}
            disabled={loading || !htmlReady}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                
                <Text style={styles.buttonText}>Generar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Solo botón de compartir después de generar el PDF
          <TouchableOpacity
            style={[styles.button, styles.shareButton, sharing && styles.buttonDisabled]}
            onPress={handleSharePDF}
            disabled={sharing}
          >
            {sharing ? (
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

      {/* Indicador de estado */}
      {pdfPath && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            ✅ PDF generado y listo para compartir
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffffff',
    shadowColor: '#000000ff',
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
    marginTop: 10
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
    paddingTop: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingTop: 10
  },
  headerPlaceholder: {
    width: 40,
  },
  headerButton: {
    padding: 8,
    minWidth: 80,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#000000ff',
    fontWeight: '600',
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
  finishButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  finishButtonText: {
    color: '#0066cc',
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

export default AdminReportPreviewScreen;
