import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  Image,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface Report {
  id: number;
  report_number: string;
  client_name: string;
  project_name: string;
  pool_type: string;
  location?: string;
  technician?: string;
  user_name?: string;
  user_email?: string;
  received_by?: string;
  entry_time?: string;
  exit_time?: string;
  created_at: string;
  user?: {
    name: string;
  };
  pdf_url?: string;
  parameters_before?: any;
  chemicals?: any;
  equipment_check?: any;
  materials_delivered?: any;
  observations?: string;
  photo_cloro_ph?: string;
  photo_alcalinidad?: string;
  photo_dureza?: string;
  photo_estabilizador?: string;
  dureza_aplica?: boolean;
  estabilizador_aplica?: boolean;
  project_client_email?: string;
  project_client_phone?: string;
  project_pool_gallons?: number;
}

export default function AdminReportsScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  // Mapeo de nombres de parámetros
  const parameterNames: Record<string, string> = {
    cl: 'Cloro',
    ph: 'pH',
    alk: 'Alcalinidad',
    salt: 'Sal',
    hardness: 'Dureza',
    stabilizer: 'Estabilizador',
    temperature: 'Temperatura',
  };

  // Mapeo de nombres de químicos con unidades
  const chemicalNames: Record<string, { name: string; unit: string }> = {
    sal: { name: 'Sal', unit: 'bolsas' },
    soda: { name: 'Soda Cáustica', unit: 'kg' },
    acido: { name: 'Ácido Muriático', unit: 'gl' },
    tabletas: { name: 'Tabletas de Cloro', unit: 'unidades' },
    tricloro: { name: 'Tricloro', unit: 'kg' },
    alguicida: { name: 'Alguicida', unit: 'L' },
    bicarbonato: { name: 'Bicarbonato', unit: 'kg' },
    clarificador: { name: 'Clarificador', unit: 'L' },
    cloro_liquido: { name: 'Cloro Líquido', unit: 'gl' },
  };

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      const response = await ApiService.get<{
        reports: any[];
        totalPages: number;
        currentPage: number;
      }>(`/reports?page=${page}&limit=20`, token!);
      
      if (page === 1) {
        setReports(response.reports || []);
      } else {
        setReports((prev) => [...prev, ...(response.reports || [])]);
      }
      
      setTotalPages(response.totalPages || 1);
      setCurrentPage(response.currentPage || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports(1);
  }, []);

  // Listas únicas para filtros
  const uniqueTechnicians = useMemo(() => {
    const techs = new Set(reports.map(r => r.technician || r.user_name).filter(Boolean));
    return Array.from(techs).sort();
  }, [reports]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set(reports.map(r => r.project_name).filter(Boolean));
    return Array.from(projects).sort();
  }, [reports]);

  // Filtrado de reportes
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const techName = report.technician || report.user_name || '';
      const matchesSearch = !searchTerm ||
        report.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        techName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.project_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTechnician = !selectedTechnician || techName === selectedTechnician;
      const matchesProject = !selectedProject || report.project_name === selectedProject;

      const reportDate = new Date(report.created_at);
      const matchesStartDate = !startDate || reportDate >= new Date(startDate);
      const matchesEndDate = !endDate || reportDate <= new Date(endDate);

      return matchesSearch && matchesTechnician && matchesProject && matchesStartDate && matchesEndDate;
    });
  }, [reports, searchTerm, selectedTechnician, selectedProject, startDate, endDate]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = reports.length;
    const thisMonth = reports.filter(r => {
      const date = new Date(r.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const uniqueTechs = uniqueTechnicians.length;

    return { total, thisMonth, uniqueTechs };
  }, [reports, uniqueTechnicians]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTechnician('');
    setSelectedProject('');
    setStartDate('');
    setEndDate('');
  };

  const handleDownloadPDF = async (reportId: number, clientName: string) => {
    try {
      const response = await ApiService.get<{ pdfUrl: string }>(
        `/reports/${reportId}/pdf`,
        token!
      );
      
      if (response.pdfUrl) {
        const supported = await Linking.canOpenURL(response.pdfUrl);
        if (supported) {
          await Linking.openURL(response.pdfUrl);
        } else {
          Alert.alert('Error', 'No se puede abrir el PDF');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo descargar el PDF');
    }
  };

  const handleDeleteReport = (reportId: number, clientName: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar el reporte de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.delete(`/reports/${reportId}`, token!);
              Alert.alert('Éxito', 'Reporte eliminado correctamente');
              loadReports(1);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el reporte');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convertir a hora de Costa Rica (UTC-6)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Costa_Rica',
    });
  };

  const getPoolTypeIcon = (poolType: string) => {
    if (!poolType) return 'water';
    switch (poolType.toLowerCase()) {
      case 'residencial':
        return 'home';
      case 'comercial':
        return 'business';
      case 'olimpica':
        return 'trophy';
      default:
        return 'water';
    }
  };

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedReport(null);
  };

  const handleSendWhatsApp = async () => {
    if (!selectedReport) return;

    try {
      setDownloadingPdf(true);
      
      // URL del PDF
      const pdfUrl = `https://api.reportacr.lat/api/reports/${selectedReport.id}/pdf`;
      
      // Nombre del archivo: Reporte-#001-NombreProyecto.pdf
      const reportNum = selectedReport.report_number?.replace('#', '') || 'SN';
      const projectName = selectedReport.project_name || selectedReport.client_name || 'Sin-Proyecto';
      const sanitizedProjectName = projectName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      const fileName = `Reporte-${reportNum}-${sanitizedProjectName}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;


      // Descargar el PDF
      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (downloadResult.status !== 200) {
        throw new Error(`Error al descargar: ${downloadResult.status}`);
      }

      // Verificar que el archivo existe
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);

      if (!fileInfo.exists) {
        throw new Error('El archivo no se guardó correctamente');
      }


      setDownloadingPdf(false);

      // Usar expo-sharing directamente - es la única forma confiable en iOS con Expo Go
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Reporte PDF',
        UTI: 'com.adobe.pdf',
      });


    } catch (error: any) {
      setDownloadingPdf(false);
      console.error('Error al compartir PDF:', error);
      Alert.alert('Error', error.message || 'No se pudo compartir el PDF');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderLeftColor: '#0284C7' }]}>
          <Ionicons name="document-text" size={24} color="#0284C7" />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Ionicons name="calendar" size={24} color="#10B981" />
          <Text style={styles.statNumber}>{stats.thisMonth}</Text>
          <Text style={styles.statLabel}>Este Mes</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
          <Ionicons name="people" size={24} color="#8B5CF6" />
          <Text style={styles.statNumber}>{stats.uniqueTechs}</Text>
          <Text style={styles.statLabel}>Técnicos Activos</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por número, técnico, cliente o proyecto..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#94A3B8"
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredReports.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No se encontraron reportes con ese criterio' : 'No hay reportes registrados'}
              </Text>
            </View>
          ) : (
            <>
              {filteredReports.map((report) => (
                <TouchableOpacity 
                  key={report.id} 
                  style={styles.reportCard}
                  onPress={() => openDetailModal(report)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reportHeader}>
                    <View style={styles.reportIcon}>
                      <Ionicons
                        name={getPoolTypeIcon(report.pool_type)}
                        size={24}
                        color="#0284C7"
                      />
                    </View>
                    <View style={styles.reportInfo}>
                      <Text style={styles.reportClient}>{report.client_name}</Text>
                      <Text style={styles.reportProject}>{report.project_name}</Text>
                      <View style={styles.reportMeta}>
                        <Ionicons name="person" size={14} color="#64748B" />
                        <Text style={styles.metaText}>{report.technician || report.user_name || 'Sin asignar'}</Text>
                        <Ionicons name="time" size={14} color="#64748B" style={{ marginLeft: 12 }} />
                        <Text style={styles.metaText}>{formatDate(report.created_at)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.reportActions}>
                    {report.pdf_url && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(report.id, report.client_name);
                        }}
                        style={styles.actionButton}
                      >
                        <Ionicons name="download" size={20} color="#059669" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(report.id, report.client_name);
                      }}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              
              {currentPage < totalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => loadReports(currentPage + 1)}
                >
                  <Text style={styles.loadMoreText}>Cargar más</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de Detalles */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeDetailModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalles del Reporte</Text>
            <TouchableOpacity 
              onPress={handleSendWhatsApp} 
              style={styles.whatsappButton}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent}>
              {/* Información del Proyecto */}
              {selectedReport.project_name && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información del Proyecto</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Proyecto:</Text>
                    <Text style={styles.infoValue}>{selectedReport.project_name}</Text>
                  </View>
                  {selectedReport.project_client_email && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email del Cliente:</Text>
                      <Text style={styles.infoValue}>{selectedReport.project_client_email}</Text>
                    </View>
                  )}
                  {selectedReport.project_client_phone && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Teléfono del Cliente:</Text>
                      <Text style={styles.infoValue}>{selectedReport.project_client_phone}</Text>
                    </View>
                  )}
                  {selectedReport.project_pool_gallons && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Galonaje de la Piscina:</Text>
                      <Text style={styles.infoValue}>{selectedReport.project_pool_gallons.toLocaleString()} gal</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Información General */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información General</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>N° Reporte:</Text>
                  <Text style={styles.infoValue}>{selectedReport.report_number || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cliente:</Text>
                  <Text style={styles.infoValue}>{selectedReport.client_name || 'N/A'}</Text>
                </View>
                {selectedReport.location && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ubicación:</Text>
                    <Text style={styles.infoValue}>{selectedReport.location}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Técnico:</Text>
                  <Text style={styles.infoValue}>{selectedReport.technician || selectedReport.user_name || 'N/A'}</Text>
                </View>
                {selectedReport.entry_time && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hora de Entrada:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedReport.entry_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
                {selectedReport.exit_time && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hora de Salida:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedReport.exit_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedReport.created_at)}</Text>
                </View>
              </View>

              {/* Parámetros */}
              {selectedReport.parameters_before && Object.keys(selectedReport.parameters_before).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Parámetros</Text>
                  <View style={styles.parametersGrid}>
                    {Object.entries(selectedReport.parameters_before).map(([key, value]) => (
                      <View key={key} style={styles.parameterItem}>
                        <Text style={styles.parameterLabel}>{parameterNames[key] || key}:</Text>
                        <Text style={styles.parameterValue}>{value as string}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Químicos Aplicados */}
              {selectedReport.chemicals && typeof selectedReport.chemicals === 'object' && Object.keys(selectedReport.chemicals).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Químicos Utilizados</Text>
                  <View style={styles.chemicalsList}>
                    {Object.entries(selectedReport.chemicals)
                      .filter(([_, value]) => value && Number(value) > 0)
                      .map(([key, value]) => {
                        const chemInfo = chemicalNames[key] || { name: key, unit: '' };
                        return (
                          <View key={key} style={styles.chemicalItem}>
                            <Text style={styles.chemicalName}>{chemInfo.name}:</Text>
                            <Text style={styles.chemicalValue}>{String(value)} {chemInfo.unit}</Text>
                          </View>
                        );
                      })}
                  </View>
                </View>
              )}

              {/* Equipos Revisados */}
              {selectedReport.equipment_check && typeof selectedReport.equipment_check === 'object' && Object.keys(selectedReport.equipment_check).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Revisión de Equipos</Text>
                  <View style={styles.equipmentList}>
                    {Object.entries(selectedReport.equipment_check).map(([key, value]) => {
                      // Soporte para estructura antigua (boolean) y nueva ({aplica, working})
                      const isOldFormat = typeof value === 'boolean';
                      const aplica = isOldFormat ? true : (value as any).aplica;
                      const working = isOldFormat ? value : (value as any).working;
                      
                      return (
                        <View key={key} style={styles.equipmentItem}>
                          <Text style={styles.equipmentIcon}>
                            {!aplica ? '⊘' : (working ? '✅' : '❌')}
                          </Text>
                          <View style={styles.equipmentTextContainer}>
                            <Text style={styles.equipmentName}>{key}</Text>
                            <Text style={[
                              styles.equipmentStatus, 
                              { color: !aplica ? '#999' : (working ? '#10B981' : '#EF4444') }
                            ]}>
                              {!aplica ? 'No Aplica' : (working ? 'Funcionando Correctamente' : 'Requiere Atención')}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Fotos */}
              {(selectedReport.photo_cloro_ph || selectedReport.photo_alcalinidad || 
                (selectedReport.dureza_aplica && selectedReport.photo_dureza) || 
                (selectedReport.estabilizador_aplica && selectedReport.photo_estabilizador)) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Fotografías de Mediciones</Text>
                  <View style={styles.photosGrid}>
                    {selectedReport.photo_cloro_ph && (
                      <View style={styles.photoContainer}>
                        <Text style={styles.photoLabel}>Cloro y pH</Text>
                        <Image 
                          source={{ uri: `https://api.reportacr.lat${selectedReport.photo_cloro_ph}` }} 
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    {selectedReport.photo_alcalinidad && (
                      <View style={styles.photoContainer}>
                        <Text style={styles.photoLabel}>Alcalinidad</Text>
                        <Image 
                          source={{ uri: `https://api.reportacr.lat${selectedReport.photo_alcalinidad}` }} 
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    {selectedReport.dureza_aplica && selectedReport.photo_dureza && (
                      <View style={styles.photoContainer}>
                        <Text style={styles.photoLabel}>Dureza</Text>
                        <Image 
                          source={{ uri: `https://api.reportacr.lat${selectedReport.photo_dureza}` }} 
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                    {selectedReport.estabilizador_aplica && selectedReport.photo_estabilizador && (
                      <View style={styles.photoContainer}>
                        <Text style={styles.photoLabel}>Estabilizador</Text>
                        <Image 
                          source={{ uri: `https://api.reportacr.lat${selectedReport.photo_estabilizador}` }} 
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Materiales Entregados */}
              {selectedReport.materials_delivered && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Materiales Entregados</Text>
                  <Text style={styles.materialsText}>{selectedReport.materials_delivered}</Text>
                </View>
              )}

              {/* Observaciones */}
              {selectedReport.observations && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Observaciones</Text>
                  <Text style={styles.observationsText}>{selectedReport.observations}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay para descarga de PDF */}
      {downloadingPdf && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingOverlayContent}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingText}>Descargando PDF...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
    gap: 4,
  },
  reportClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  reportProject: {
    fontSize: 14,
    color: '#64748B',
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284C7',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
  },
  whatsappButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    width: 120,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  parametersGrid: {
    gap: 8,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  parameterLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  chemicalsList: {
    gap: 8,
  },
  chemicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chemicalName: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  chemicalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  equipmentList: {
    gap: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  equipmentIcon: {
    fontSize: 20,
  },
  equipmentTextContainer: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  equipmentStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  photosGrid: {
    gap: 12,
  },
  photoContainer: {
    marginBottom: 12,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  materialsText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  observationsText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
});
