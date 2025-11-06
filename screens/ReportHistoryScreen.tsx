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
} from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchUserReports } from '../store/statsActions';
import { Ionicons } from '@expo/vector-icons';

interface Report {
  id: number;
  report_number: string;
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

export default function ReportHistoryScreen() {
  const { user, token } = useAppSelector((state) => state.auth);
  const { reportHistory, isLoading } = useAppSelector((state) => state.stats);
  const dispatch = useAppDispatch();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchUserReports({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserReports({ page: 1, limit: 50 }));
    setRefreshing(false);
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
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
    // Determinar estado basado en si tiene fotos y datos completos
    if (report.before_photo_url && report.after_photo_url) {
      return '#4CAF50'; // Verde - Completo
    } else if (report.before_photo_url || report.after_photo_url) {
      return '#FF9800'; // Naranja - Parcial
    } else {
      return '#f44336'; // Rojo - Sin fotos
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

  // Function to check if URL is a valid S3 URL
  const isValidS3Url = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('https://') && (url.includes('amazonaws.com') || url.includes('presigned'));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Reportes</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Resumen de Actividad</Text>
        <View style={styles.summaryGrid}>
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
        </View>
      </View>

      {/* Reports List */}
      <ScrollView 
        style={styles.reportsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading && (!reportHistory?.reports || reportHistory.reports.length === 0) ? (
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
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report) }]}>
                    <Text style={styles.statusText}>{getStatusText(report)}</Text>
                  </View>
                  {(isValidS3Url(report.before_photo_url) || isValidS3Url(report.after_photo_url)) && (
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
                    color={isValidS3Url(report.before_photo_url) ? '#4CAF50' : '#ccc'} 
                  />
                  <Text style={styles.photoText}>Antes</Text>
                  <Ionicons 
                    name="camera" 
                    size={16} 
                    color={isValidS3Url(report.after_photo_url) ? '#4CAF50' : '#ccc'} 
                    style={styles.photoIcon}
                  />
                  <Text style={styles.photoText}>Después</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedReport && (
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalle del Reporte</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Report Info */}
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

              {/* Photos */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Fotografías</Text>
                <View style={styles.photosGrid}>
                  <View style={styles.photoContainer}>
                    <Text style={styles.photoTitle}>Antes del Mantenimiento</Text>
                    {isValidS3Url(selectedReport.before_photo_url) ? (
                      <Image 
                        source={{ uri: selectedReport.before_photo_url }} 
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
                    {isValidS3Url(selectedReport.after_photo_url) ? (
                      <Image 
                        source={{ uri: selectedReport.after_photo_url }} 
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

              {/* Parameters */}
              {selectedReport.parameters_before && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Parámetros Antes</Text>
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

              {selectedReport.parameters_after && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Parámetros Después</Text>
                  <View style={styles.parametersGrid}>
                    {renderParameterValue('Cloro Libre', selectedReport.parameters_after.cl, ' ppm')}
                    {renderParameterValue('pH', selectedReport.parameters_after.ph)}
                    {renderParameterValue('Alcalinidad', selectedReport.parameters_after.alk, ' ppm')}
                    {renderParameterValue('Estabilizador', selectedReport.parameters_after.stabilizer, ' ppm')}
                    {renderParameterValue('Dureza', selectedReport.parameters_after.hardness, ' ppm')}
                    {renderParameterValue('Sal', selectedReport.parameters_after.salt, ' ppm')}
                    {renderParameterValue('Temperatura', selectedReport.parameters_after.temperature, ' °C')}
                  </View>
                </View>
              )}

              {/* Chemicals */}
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

              {/* Additional Info */}
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
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
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
});