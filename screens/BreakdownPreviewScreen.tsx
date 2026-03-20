import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { convertImageToBase64, generatePDF, generateFileName, sharePDF } from '../utils/pdfGenerator';

interface BreakdownPreviewScreenProps {
  route: any;
  navigation: any;
}

export default function BreakdownPreviewScreen({ route, navigation }: BreakdownPreviewScreenProps) {
  const { reportData } = route.params;
  const { token } = useAppSelector((state) => state.auth);

  const [photo1Base64, setPhoto1Base64] = useState<string | null>(null);
  const [photo2Base64, setPhoto2Base64] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  useEffect(() => {
    const preparePreview = async () => {
      try {
        setPreparing(true);
        const [p1, p2] = await Promise.all([
          convertImageToBase64(reportData.photo1Local),
          convertImageToBase64(reportData.photo2Local),
        ]);
        setPhoto1Base64(p1);
        setPhoto2Base64(p2);
      } catch (error) {
        Alert.alert('Error', 'No se pudo preparar la vista previa.');
      } finally {
        setPreparing(false);
      }
    };

    preparePreview();
  }, [reportData]);

  const htmlContent = useMemo(() => {
    const createdAt = new Date(reportData.createdAt);
    const dateText = createdAt.toLocaleDateString('es-CR');
    const timeText = createdAt.toLocaleTimeString('es-CR');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: Arial, sans-serif; margin: 18px; color: #111827; }
        h1 { font-size: 24px; margin-bottom: 8px; color: #0c4a6e; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
        .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
        .label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .value { font-size: 14px; font-weight: 700; margin-top: 4px; }
        .desc { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
        .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .photo { width: 100%; height: 220px; object-fit: cover; border: 1px solid #d1d5db; border-radius: 8px; }
        .warning { margin-top: 12px; background: #fef3c7; color: #92400e; border-radius: 8px; padding: 10px; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Reporte de Averia</h1>
      <div class="grid">
        <div class="box"><div class="label">Proyecto</div><div class="value">${reportData.projectName}</div></div>
        <div class="box"><div class="label">Area</div><div class="value">${reportData.poolName}</div></div>
        <div class="box"><div class="label">Tecnico</div><div class="value">${reportData.technicianName}</div></div>
        <div class="box"><div class="label">Fecha y hora</div><div class="value">${dateText} ${timeText}</div></div>
      </div>

      <div class="desc">
        <div class="label">Descripcion de la averia</div>
        <div class="value">${String(reportData.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>

      <div class="photos">
        <img class="photo" src="${photo1Base64 || ''}" alt="Foto 1" />
        <img class="photo" src="${photo2Base64 || ''}" alt="Foto 2" />
      </div>

      <div class="warning">
        Esta vista previa se utiliza para generar el PDF local y compartirlo por WhatsApp.
      </div>
    </body>
    </html>
    `;
  }, [reportData, photo1Base64, photo2Base64]);

  const ensureLocalPdf = async (): Promise<string> => {
    if (pdfPath) {
      return pdfPath;
    }

    setIsGeneratingPdf(true);
    try {
      const fileName = generateFileName(`averia_${Date.now()}`, reportData.projectName || 'Proyecto');
      const localPdfPath = await generatePDF(htmlContent, fileName);
      setPdfPath(localPdfPath);
      return localPdfPath;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendReport = async () => {
    if (!token) {
      Alert.alert('Sesion invalida', 'Vuelve a iniciar sesion para enviar el reporte.');
      return;
    }

    try {
      setIsSending(true);

      // Se genera una copia local del PDF en el mismo flujo de envio.
      let localPdfPath: string | null = pdfPath;
      try {
        localPdfPath = await ensureLocalPdf();
      } catch (pdfError) {
        console.warn('No se pudo generar PDF local durante el envio:', pdfError);
      }

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
        },
        token
      );

      Alert.alert(
        'Reporte enviado',
        localPdfPath
          ? created?.message || 'El reporte de averia fue guardado y procesado en el servidor. Tambien se genero una copia local para compartir por WhatsApp.'
          : created?.message || 'El reporte de averia fue guardado y procesado en el servidor. No se pudo generar la copia local para WhatsApp.',
        localPdfPath
          ? [
              {
                text: 'Compartir por WhatsApp',
                onPress: async () => {
                  try {
                    setIsSharingPdf(true);
                    await sharePDF(localPdfPath!);
                  } catch (error: any) {
                    Alert.alert('Error', error?.message || 'No se pudo compartir el PDF por WhatsApp.');
                  } finally {
                    setIsSharingPdf(false);
                    navigation.navigate('Dashboard');
                  }
                },
              },
              {
                text: 'Listo',
                onPress: () => navigation.navigate('Dashboard'),
              },
            ]
          : [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Dashboard'),
              },
            ]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo enviar el reporte de averia.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vista Previa del Reporte</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.previewWrap}>
        {preparing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Preparando visualizador...</Text>
          </View>
        ) : (
          <WebView source={{ html: htmlContent }} originWhitelist={['*']} style={styles.webview} />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, (isSending || isGeneratingPdf || preparing) && styles.disabledButton]}
          disabled={isSending || isGeneratingPdf || preparing}
          onPress={handleSendReport}
        >
          {isSending || isGeneratingPdf ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={18} color="white" />}
          <Text style={styles.primaryText}>Enviar reporte</Text>
        </TouchableOpacity>
      </View>

      {pdfPath && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>✅ PDF listo para compartir por WhatsApp</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  previewWrap: { flex: 1, margin: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: 'white' },
  webview: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: '#6b7280' },
  actions: {
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryText: { color: 'white', fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  secondaryText: {
    color: '#0ea5e9',
    fontWeight: '700',
  },
  disabledButton: { opacity: 0.6 },
  statusBar: {
    backgroundColor: '#ecfdf5',
    borderTopWidth: 1,
    borderTopColor: '#a7f3d0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#065f46',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
