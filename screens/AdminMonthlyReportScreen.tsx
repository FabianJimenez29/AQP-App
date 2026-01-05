import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Project {
  id: number;
  project_name: string;
  client_name: string;
  location: string;
}

type ReportType = 'monthly' | 'weekly' | 'custom' | 'by-project';

export default function AdminMonthlyReportScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsModalVisible, setProjectsModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  
  // Estados para el DatePicker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await ApiService.getAllProjects(token!);
      const projectsArray = Array.isArray(response) ? response : [];
      setProjects(projectsArray);
    } catch (error: any) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Funciones para manejar el DatePicker
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS === 'android') {
        setStartDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS === 'android') {
        setEndDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const confirmStartDate = () => {
    setStartDate(tempStartDate.toISOString().split('T')[0]);
    setShowStartDatePicker(false);
  };

  const confirmEndDate = () => {
    setEndDate(tempEndDate.toISOString().split('T')[0]);
    setShowEndDatePicker(false);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      let body: any = {};

      // Preparar datos según el tipo de reporte
      if (reportType === 'monthly') {
        const year = selectedYear;
        const month = selectedMonth + 1;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        body = {
          reportType: 'monthly',
          startDate: firstDay.toISOString().split('T')[0],
          endDate: lastDay.toISOString().split('T')[0],
        };
      } else if (reportType === 'weekly') {
        // Última semana (7 días atrás)
        const endD = new Date();
        const startD = new Date();
        startD.setDate(startD.getDate() - 7);
        
        body = {
          reportType: 'weekly',
          startDate: startD.toISOString().split('T')[0],
          endDate: endD.toISOString().split('T')[0],
        };
      } else if (reportType === 'custom') {
        if (!startDate || !endDate) {
          Alert.alert('Error', 'Debes seleccionar ambas fechas');
          setGenerating(false);
          return;
        }
        
        body = {
          reportType: 'custom',
          startDate,
          endDate,
        };
      } else if (reportType === 'by-project') {
        if (!selectedProject) {
          Alert.alert('Error', 'Debes seleccionar un proyecto');
          setGenerating(false);
          return;
        }
        
        if (!startDate || !endDate) {
          // Por defecto último mes si no hay fechas
          const endD = new Date();
          const startD = new Date();
          startD.setMonth(startD.getMonth() - 1);
          
          body = {
            reportType: 'custom',
            startDate: startD.toISOString().split('T')[0],
            endDate: endD.toISOString().split('T')[0],
            projectId: selectedProject.id,
          };
        } else {
          body = {
            reportType: 'custom',
            startDate,
            endDate,
            projectId: selectedProject.id,
          };
        }
      }

      const response = await ApiService.generateMonthlyPDF(body, token!);
      
      if (response.success && response.pdf) {
        // Generar nombre del archivo con formato: reporte-(nombreProyecto)-fecha
        const currentDate = new Date().toISOString().split('T')[0];
        const projectName = selectedProject 
          ? selectedProject.project_name.replace(/[^a-zA-Z0-9]/g, '_')
          : 'general';
        const filename = `reporte-${projectName}-${currentDate}.pdf`;
        
        // Guardar el PDF en el sistema de archivos usando la API legacy
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, response.pdf, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Verificar si se puede compartir
        const canShare = await Sharing.isAvailableAsync();
        
        if (canShare) {
          // Compartir el PDF
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir Reporte PDF',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert(
            '✅ Éxito', 
            `El reporte PDF se ha generado y guardado en:\n${fileUri}`,
            [{ text: 'Entendido', style: 'default' }]
          );
        }
      }
      
    } catch (error: any) {
      console.error('Error generating report:', error);
      Alert.alert('❌ Error', error.message || 'No se pudo generar el reporte. Intenta nuevamente.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes PDF</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={48} color="#FFFFFF" />
          </View>
          
          <Text style={styles.title}>Reportes en PDF</Text>
          <Text style={styles.description}>
            Genera reportes consolidados en formato PDF con diferentes filtros y opciones
          </Text>
        </View>

        {/* Report Type Selector Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="filter" size={20} color="#EF4444" />
            <Text style={styles.cardTitle}>Tipo de Reporte</Text>
          </View>
          
          <View style={styles.typeGrid}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                reportType === 'monthly' && styles.typeCardActive,
              ]}
              onPress={() => setReportType('monthly')}
            >
              <View style={[
                styles.typeIconContainer,
                reportType === 'monthly' && styles.typeIconContainerActive,
              ]}>
                <Ionicons 
                  name="calendar" 
                  size={28} 
                  color={reportType === 'monthly' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text
                style={[
                  styles.typeCardText,
                  reportType === 'monthly' && styles.typeCardTextActive,
                ]}
              >
                Mensual
              </Text>
              <Text style={styles.typeCardDescription}>
                Por mes y año
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                reportType === 'weekly' && styles.typeCardActive,
              ]}
              onPress={() => setReportType('weekly')}
            >
              <View style={[
                styles.typeIconContainer,
                reportType === 'weekly' && styles.typeIconContainerActive,
              ]}>
                <Ionicons 
                  name="time" 
                  size={28} 
                  color={reportType === 'weekly' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text
                style={[
                  styles.typeCardText,
                  reportType === 'weekly' && styles.typeCardTextActive,
                ]}
              >
                Semanal
              </Text>
              <Text style={styles.typeCardDescription}>
                Últimos 7 días
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                reportType === 'custom' && styles.typeCardActive,
              ]}
              onPress={() => setReportType('custom')}
            >
              <View style={[
                styles.typeIconContainer,
                reportType === 'custom' && styles.typeIconContainerActive,
              ]}>
                <Ionicons 
                  name="options" 
                  size={28} 
                  color={reportType === 'custom' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text
                style={[
                  styles.typeCardText,
                  reportType === 'custom' && styles.typeCardTextActive,
                ]}
              >
                Personalizado
              </Text>
              <Text style={styles.typeCardDescription}>
                Rango de fechas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                reportType === 'by-project' && styles.typeCardActive,
              ]}
              onPress={() => setReportType('by-project')}
            >
              <View style={[
                styles.typeIconContainer,
                reportType === 'by-project' && styles.typeIconContainerActive,
              ]}>
                <Ionicons 
                  name="business" 
                  size={28} 
                  color={reportType === 'by-project' ? '#FFFFFF' : '#64748B'} 
                />
              </View>
              <Text
                style={[
                  styles.typeCardText,
                  reportType === 'by-project' && styles.typeCardTextActive,
                ]}
              >
                Por Proyecto
              </Text>
              <Text style={styles.typeCardDescription}>
                Filtrar proyecto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters based on report type */}
        {reportType === 'monthly' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color="#0EA5E9" />
              <Text style={styles.cardTitle}>Configuración</Text>
            </View>

            {/* Month Selector */}
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" /> Mes
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthSelector}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthButton,
                      selectedMonth === index && styles.monthButtonActive,
                    ]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text
                      style={[
                        styles.monthButtonText,
                        selectedMonth === index && styles.monthButtonTextActive,
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Selector */}
            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="time-outline" size={16} color="#64748B" /> Año
              </Text>
              <View style={styles.yearSelector}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearButton,
                      selectedYear === year && styles.yearButtonActive,
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text
                      style={[
                        styles.yearButtonText,
                        selectedYear === year && styles.yearButtonTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.selectedPeriod}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.selectedPeriodText}>
                {months[selectedMonth]} {selectedYear}
              </Text>
            </View>
          </View>
        )}

        {reportType === 'weekly' && (
          <View style={styles.card}>
            <View style={styles.infoBoxSuccess}>
              <Ionicons name="time" size={24} color="#10B981" />
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxTitle}>Reporte Semanal</Text>
                <Text style={styles.infoBoxText}>
                  Se generará un reporte con todos los datos de los últimos 7 días
                </Text>
              </View>
            </View>
          </View>
        )}

        {reportType === 'custom' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={20} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Rango de Fechas</Text>
            </View>

            <View style={styles.dateInputsContainer}>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>
                  <Ionicons name="play" size={14} color="#64748B" /> Desde
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#64748B" />
                  <Text style={styles.datePickerText}>
                    {startDate || 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputGroup}>
                <Text style={styles.dateLabel}>
                  <Ionicons name="stop" size={14} color="#64748B" /> Hasta
                </Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#64748B" />
                  <Text style={styles.datePickerText}>
                    {endDate || 'Seleccionar fecha'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoBoxWarning}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.infoBoxTextWarning}>
                Selecciona las fechas tocando en los botones del calendario
              </Text>
            </View>
          </View>
        )}

        {reportType === 'by-project' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={20} color="#EF4444" />
              <Text style={styles.cardTitle}>Filtrar por Proyecto</Text>
            </View>

            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="folder" size={16} color="#64748B" /> Selecciona un Proyecto
              </Text>
              <TouchableOpacity
                style={styles.projectSelector}
                onPress={() => setProjectsModalVisible(true)}
              >
                <View style={styles.projectSelectorContent}>
                  {selectedProject ? (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      <View style={styles.projectSelectorInfo}>
                        <Text style={styles.projectSelectedText}>
                          {selectedProject.project_name}
                        </Text>
                        <Text style={styles.projectSelectedClient}>
                          {selectedProject.client_name}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="business-outline" size={24} color="#94A3B8" />
                      <Text style={styles.projectPlaceholder}>
                        Toca para seleccionar un proyecto
                      </Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectorSection}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" /> Rango de Fechas (Opcional)
              </Text>
              <View style={styles.dateInputsContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Desde</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.datePickerText}>
                      {startDate || 'Seleccionar'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.dateLabel}>Hasta</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#64748B" />
                    <Text style={styles.datePickerText}>
                      {endDate || 'Seleccionar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.hintText}>
                💡 Si no seleccionas fechas, se usará el último mes
              </Text>
            </View>
          </View>
        )}

        {/* Generate Button */}
        <View style={styles.generateCard}>
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateButtonText}>Generando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generar Reporte PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBoxInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#0EA5E9" />
            <Text style={styles.infoBoxTextInfo}>
              El PDF incluirá todos los reportes, químicos utilizados y estadísticas del período seleccionado
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de Selección de Proyecto */}
      <Modal
        visible={projectsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProjectsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proyecto</Text>
              <TouchableOpacity onPress={() => setProjectsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingProjects ? (
                <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 20 }} />
              ) : projects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No hay proyectos disponibles</Text>
                </View>
              ) : (
                projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectItem,
                      selectedProject?.id === project.id && styles.projectItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedProject(project);
                      setProjectsModalVisible(false);
                    }}
                  >
                    <View style={styles.projectItemContent}>
                      <Text style={styles.projectItemName}>{project.project_name}</Text>
                      <Text style={styles.projectItemClient}>{project.client_name}</Text>
                      <Text style={styles.projectItemLocation}>
                        📍 {project.location}
                      </Text>
                    </View>
                    {selectedProject?.id === project.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de DatePicker para Fecha de Inicio */}
      <Modal
        visible={showStartDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Seleccionar Fecha de Inicio</Text>
            </View>
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="spinner"
              onChange={handleStartDateChange}
              textColor="#1E293B"
            />
            <View style={styles.dateModalButtons}>
              <TouchableOpacity
                style={styles.dateModalCancelButton}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.dateModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateModalConfirmButton}
                onPress={confirmStartDate}
              >
                <Text style={styles.dateModalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de DatePicker para Fecha Final */}
      <Modal
        visible={showEndDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Seleccionar Fecha Final</Text>
            </View>
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateChange}
              textColor="#1E293B"
            />
            <View style={styles.dateModalButtons}>
              <TouchableOpacity
                style={styles.dateModalCancelButton}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.dateModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateModalConfirmButton}
                onPress={confirmEndDate}
              >
                <Text style={styles.dateModalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    backgroundColor: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    backgroundColor: '#EF4444',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectorSection: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typeCardActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeIconContainerActive: {
    backgroundColor: '#EF4444',
  },
  typeCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  typeCardTextActive: {
    color: '#EF4444',
  },
  typeCardDescription: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  monthSelector: {
    gap: 8,
    paddingBottom: 4,
  },
  monthButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  monthButtonActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#EFF6FF',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  monthButtonTextActive: {
    color: '#0EA5E9',
  },
  yearSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  yearButtonActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#EFF6FF',
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  yearButtonTextActive: {
    color: '#0EA5E9',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  projectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  projectSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  projectSelectorInfo: {
    flex: 1,
  },
  projectPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  projectSelectedText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 2,
  },
  projectSelectedClient: {
    fontSize: 13,
    color: '#64748B',
  },
  selectedPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  selectedPeriodText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  generateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBoxSuccess: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoBoxWarning: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  infoBoxInfo: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
  infoBoxTextWarning: {
    flex: 1,
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  infoBoxTextInfo: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '500',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  projectItemSelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  projectItemContent: {
    flex: 1,
  },
  projectItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  projectItemClient: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  projectItemLocation: {
    fontSize: 13,
    color: '#94A3B8',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  datePickerText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  datePickerConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  datePickerConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dateModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateModalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  dateModalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  dateModalConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dateModalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
