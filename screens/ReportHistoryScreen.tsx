import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserReports } from '../store/statsActions';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/api';
import ApiService from '../services/api';
import PoolHeader from '../components/ui/PoolHeader';
import Colors from '../constants/colors';
import { showError, showConfirm, ErrorMessages } from '../components/ui/CustomAlert';
import { formatInTimeZone } from 'date-fns-tz';

type NavigationProp = StackNavigationProp<any>;

interface Report {
  id: number;
  report_number: string;
  project_id?: number;
  project_name?: string;
  project_client_email?: string;
  project_client_phone?: string;
  project_pool_gallons?: number;
  client_name: string;
  location: string;
  technician: string;
  created_at: string;
  entry_date?: string;
  entry_time_only?: string;
  exit_date?: string;
  exit_time_only?: string;
  photo_cloro_ph?: string;
  photo_alcalinidad?: string;
  photo_dureza?: string;
  photo_estabilizador?: string;
  dureza_aplica?: boolean;
  estabilizador_aplica?: boolean;
  sal_aplica?: boolean;
  parameters_before?: {
    cl: number;
    ph: number;
    alk: number;
    stabilizer: number;
    hardness: number;
    salt: number;
    temperature: number;
  };
  parameters_after?: {
    cl: number;
    ph: number;
    alk: number;
    stabilizer: number;
    hardness: number;
    salt: number;
    temperature: number;
  };
  chemicals?: {
    tricloro: number;
    tabletas: number;
    acido: number;
    soda: number;
    bicarbonato: number;
    sal: number;
    alguicida: number;
    clarificador: number;
    cloro_liquido: number;
  };
  equipment?: string[];
  equipment_check?: any;
  observations?: string;
  materials_delivered?: string;
  received_by?: string;
}

interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'processing' | 'completed' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
  technician_name?: string;
  items?: Array<{
    id: number;
    quantity: number;
    product_name: string;
    variant_info?: string;
    product_id?: number;
    product_variant_id?: number;
  }>;
}

