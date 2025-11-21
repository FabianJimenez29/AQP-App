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
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserReports } from '../store/statsActions';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../services/api';
import ApiService from '../services/api';
import PoolHeader from '../components/ui/PoolHeader';
import Colors from '../constants/colors';

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
  before_photo_url?: string;
  after_photo_url?: string;
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

  useEffect(() => {
    dispatch(fetchUserReports({ page: 1, limit: 50 }));
    loadOrders();
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
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (report: Report) => {
    if (report.before_photo_url && report.after_photo_url) {
      return '#4CAF50'; 
    } else if (report.before_photo_url || report.after_photo_url) {
      return '#FF9800'; 
    } else {
      return '#f44336'; 
    }
  };

  const getStatusText = (report: Report) => {
    if (report.before_photo_url && report.after_photo_url) {
      return 'Completo';
    } else if (report.before_photo_url || report.after_photo_url) {
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

  const sendReportViaWhatsApp = async (report: Report) => {
    try {
      if (!token) {
        Alert.alert('Error', 'No estás autenticado');
        return;
      }

      console.log('📄 Iniciando proceso de compartir PDF...');
      console.log('   Report ID:', report.id);
      console.log('   Report Number:', report.report_number);
      console.log('   Project:', report.project_name);
      
      try {
        
        // Construir nombre del archivo de forma más segura
        const reportNum = report.report_number || report.id?.toString() || 'REPORTE';
        const timestamp = Date.now();
        
        // Limpiar el número de reporte (remover caracteres especiales como #, /, \, etc.)
        const cleanReportNum = reportNum.replace(/[^a-zA-Z0-9-_]/g, '');
        
        // Nombre simple y seguro
        const fileName = `Reporte_${cleanReportNum}_${timestamp}.pdf`;
        
        console.log('📄 Construyendo nombre del archivo:');
        console.log('   report_number:', report.report_number);
        console.log('   report.id:', report.id);
        console.log('   Limpio:', cleanReportNum);
        console.log('   Nombre final:', fileName);
        
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        const pdfUrl = `${ApiService.apiUrl}/reports/${report.id}/pdf`;
        
        console.log('📄 URL del PDF:', pdfUrl);
        console.log('📄 Guardando en:', fileUri);
        
        // Mostrar indicador de descarga
        const downloadPromise = FileSystem.downloadAsync(pdfUrl, fileUri, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        });

        // Timeout de 30 segundos
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tiempo de espera agotado (30s)')), 30000)
        );

        console.log('⏳ Descargando PDF del servidor...');
        const downloadResult = await Promise.race([downloadPromise, timeoutPromise]) as any;

        console.log('📄 Descarga completada');
        console.log('   Status:', downloadResult.status);
        console.log('   URI:', downloadResult.uri);
        console.log('   MD5:', downloadResult.md5);
        console.log('   Headers:', downloadResult.headers);

        if (downloadResult.status !== 200) {
          throw new Error(`Error al descargar el PDF (HTTP ${downloadResult.status})`);
        }

        // Pequeña espera para asegurar que el archivo se escribió completamente
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar el archivo descargado
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        console.log('📄 Info del archivo después de espera:');
        console.log('   Existe:', fileInfo.exists);
        console.log('   Es directorio:', fileInfo.isDirectory);
        if (fileInfo.exists && 'size' in fileInfo) {
          console.log('   Tamaño:', fileInfo.size, 'bytes');
          console.log('   Tamaño MB:', (fileInfo.size / 1024 / 1024).toFixed(2), 'MB');
        }
        if (fileInfo.exists && 'modificationTime' in fileInfo) {
          console.log('   Modificado:', new Date(fileInfo.modificationTime * 1000).toISOString());
        }
        console.log('   URI:', fileInfo.uri);

        if (!fileInfo.exists) {
          throw new Error('El archivo no existe después de la descarga');
        }

        if (fileInfo.exists && 'size' in fileInfo && fileInfo.size === 0) {
          throw new Error('El PDF descargado está vacío (0 bytes). El backend envió el archivo pero no se guardó correctamente.');
        }

        if (fileInfo.exists && 'size' in fileInfo && fileInfo.size < 1000) {
          throw new Error(`El PDF es muy pequeño (${fileInfo.size} bytes), probablemente sea un error del servidor`);
        }

        // Verificar que sea un PDF válido leyendo el contenido
        try {
          // Leer los primeros bytes del archivo
          const fileContent = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          
          if (!fileContent || fileContent.length < 10) {
            throw new Error('El archivo descargado está vacío o es muy pequeño');
          }
          
          // Decodificar y verificar header
          const decoded = atob(fileContent.substring(0, Math.min(100, fileContent.length)));
          const pdfHeader = decoded.substring(0, 4);
          console.log('📄 Header del archivo:', pdfHeader);
          console.log('📄 Primeros caracteres:', decoded.substring(0, 20));
          
          if (pdfHeader !== '%PDF') {
            console.error('❌ Contenido del archivo (primeros 100 chars):', decoded.substring(0, 100));
            throw new Error(`El archivo no es un PDF válido. Header encontrado: "${pdfHeader}"`);
          }
          
          console.log('✅ PDF válido confirmado');
        } catch (headerError: any) {
          console.error('❌ Error verificando PDF:', headerError);
          throw new Error(`PDF inválido o corrupto: ${headerError.message}`);
        }

        const fileSizeKB = fileInfo.exists && 'size' in fileInfo ? (fileInfo.size / 1024).toFixed(2) : '?';
        const fileSizeMB = fileInfo.exists && 'size' in fileInfo ? (fileInfo.size / 1024 / 1024).toFixed(2) : '?';
        console.log(`✅ PDF válido - ${fileSizeMB} MB`);

        // Verificar si el reporte tiene número de teléfono del cliente
        if (report.project_client_phone) {
          // Limpiar el número de teléfono
          const cleanPhone = report.project_client_phone.replace(/[^0-9]/g, '');
          console.log('📱 Teléfono del cliente:', cleanPhone);
          
          // Copiar archivo con nombre limpio para compartir
          const simpleFileName = `Reporte_${cleanReportNum}.pdf`;
          const simpleFileUri = `${FileSystem.cacheDirectory}${simpleFileName}`;
          
          console.log('📋 Preparando archivo para WhatsApp...');
          console.log('📋 Copiando a:', simpleFileUri);
          
          await FileSystem.copyAsync({
            from: downloadResult.uri,
            to: simpleFileUri
          });
          
          // Verificar la copia
          const copyInfo = await FileSystem.getInfoAsync(simpleFileUri);
          console.log('📋 Archivo copiado:', copyInfo.exists, copyInfo);
          
          if (!copyInfo.exists) {
            throw new Error('No se pudo copiar el archivo');
          }
          
          console.log('📱 Número destino:', cleanPhone);
          console.log('📎 Compartiendo PDF con Share API nativo...');
          
          // Usar Share API nativo de React Native
          try {
            const shareResult = await Share.share(
              {
                url: simpleFileUri,
                title: `Reporte ${cleanReportNum}`,
                message: `Reporte ${cleanReportNum} - ${report.project_name || ''}`
              },
              {
                subject: `Reporte ${cleanReportNum}`,
                dialogTitle: `Compartir Reporte ${cleanReportNum}`
              }
            );
            
            console.log('✅ Share API resultado:', shareResult);
            
            // Limpiar archivos temporales después de compartir
            setTimeout(async () => {
              try {
                    console.log('� Abriendo menú para adjuntar PDF...');
                    
                    // Verificar disponibilidad
                    const isAvailable = await Sharing.isAvailableAsync();
                    if (!isAvailable) {
                      Alert.alert('Error', 'La función de compartir no está disponible');
                      return;
                    }
                    
                    // Abrir menú de compartir con el PDF
                    await Sharing.shareAsync(simpleFileUri, {
                      mimeType: 'application/pdf',
                      dialogTitle: `Reporte ${cleanReportNum}`,
                      UTI: 'com.adobe.pdf'
                    });
                    
                    console.log('✅ Menú de compartir abierto');
                    
                    // Limpiar después
                    setTimeout(async () => {
                      try {
                        await FileSystem.deleteAsync(simpleFileUri, { idempotent: true });
                        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                        console.log('🗑️  Archivos temporales eliminados');
                      } catch (e) {
                        console.log('⚠️  No se pudo eliminar archivos temporales');
                      }
                    }, 10000);
                    
                  } catch (error: any) {
                    console.error('❌ Error al compartir PDF:', error);
                    Alert.alert('Error', `No se pudo compartir el PDF: ${error.message}`);
                  }
                }
              },
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => {
                  // Limpiar archivos si cancela
                  setTimeout(async () => {
                    try {
                      await FileSystem.deleteAsync(simpleFileUri, { idempotent: true });
                      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                    } catch (e) {}
                  }, 1000);
                }
              }
            ]
          );
          
        } else {
          // No hay número, mostrar opciones generales
          Alert.alert(
            '✅ PDF Listo',
            `El reporte está listo (${fileSizeMB} MB)\n\n¿Cómo deseas compartirlo?`,
            [
              {
                text: '📱 WhatsApp / Email / Otros',
                onPress: async () => {
                  try {
                    console.log('📤 Abriendo menú de compartir...');
                    
                    // Crear copia con nombre simple (sin caracteres especiales)
                    const simpleFileName = `Reporte_${cleanReportNum}.pdf`;
                    const simpleFileUri = `${FileSystem.cacheDirectory}${simpleFileName}`;
                    await FileSystem.copyAsync({
                      from: downloadResult.uri,
                      to: simpleFileUri
                    });
                    
                    await Sharing.shareAsync(simpleFileUri, {
                      mimeType: 'application/pdf',
                      dialogTitle: `Compartir Reporte ${reportNum}`,
                      UTI: 'com.adobe.pdf'
                    });
                    
                    console.log('✅ PDF compartido');
                    
                    // Limpiar después
                    setTimeout(async () => {
                      await FileSystem.deleteAsync(simpleFileUri, { idempotent: true });
                    }, 5000);
                    
                  } catch (shareError: any) {
                    console.error('❌ Error al compartir:', shareError);
                    Alert.alert(
                      'Error',
                      `No se pudo abrir el menú de compartir.\n\nError: ${shareError.message}`
                    );
                  }
                }
              },
              {
                text: '💬 Enviar como Texto',
                onPress: () => sendReportAsText(report)
              },
              {
                text: 'Cancelar',
                style: 'cancel'
              }
            ]
          );
        }
        
      } catch (error: any) {
        console.error('❌ Error completo:', error);
        console.error('   Nombre:', error.name);
        console.error('   Mensaje:', error.message);
        if (error.stack) console.error('   Stack:', error.stack);
        
        // Mensajes más específicos según el error
        let errorMessage = 'No se pudo descargar el PDF del servidor.';
        
        if (error.message.includes('Tiempo de espera')) {
          errorMessage = 'El servidor tardó demasiado en responder. Verifica tu conexión a internet.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Error de conexión. Verifica tu internet y que el servidor esté disponible.';
        } else if (error.message.includes('HTTP 404')) {
          errorMessage = 'El PDF no se encontró en el servidor. Es posible que el reporte no tenga PDF generado.';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Error en el servidor al generar el PDF. Intenta de nuevo más tarde.';
        } else if (error.message.includes('PDF vacío')) {
          errorMessage = 'El PDF se generó pero está vacío. Contacta al administrador.';
        }
        
        Alert.alert(
          'No se pudo cargar el PDF',
          `${errorMessage}\n\n¿Deseas compartir el reporte como texto por WhatsApp?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: '💬 Enviar como Texto', onPress: () => sendReportAsText(report) }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado al compartir el reporte');
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
      if (report.chemicals.acido > 0) chemicalsUsed.push(`• Ácido: ${report.chemicals.acido} L`);
      if (report.chemicals.soda > 0) chemicalsUsed.push(`• Soda: ${report.chemicals.soda} kg`);
      if (report.chemicals.bicarbonato > 0) chemicalsUsed.push(`• Bicarbonato: ${report.chemicals.bicarbonato} kg`);
      if (report.chemicals.sal > 0) chemicalsUsed.push(`• Sal: ${report.chemicals.sal} kg`);
      if (report.chemicals.alguicida > 0) chemicalsUsed.push(`• Alguicida: ${report.chemicals.alguicida} L`);
      if (report.chemicals.clarificador > 0) chemicalsUsed.push(`• Clarificador: ${report.chemicals.clarificador} L`);
      if (report.chemicals.cloro_liquido > 0) chemicalsUsed.push(`• Cloro Líquido: ${report.chemicals.cloro_liquido} L`);
      
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
    if (report.received_by) {
      message += `*✍️ Recibido por:* ${report.received_by}\n`;
    }

    message += `\n_Reporte generado por AquaPool App_`;

    const encodedMessage = encodeURIComponent(message);
    
    // If project has client phone, send directly to that number, otherwise let user choose
    const whatsappUrl = report.project_client_phone 
      ? `https://wa.me/${report.project_client_phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tener WhatsApp instalado.');
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
                  {(isValidImageUrl(report.before_photo_url) || isValidImageUrl(report.after_photo_url)) && (
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
                    name="camera" 
                    size={16} 
                    color={isValidImageUrl(report.before_photo_url) ? '#4CAF50' : '#ccc'} 
                  />
                  <Text style={styles.photoText}>Antes</Text>
                  <Ionicons 
                    name="camera" 
                    size={16} 
                    color={isValidImageUrl(report.after_photo_url) ? '#4CAF50' : '#ccc'} 
                    style={styles.photoIcon}
                  />
                  <Text style={styles.photoText}>Después</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
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
                <Text style={styles.modalSectionTitle}>Fotografías</Text>
                <View style={styles.photosGrid}>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoTitle}>Antes del Mantenimiento</Text>
                    {isValidImageUrl(selectedReport.before_photo_url) ? (
                      <Image 
                        source={{ uri: getCompleteImageUrl(selectedReport.before_photo_url) || undefined }} 
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
                    <Text style={styles.photoTitle}>Después del Mantenimiento</Text>
                    {isValidImageUrl(selectedReport.after_photo_url) ? (
                      <Image 
                        source={{ uri: getCompleteImageUrl(selectedReport.after_photo_url) || undefined }} 
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
                    {selectedReport.chemicals.acido > 0 && renderParameterValue('Ácido', selectedReport.chemicals.acido, ' L')}
                    {selectedReport.chemicals.soda > 0 && renderParameterValue('Soda', selectedReport.chemicals.soda, ' kg')}
                    {selectedReport.chemicals.bicarbonato > 0 && renderParameterValue('Bicarbonato', selectedReport.chemicals.bicarbonato, ' kg')}
                    {selectedReport.chemicals.sal > 0 && renderParameterValue('Sal', selectedReport.chemicals.sal, ' kg')}
                    {selectedReport.chemicals.alguicida > 0 && renderParameterValue('Alguicida', selectedReport.chemicals.alguicida, ' L')}
                    {selectedReport.chemicals.clarificador > 0 && renderParameterValue('Clarificador', selectedReport.chemicals.clarificador, ' L')}
                    {selectedReport.chemicals.cloro_liquido > 0 && renderParameterValue('Cloro Líquido', selectedReport.chemicals.cloro_liquido, ' L')}
                  </View>
                </View>
              )}

              {(selectedReport.materials_delivered || selectedReport.observations || selectedReport.received_by) && (
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
                  {selectedReport.received_by && (
                    <View style={styles.additionalInfo}>
                      <Text style={styles.additionalLabel}>Recibido por:</Text>
                      <Text style={styles.additionalValue}>{selectedReport.received_by}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        )}
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
});