export default function ReportHistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, token } = useAppSelector((state) => state.auth);
  const { reportHistory, isLoading } = useAppSelector((state) => state.stats);
  const dispatch = useAppDispatch();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'orders'>('reports');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    dispatch(fetchUserReports({ page: 1, limit: 50 }));
    loadOrders();
    // Limpiar caché de PDFs antiguos al cargar la pantalla
    clearOldPdfCache();
  }, [dispatch]);

  const loadOrders = async () => {
    if (!token) return;
    
    setLoadingOrders(true);
    try {
      const response = await ApiService.getUserOrders(token, 1, 50);
      if (response.success) {
        setOrders(response.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserReports({ page: 1, limit: 50 }));
    await loadOrders();
    setRefreshing(false);
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const openReportPreview = (report: Report) => {
    // Convertir el formato del reporte del historial al formato esperado por ReportPreviewScreen
    const reportDataForPreview = {
      clientName: report.project_name || report.client_name,
      location: report.location,
      technician: report.technician,
      userId: user?.id || 0,
      entryTime: report.entry_date && report.entry_time_only ? `${report.entry_date}T${report.entry_time_only}` : report.created_at,
      exitTime: report.exit_date && report.exit_time_only ? `${report.exit_date}T${report.exit_time_only}` : report.created_at,
      parametersBefore: report.parameters_before || {
        cl: 0,
        ph: 0,
        alk: 0,
        stabilizer: 0,
        hardness: 0,
        salt: 0,
        temperature: 0,
      },
      chemicals: report.chemicals || {
        tricloro: 0,
        tabletas: 0,
        acido: 0,
        soda: 0,
        bicarbonato: 0,
        sal: 0,
        alguicida: 0,
        clarificador: 0,
        cloro_liquido: 0,
      },
      equipmentCheck: report.equipment_check || {},
      photoCloroPh: getCompleteImageUrl(report.photo_cloro_ph) || undefined,
      photoAlcalinidad: getCompleteImageUrl(report.photo_alcalinidad) || undefined,
      photoDureza: getCompleteImageUrl(report.photo_dureza) || undefined,
      photoEstabilizador: getCompleteImageUrl(report.photo_estabilizador) || undefined,
      materialsDelivered: report.materials_delivered || '',
      observations: report.observations || '',
      projectName: report.project_name || report.client_name,
      reportNumber: report.report_number,
    };

    navigation.navigate('ReportPreview', { reportData: reportDataForPreview });
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'confirmed':
        return '#4CAF50';
      case 'processing':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'confirmed':
        return 'Confirmado';
      case 'processing':
        return 'En Proceso';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Formatear en zona horaria de Costa Rica usando date-fns-tz
      return formatInTimeZone(date, 'America/Costa_Rica', 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (report: Report) => {
    const hasAllRequiredPhotos = report.photo_cloro_ph && report.photo_alcalinidad;
    const hasSomePhotos = report.photo_cloro_ph || report.photo_alcalinidad || report.photo_dureza || report.photo_estabilizador;
    
    if (hasAllRequiredPhotos) {
      return '#4CAF50'; 
    } else if (hasSomePhotos) {
      return '#FF9800'; 
    } else {
      return '#f44336'; 
    }
  };

  const getStatusText = (report: Report) => {
    const hasAllRequiredPhotos = report.photo_cloro_ph && report.photo_alcalinidad;
    const hasSomePhotos = report.photo_cloro_ph || report.photo_alcalinidad || report.photo_dureza || report.photo_estabilizador;
    
    if (hasAllRequiredPhotos) {
      return 'Completo';
    } else if (hasSomePhotos) {
      return 'Parcial';
    } else {
      return 'Sin fotos';
    }
  };

  const renderParameterValue = (label: string, value: number, unit: string = '') => (
    <View style={styles.parameterRow}>
      <Text style={styles.parameterLabel}>{label}:</Text>
      <Text style={styles.parameterValue}>{value}{unit}</Text>
    </View>
  );

  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/uploads/') || url.startsWith('uploads/');
  };

  const getCompleteImageUrl = (url: string | undefined): string | null => {
    return getImageUrl(url);
  };

  // Función para limpiar caché de PDFs antiguos (más de 7 días)
  const clearOldPdfCache = async () => {
    try {
      console.log('🧹 Limpiando caché de PDFs antiguos...');
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of pdfFiles) {
        const fileUri = cacheDir + file;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = now - (fileInfo.modificationTime * 1000);
          
          if (fileAge > sevenDaysInMs) {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
            deletedCount++;
            console.log(`  🗑️ Eliminado: ${file}`);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Limpieza completada: ${deletedCount} PDFs eliminados`);
      } else {
        console.log('✅ No hay PDFs antiguos para eliminar');
      }
    } catch (error) {
      console.log('⚠️ Error limpiando caché:', error);
    }
  };

  // Función auxiliar para descargar con reintentos
  const downloadPdfWithRetry = async (
    url: string,
    fileUri: string,
    headers: Record<string, string>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<string | null> => {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📥 Intento ${attempt}/${maxRetries} descargando PDF desde: ${url}`);

        const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
          headers,
          // timeoutMs eliminado porque no es soportado por expo-file-system
        });

        if (downloadRes?.uri) {
          console.log(`✅ PDF descargado exitosamente en intento ${attempt}`);
          return downloadRes.uri;
        }

        throw new Error('No se recibió URI de descarga');
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        console.log(
          `⚠️ Intento ${attempt} falló: ${errorMsg}. ${attempt < maxRetries ? `Reintentando en ${initialDelayMs * Math.pow(2, attempt - 1)}ms...` : 'Sin más intentos.'}`
        );

        // No reintentar si es un error de autorización
        if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
          throw new Error('No autorizado para descargar este PDF');
        }

        // Esperar antes de reintentar (backoff exponencial)
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(
      `No se pudo descargar el PDF después de ${maxRetries} intentos. Último error: ${lastError?.message || 'Desconocido'}`
    );
  };

  const sendReportViaWhatsApp = async (report: Report) => {
    let localUri: string | null = null;

    try {
      if (!token) {
        showError(ErrorMessages.AUTH_REQUIRED);
        return;
      }

      setIsDownloading(true);

      const pdfUrl = `${ApiService.apiUrl}/reports/${report.id}/pdf`;
      // Nombre simple: NombreProyecto-001.pdf (sin # ni caracteres especiales)
      let simpleName = report.report_number.replace(/#/g, ''); // Remover #
      if (report.project_name) {
        const cleanProjectName = report.project_name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        simpleName = `${cleanProjectName}-${simpleName}`;
      }
      const fileName = `${simpleName}.pdf`;

      // Usar documentDirectory para mejor persistencia en Expo Go
      const downloadDir = FileSystem.documentDirectory || '';
      const fileUri = `${downloadDir}${fileName}`;

      console.log(`🚀 INICIANDO DESCARGA DE PDF`);
      console.log(`   Reporte: ${report.id}`);
      console.log(`   URL: ${pdfUrl}`);
      console.log(`   Ubicación local: ${fileUri}`);

      // Descargar con reintentos
      localUri = await downloadPdfWithRetry(
        pdfUrl,
        fileUri,
        { Authorization: `Bearer ${token}` },
        3,
        1000
      );

      if (!localUri) {
        throw new Error('No se pudo obtener la URI del PDF descargado');
      }

      console.log(`✅ PDF DESCARGADO: ${localUri}`);

      // Verificar que el archivo existe y tiene contenido
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      console.log(`📋 Info del archivo:`, { 
        existe: fileInfo.exists, 
        tamaño: fileInfo.exists ? (fileInfo as any).size : undefined,
        isDirectory: fileInfo.isDirectory 
      });

      if (!fileInfo.exists) {
        throw new Error('El archivo PDF no existe en el sistema de archivos');
      }

      // Solo verificar size si existe
      if ((fileInfo as any).size === undefined || (fileInfo as any).size === 0) {
        throw new Error('El archivo PDF está vacío');
      }

      // Esperar para que iOS procese el archivo - reducido porque PDF es más pequeño
      console.log(`⏱️ Esperando 1 segundo...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsDownloading(false);

      // IMPORTANTE: Usar Sharing.shareAsync con la configuración correcta
      console.log(`📤 Abriendo menú de compartición...`);

      try {
        const result = await Sharing.shareAsync(localUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Compartir ${fileName}`
        });

        console.log(`✅ Resultado de compartición:`, result);

        // Solo procesar si result no es undefined
        if (typeof result === 'object' && result !== null && 'action' in result) {
          // @ts-ignore
          if (result.action === 'sharedWithDefault' || result.action === 'shared') {
            // @ts-ignore
            console.log(`✅ PDF COMPARTIDO CON: ${result.activityName || 'La aplicación seleccionada'}`);
            // Esperar a que la app se cierre después del envío
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else if (
            // @ts-ignore
            result.action === 'dismissed'
          ) {
            console.log(`ℹ️ Usuario canceló la compartición`);
            return;
          }
        }
      } catch (error: any) {
        console.log(`⚠️ Error en Sharing.shareAsync:`, error.message);
        throw error;
      }

      // Limpiar después de 10 minutos
      console.log(`🕐 Programando limpieza en 10 minutos...`);
      setTimeout(() => {
        if (localUri) {
          FileSystem.deleteAsync(localUri, { idempotent: true })
            .then(() => console.log(`🗑️ PDF limpiado`))
            .catch(err => console.log(`⚠️ Error limpiando: ${err}`));
        }
      }, 600000);

    } catch (error: any) {
      setIsDownloading(false);
      const errorMsg = error?.message || String(error);
      console.error('❌ ERROR:', errorMsg);
      console.error('   Stack:', error?.stack);

      if (localUri) {
        FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      }

      Alert.alert(
        'Error al Compartir PDF',
        `${errorMsg}\n\n¿Enviar como texto por WhatsApp?`,
        [
          { text: 'No', style: 'cancel' },
          { text: 'Sí', onPress: () => sendReportAsText(report) }
        ]
      );
    }
  };

  const sendReportAsText = (report: Report) => {
    let message = `*🏊 REPORTE DE MANTENIMIENTO DE PISCINA*\n\n`;
    message += `*Número de Reporte:* ${report.report_number}\n`;
    
    if (report.project_name) {
      message += `*Proyecto:* ${report.project_name}\n`;
    }
    
    message += `*Cliente:* ${report.client_name}\n`;
    message += `*Ubicación:* ${report.location}\n`;
    message += `*Técnico:* ${report.technician}\n`;
    message += `*Fecha:* ${formatDate(report.created_at)}\n`;

    if (report.project_pool_gallons) {
      message += `*💧 Galonaje de Piscina:* ${report.project_pool_gallons.toLocaleString()} galones\n`;
    }
    
    message += `\n`;

    if (report.parameters_before) {
      message += `*📊 PARÁMETROS DEL AGUA*\n`;
      message += `• Cloro Libre: ${report.parameters_before.cl} ppm\n`;
      message += `• pH: ${report.parameters_before.ph}\n`;
      message += `• Alcalinidad: ${report.parameters_before.alk} ppm\n`;
      message += `• Estabilizador: ${report.parameters_before.stabilizer} ppm\n`;
      message += `• Dureza: ${report.parameters_before.hardness} ppm\n`;
      message += `• Sal: ${report.parameters_before.salt} ppm\n`;
      message += `• Temperatura: ${report.parameters_before.temperature} °C\n\n`;
    }

    if (report.chemicals) {
      const chemicalsUsed = [];
      if (report.chemicals.tricloro > 0) chemicalsUsed.push(`• Tricloro: ${report.chemicals.tricloro} kg`);
      if (report.chemicals.tabletas > 0) chemicalsUsed.push(`• Tabletas: ${report.chemicals.tabletas} unidades`);
      if (report.chemicals.acido > 0) chemicalsUsed.push(`• Ácido: ${report.chemicals.acido} gl`);
      if (report.chemicals.soda > 0) chemicalsUsed.push(`• Soda: ${report.chemicals.soda} kg`);
      if (report.chemicals.bicarbonato > 0) chemicalsUsed.push(`• Bicarbonato: ${report.chemicals.bicarbonato} kg`);
      if (report.chemicals.sal > 0) chemicalsUsed.push(`• Sal: ${report.chemicals.sal} bolsas`);
      if (report.chemicals.alguicida > 0) chemicalsUsed.push(`• Alguicida: ${report.chemicals.alguicida} L`);
      if (report.chemicals.clarificador > 0) chemicalsUsed.push(`• Clarificador: ${report.chemicals.clarificador} L`);
      if (report.chemicals.cloro_liquido > 0) chemicalsUsed.push(`• Cloro Líquido: ${report.chemicals.cloro_liquido} gl`);
      
      if (chemicalsUsed.length > 0) {
        message += `*🧪 QUÍMICOS UTILIZADOS*\n${chemicalsUsed.join('\n')}\n\n`;
      }
    }

    if (report.materials_delivered) {
      message += `*📦 Materiales Entregados:* ${report.materials_delivered}\n`;
    }
    if (report.observations) {
      message += `*📝 Observaciones:* ${report.observations}\n`;
    }

    message += `\n_Reporte generado por AquaPool App_`;

    const encodedMessage = encodeURIComponent(message);
    
    // If project has client phone, send directly to that number, otherwise let user choose
    const whatsappUrl = report.project_client_phone 
      ? `https://wa.me/${report.project_client_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    Linking.openURL(whatsappUrl).catch(() => {
      showError(ErrorMessages.WHATSAPP_NOT_INSTALLED);
    });
  };

  return (
    <View style={styles.container}>
      <PoolHeader 
        title="Historial de Reportes"
        showBack={true}
        onBack={() => navigation.goBack()}
        rightButton={{
          icon: 'refresh',
          onPress: handleRefresh
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <Ionicons 
            name="document-text" 
            size={20} 
            color={activeTab === 'reports' ? Colors.primary.blue : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reportes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons 
            name="cart" 
            size={20} 
            color={activeTab === 'orders' ? Colors.primary.blue : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Órdenes
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>
          {activeTab === 'reports' ? 'Resumen de Reportes' : 'Resumen de Órdenes'}
        </Text>
        <View style={styles.summaryGrid}>
          {activeTab === 'reports' ? (
            <>
              <View style={styles.summaryCard}>
                <Ionicons name="document-text" size={24} color="#1976D2" />
                <Text style={styles.summaryNumber}>{reportHistory?.reports?.length || 0}</Text>
                <Text style={styles.summaryLabel}>Total Reportes</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <Text style={styles.summaryNumber}>
                  {reportHistory?.reports?.filter(r => {
                    const today = new Date();
                    const reportDate = new Date(r.created_at);
                    return today.toDateString() === reportDate.toDateString();
                  }).length || 0}
                </Text>
                <Text style={styles.summaryLabel}>Hoy</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="calendar" size={24} color="#FF9800" />
                <Text style={styles.summaryNumber}>
                  {reportHistory?.reports?.filter(r => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const reportDate = new Date(r.created_at);
                    return reportDate >= weekAgo;
                  }).length || 0}
                </Text>
                <Text style={styles.summaryLabel}>Esta Semana</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Ionicons name="cart" size={24} color="#1976D2" />
                <Text style={styles.summaryNumber}>{orders.length || 0}</Text>
                <Text style={styles.summaryLabel}>Total Órdenes</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="time" size={24} color="#FF9800" />
                <Text style={styles.summaryNumber}>
                  {orders.filter(o => o.status === 'pending' || o.status === 'processing').length || 0}
                </Text>
                <Text style={styles.summaryLabel}>Pendientes</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.summaryNumber}>
                  {orders.filter(o => o.status === 'completed' || o.status === 'confirmed').length || 0}
                </Text>
                <Text style={styles.summaryLabel}>Completadas</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.reportsList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#1976D2']}
          />
        }
      >
        {activeTab === 'reports' ? (
          isLoading && (!reportHistory?.reports || reportHistory.reports.length === 0) ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando reportes...</Text>
            </View>
          ) : (!reportHistory?.reports || reportHistory.reports.length === 0) ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay reportes registrados</Text>
              <Text style={styles.emptySubtext}>Tus reportes aparecerán aquí</Text>
            </View>
          ) : (
            reportHistory.reports.map((report: any, index: number) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => openReportDetail(report)}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportTitleSection}>
                  <Text style={styles.reportNumber}>{report.report_number}</Text>
                  {report.project_name && (
                    <View style={styles.projectBadge}>
                      <Ionicons name="home" size={12} color="#0066CC" />
                      <Text style={styles.projectBadgeText}>{report.project_name}</Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report) }]}>
                    <Text style={styles.statusText}>{getStatusText(report)}</Text>
                  </View>
                  {(isValidImageUrl(report.photo_cloro_ph) || isValidImageUrl(report.photo_alcalinidad) || 
                    isValidImageUrl(report.photo_dureza) || isValidImageUrl(report.photo_estabilizador)) && (
                    <Ionicons name="images" size={16} color="#4CAF50" style={styles.photoIcon} />
                  )}
                </View>
                <Text style={styles.reportDate}>{formatDate(report.created_at)}</Text>
              </View>
              
              <View style={styles.reportInfo}>
                <Text style={styles.clientName}>{report.client_name}</Text>
                <Text style={styles.location}>{report.location}</Text>
              </View>

              <View style={styles.reportFooter}>
                <View style={styles.photosIndicator}>
                  <Ionicons 
                    name="flask" 
                    size={16} 
                    color={isValidImageUrl(report.photo_cloro_ph) ? '#4CAF50' : '#ccc'} 
                  />
                  <Text style={styles.photoText}>Cl/pH</Text>
                  <Ionicons 
                    name="beaker" 
                    size={16} 
                    color={isValidImageUrl(report.photo_alcalinidad) ? '#4CAF50' : '#ccc'} 
                    style={styles.photoIcon}
                  />
                  <Text style={styles.photoText}>Alc</Text>
                  <Ionicons 
                    name="water" 
                    size={16} 
                    color={isValidImageUrl(report.photo_dureza) ? '#4CAF50' : '#ccc'} 
                    style={styles.photoIcon}
                  />
                  <Text style={styles.photoText}>Dur</Text>
                  <Ionicons 
                    name="shield-checkmark" 
                    size={16} 
                    color={isValidImageUrl(report.photo_estabilizador) ? '#4CAF50' : '#ccc'} 
                    style={styles.photoIcon}
                  />
                  <Text style={styles.photoText}>Est</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      openReportPreview(report);
                    }}
                    style={styles.previewButton}
                  >
                    <Ionicons name="eye-outline" size={18} color="#1976D2" />
                    <Text style={styles.previewButtonText}>Vista Previa</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </View>
            </TouchableOpacity>
          ))
          )
        ) : (
          loadingOrders ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando órdenes...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay órdenes</Text>
              <Text style={styles.emptySubtext}>Crea tu primera orden desde Productos</Text>
            </View>
          ) : (
            orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.reportCard}
                onPress={() => openOrderDetail(order)}
              >
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.reportNumber}>{order.order_number}</Text>
                    <Text style={styles.reportClient}>
                      {order.items?.length || 0} producto(s)
                    </Text>
                    <Text style={styles.reportDate}>{formatDate(order.created_at)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getOrderStatusText(order.status)}</Text>
                  </View>
                </View>
                <View style={styles.reportFooter}>
                  <View>
                    <Text style={styles.reportLocation}>
                      {order.technician_name || 'Técnico'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        {selectedOrder && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalle de la Orden</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Información General</Text>
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Número de Orden:</Text>
                  <Text style={styles.infoValue}>{selectedOrder.order_number}</Text>
                  
                  <Text style={styles.infoLabel}>Estado:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(selectedOrder.status) }]}>
                    <Text style={styles.statusText}>{getOrderStatusText(selectedOrder.status)}</Text>
                  </View>
                  
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedOrder.created_at)}</Text>
                  
                  {selectedOrder.technician_name && (
                    <>
                      <Text style={styles.infoLabel}>Técnico:</Text>
                      <Text style={styles.infoValue}>{selectedOrder.technician_name}</Text>
                    </>
                  )}
                  
                  {selectedOrder.notes && (
                    <>
                      <Text style={styles.infoLabel}>Notas:</Text>
                      <Text style={styles.infoValue}>{selectedOrder.notes}</Text>
                    </>
                  )}
                </View>
              </View>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Productos</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemInfo}>
                        <Text style={styles.orderItemName}>{item.product_name}</Text>
                        <Text style={styles.orderItemDetails}>
                          {item.variant_info && `${item.variant_info} · `}
                          Cantidad: {item.quantity}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedReport && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalle del Reporte</Text>
              <TouchableOpacity 
                onPress={() => sendReportViaWhatsApp(selectedReport)} 
                style={styles.whatsappButton}
              >
                <Ionicons name="logo-whatsapp" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedReport.project_name && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Información del Proyecto</Text>
                  <View style={styles.infoGrid}>
                    <Text style={styles.infoLabel}>Proyecto:</Text>
                    <Text style={styles.infoValue}>{selectedReport.project_name}</Text>
                    
                    {selectedReport.project_pool_gallons && (
                      <>
                        <Text style={styles.infoLabel}>Galonaje de Piscina:</Text>
                        <Text style={styles.infoValue}>{selectedReport.project_pool_gallons.toLocaleString()} gal</Text>
                      </>
                    )}
                    
                    {selectedReport.project_client_email && (
                      <>
                        <Text style={styles.infoLabel}>Email del Cliente:</Text>
                        <Text style={styles.infoValue}>{selectedReport.project_client_email}</Text>
                      </>
                    )}
                    
                    {selectedReport.project_client_phone && (
                      <>
                        <Text style={styles.infoLabel}>Teléfono del Cliente:</Text>
                        <Text style={styles.infoValue}>{selectedReport.project_client_phone}</Text>
                      </>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Información General</Text>
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Número de Reporte:</Text>
                  <Text style={styles.infoValue}>{selectedReport.report_number}</Text>
                  
                  <Text style={styles.infoLabel}>Cliente:</Text>
                  <Text style={styles.infoValue}>{selectedReport.client_name}</Text>
                  
                  <Text style={styles.infoLabel}>Ubicación:</Text>
                  <Text style={styles.infoValue}>{selectedReport.location}</Text>
                  
                  <Text style={styles.infoLabel}>Técnico:</Text>
                  <Text style={styles.infoValue}>{selectedReport.technician}</Text>
                  
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedReport.created_at)}</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fotografías de Mediciones</Text>
                <View style={styles.photosGrid}>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoTitle}>🧪 Cloro y pH</Text>
                    {isValidImageUrl(selectedReport.photo_cloro_ph) ? (
                      <Image 
                        source={{ uri: getCompleteImageUrl(selectedReport.photo_cloro_ph) || undefined }} 
                        style={styles.modalPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noPhotoContainer}>
                        <Ionicons name="camera-outline" size={48} color="#ccc" />
                        <Text style={styles.noPhotoText}>Sin foto disponible</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoTitle}>⚗️ Alcalinidad</Text>
                    {isValidImageUrl(selectedReport.photo_alcalinidad) ? (
                      <Image 
                        source={{ uri: getCompleteImageUrl(selectedReport.photo_alcalinidad) || undefined }} 
                        style={styles.modalPhoto}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.noPhotoContainer}>
                        <Ionicons name="camera-outline" size={48} color="#ccc" />
                        <Text style={styles.noPhotoText}>Sin foto disponible</Text>
                      </View>
                    )}
                  </View>

                  {selectedReport.dureza_aplica && (
                    <View style={styles.photoContainer}>
                      <Text style={styles.photoTitle}>💎 Dureza</Text>
                      {isValidImageUrl(selectedReport.photo_dureza) ? (
                        <Image 
                          source={{ uri: getCompleteImageUrl(selectedReport.photo_dureza) || undefined }} 
                          style={styles.modalPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.noPhotoContainer}>
                          <Ionicons name="camera-outline" size={48} color="#ccc" />
                          <Text style={styles.noPhotoText}>Sin foto disponible</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {selectedReport.estabilizador_aplica && (
                    <View style={styles.photoContainer}>
                      <Text style={styles.photoTitle}>🛡️ Estabilizador</Text>
                      {isValidImageUrl(selectedReport.photo_estabilizador) ? (
                        <Image 
                          source={{ uri: getCompleteImageUrl(selectedReport.photo_estabilizador) || undefined }} 
                          style={styles.modalPhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.noPhotoContainer}>
                          <Ionicons name="camera-outline" size={48} color="#ccc" />
                          <Text style={styles.noPhotoText}>Sin foto disponible</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {selectedReport.parameters_before && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Parámetros</Text>
                  <View style={styles.parametersGrid}>
                    {renderParameterValue('Cloro Libre', selectedReport.parameters_before.cl, ' ppm')}
                    {renderParameterValue('pH', selectedReport.parameters_before.ph)}
                    {renderParameterValue('Alcalinidad', selectedReport.parameters_before.alk, ' ppm')}
                    {renderParameterValue('Estabilizador', selectedReport.parameters_before.stabilizer, ' ppm')}
                    {renderParameterValue('Dureza', selectedReport.parameters_before.hardness, ' ppm')}
                    {renderParameterValue('Sal', selectedReport.parameters_before.salt, ' ppm')}
                    {renderParameterValue('Temperatura', selectedReport.parameters_before.temperature, ' °C')}
                  </View>
                </View>
              )}

              {selectedReport.chemicals && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Químicos Utilizados</Text>
                  <View style={styles.parametersGrid}>
                    {selectedReport.chemicals.tricloro > 0 && renderParameterValue('Tricloro', selectedReport.chemicals.tricloro, ' kg')}
                    {selectedReport.chemicals.tabletas > 0 && renderParameterValue('Tabletas', selectedReport.chemicals.tabletas, ' unidades')}
                    {selectedReport.chemicals.acido > 0 && renderParameterValue('Ácido', selectedReport.chemicals.acido, ' gl')}
                    {selectedReport.chemicals.soda > 0 && renderParameterValue('Soda', selectedReport.chemicals.soda, ' kg')}
                    {selectedReport.chemicals.bicarbonato > 0 && renderParameterValue('Bicarbonato', selectedReport.chemicals.bicarbonato, ' kg')}
                    {selectedReport.chemicals.sal > 0 && renderParameterValue('Sal', selectedReport.chemicals.sal, ' bolsas')}
                    {selectedReport.chemicals.alguicida > 0 && renderParameterValue('Alguicida', selectedReport.chemicals.alguicida, ' L')}
                    {selectedReport.chemicals.clarificador > 0 && renderParameterValue('Clarificador', selectedReport.chemicals.clarificador, ' L')}
                    {selectedReport.chemicals.cloro_liquido > 0 && renderParameterValue('Cloro Líquido', selectedReport.chemicals.cloro_liquido, ' gl')}
                  </View>
                </View>
              )}

              {(selectedReport.materials_delivered || selectedReport.observations) && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Información Adicional</Text>
                  {selectedReport.materials_delivered && (
                    <View style={styles.additionalInfo}>
                      <Text style={styles.additionalLabel}>Materiales Entregados:</Text>
                      <Text style={styles.additionalValue}>{selectedReport.materials_delivered}</Text>
                    </View>
                  )}
                  {selectedReport.observations && (
                    <View style={styles.additionalInfo}>
                      <Text style={styles.additionalLabel}>Observaciones:</Text>
                      <Text style={styles.additionalValue}>{selectedReport.observations}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Modal de Progreso de Descarga */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDownloading}
        onRequestClose={() => {}}
      >
        <View style={styles.progressModalOverlay}>
          <View style={styles.progressModalContainer}>
            <Ionicons name="document-text" size={48} color={Colors.primary.blue} />
            <Text style={styles.progressTitle}>Generando PDF</Text>
            <Text style={styles.progressSubtitle}>
              {downloadProgress < 1 ? 'Descargando del servidor...' : 'Preparando archivo...'}
            </Text>
            
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
            </View>
            
            <Text style={styles.progressPercentage}>
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: Colors.primary.blue + '15',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: Colors.primary.blue,
  },
  summarySection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  projectBadgeText: {
    color: '#0066CC',
    fontSize: 11,
    fontWeight: '600',
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  reportInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  previewButtonText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  photosIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 12,
  },
  photoIcon: {
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoGrid: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  photosGrid: {
    gap: 20,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  modalPhoto: {
    width: 250,
    height: 200,
    borderRadius: 8,
  },
  noPhotoContainer: {
    width: 250,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  noPhotoText: {
    color: '#999',
    marginTop: 8,
    fontSize: 14,
  },
  parametersGrid: {
    gap: 8,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parameterLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  additionalInfo: {
    marginBottom: 15,
  },
  additionalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  additionalValue: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  // Order styles
  reportClient: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reportLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  orderItemDetails: {
    fontSize: 13,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.blue,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  orderTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  orderTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.blue,
  },
  progressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 15,
    marginBottom: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary.blue,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.blue,
  },
});