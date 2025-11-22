import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { startNewReport, updateCurrentReport, finishReport, setLoading, setError } from '../store/reportSlice';
import { incrementTodayReports } from '../store/statsSlice';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import ApiService from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Parameters, Chemicals, EquipmentCheck } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';

type NavigationProp = StackNavigationProp<any>;

export default function UnifiedNewReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, token } = useAppSelector((state) => state.auth);
  const { currentReport, isLoading } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9; // Actualizado: 1-Proyecto, 2-5 Fotos parámetros, 6-Químicos, 7-Equipos, 8-Materiales/Obs, 9-Finalizar

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  
  // 5 fotos de parámetros
  const [photoCloroPh, setPhotoCloroPh] = useState<string | null>(null);
  const [photoAlcalinidad, setPhotoAlcalinidad] = useState<string | null>(null);
  const [photoDureza, setPhotoDureza] = useState<string | null>(null);
  const [photoEstabilizador, setPhotoEstabilizador] = useState<string | null>(null);
  
  // Checkboxes para parámetros opcionales
  const [durezaAplica, setDurezaAplica] = useState(false);
  const [estabilizadorAplica, setEstabilizadorAplica] = useState(false);
  const [salAplica, setSalAplica] = useState(false);
  
  // Guardar hora de entrada cuando se inicia el reporte
  const [entryTime, setEntryTime] = useState<string | null>(null);
  
  // Usar strings para permitir la entrada de decimales mientras se escribe
  const [parametersBeforeStr, setParametersBeforeStr] = useState<Record<string, string>>({
    cl: '', ph: '', alk: '', stabilizer: '', hardness: '', salt: '', temperature: ''
  });
  
  const [parametersBefore, setParametersBefore] = useState<Parameters>({
    cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
  });

  const [chemicals, setChemicals] = useState<Chemicals>({
    tricloro: 0, tabletas: 0, acido: 0, soda: 0, bicarbonato: 0,
    sal: 0, alguicida: 0, clarificador: 0, cloro_liquido: 0
  });

  const [equipmentCheck, setEquipmentCheck] = useState<EquipmentCheck>({
    bomba_filtro: false, bomba_reposadero: false, bomba_espejo: false,
    bomba_jets: false, blower: false, luces_piscina: false, luces_spa: false,
    luces_espejo: false, filtro_piscina: false, filtro_spa: false,
    filtro_espejo: false, clorinador_piscina: false, clorinador_spa: false,
    clorinador_espejo: false
  });

  const [materialsDelivered, setMaterialsDelivered] = useState('');
  const [observations, setObservations] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      if (!token) return;
      try {
        setIsLoadingProjects(true);
        const projectsData = await ApiService.getAllProjects(token);
        // Filter only active projects
        const activeProjects = projectsData.filter((p: any) => p.status === 'active');
        setProjects(activeProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        Alert.alert('Error', 'No se pudieron cargar los proyectos');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    loadProjects();
  }, [token]);

  const handleImagePicker = async (type: 'cloro_ph' | 'alcalinidad' | 'dureza' | 'estabilizador') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      switch (type) {
        case 'cloro_ph':
          setPhotoCloroPh(result.assets[0].uri);
          break;
        case 'alcalinidad':
          setPhotoAlcalinidad(result.assets[0].uri);
          break;
        case 'dureza':
          setPhotoDureza(result.assets[0].uri);
          break;
        case 'estabilizador':
          setPhotoEstabilizador(result.assets[0].uri);
          break;
      }
    }
  };

  const handleCameraCapture = async (type: 'cloro_ph' | 'alcalinidad' | 'dureza' | 'estabilizador') => {
    try {
      // IMPORTANTE: Pedir permisos primero en iOS
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Necesitas dar permiso para usar la cámara en Configuración > Expo Go > Cámara',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => {
              // En iOS puedes abrir configuración
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            }}
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        switch (type) {
          case 'cloro_ph':
            setPhotoCloroPh(result.assets[0].uri);
            break;
          case 'alcalinidad':
            setPhotoAlcalinidad(result.assets[0].uri);
            break;
          case 'dureza':
            setPhotoDureza(result.assets[0].uri);
            break;
          case 'estabilizador':
            setPhotoEstabilizador(result.assets[0].uri);
            break;
        }
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const handleParameterChange = (type: 'before' | 'after', key: keyof Parameters, value: string) => {
    // Permitir decimales y puntos mientras se escribe
    // Aceptar números, punto decimal y comas
    const cleanValue = value.replace(',', '.');
    
    // Actualizar el valor string para mostrar en el input
    setParametersBeforeStr(prev => ({ ...prev, [key]: value }));
    
    // Convertir a número para el estado numérico (usado en validación y submit)
    const numValue = parseFloat(cleanValue) || 0;
    setParametersBefore(prev => ({ ...prev, [key]: numValue }));
  };

  const handleChemicalChange = (key: keyof Chemicals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setChemicals(prev => ({ ...prev, [key]: numValue }));
  };

  const handleEquipmentToggle = (key: keyof EquipmentCheck) => {
    setEquipmentCheck(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const validateForm = () => {
    if (!selectedProject) {
      Alert.alert('Error', 'Debes seleccionar un proyecto');
      return false;
    }
    if (!photoCloroPh) {
      Alert.alert('Error', 'La foto de Cloro y pH es obligatoria');
      return false;
    }
    if (!photoAlcalinidad) {
      Alert.alert('Error', 'La foto de Alcalinidad es obligatoria');
      return false;
    }
    if (durezaAplica && !photoDureza) {
      Alert.alert('Error', 'La foto de Dureza es obligatoria cuando aplica');
      return false;
    }
    if (estabilizadorAplica && !photoEstabilizador) {
      Alert.alert('Error', 'La foto de Estabilizador es obligatoria cuando aplica');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Enviar Reporte',
      '¿Estás seguro que deseas enviar este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              dispatch(setLoading(true));
              dispatch(setError(null));

              const tempId = `temp_${Date.now()}`;

              // Subir foto Cloro/pH
              let photoCloroPhUrl = '';
              if (photoCloroPh) {
                try {
                  const upload = await ApiService.uploadImage(
                    photoCloroPh, 
                    token || '', 
                    `${tempId}_cloro_ph`
                  );
                  photoCloroPhUrl = upload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen Cloro/pH:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen de Cloro/pH');
                  return;
                }
              }

              // Subir foto Alcalinidad
              let photoAlcalinidadUrl = '';
              if (photoAlcalinidad) {
                try {
                  const upload = await ApiService.uploadImage(
                    photoAlcalinidad, 
                    token || '', 
                    `${tempId}_alcalinidad`
                  );
                  photoAlcalinidadUrl = upload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen Alcalinidad:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen de Alcalinidad');
                  return;
                }
              }

              // Subir foto Dureza (si aplica)
              let photoDurezaUrl = '';
              if (photoDureza && durezaAplica) {
                try {
                  const upload = await ApiService.uploadImage(
                    photoDureza, 
                    token || '', 
                    `${tempId}_dureza`
                  );
                  photoDurezaUrl = upload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen Dureza:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen de Dureza');
                  return;
                }
              }

              // Subir foto Estabilizador (si aplica)
              let photoEstabilizadorUrl = '';
              if (photoEstabilizador && estabilizadorAplica) {
                try {
                  const upload = await ApiService.uploadImage(
                    photoEstabilizador, 
                    token || '', 
                    `${tempId}_estabilizador`
                  );
                  photoEstabilizadorUrl = upload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen Estabilizador:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen de Estabilizador');
                  return;
                }
              }

              const reportData = {
                projectId: selectedProject.id,
                clientName: selectedProject.client_name,
                location: selectedProject.location,
                technician: user?.name || 'Técnico',
                entryTime: entryTime || new Date().toISOString(),
                exitTime: new Date().toISOString(),
                userId: user?.id || 'unknown',
                // Nuevas 4 fotos
                photoCloroPh: photoCloroPhUrl,
                photoAlcalinidad: photoAlcalinidadUrl,
                photoDureza: photoDurezaUrl,
                photoEstabilizador: photoEstabilizadorUrl,
                // Flags de parámetros opcionales
                durezaAplica: durezaAplica,
                estabilizadorAplica: estabilizadorAplica,
                salAplica: salAplica,
                // Datos existentes
                parametersBefore,
                chemicals,
                equipmentCheck,
                materialsDelivered: materialsDelivered.trim(),
                observations: observations.trim(),
                receivedBy: receivedBy.trim(),
                createdAt: new Date().toISOString(),
              };

              console.log('⏰ Enviando reporte con horas:');
              console.log('   Entrada:', new Date(entryTime || '').toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }));
              console.log('   Salida:', new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }));
              console.log('📸 Fotos incluidas:', {
                photoCloroPh: !!photoCloroPhUrl,
                photoAlcalinidad: !!photoAlcalinidadUrl,
                photoDureza: !!photoDurezaUrl,
                photoEstabilizador: !!photoEstabilizadorUrl,
              });

              const savedReport = await ApiService.createReport(reportData as any, token || '');
              
              dispatch(incrementTodayReports());
              
              Alert.alert(
                '✅ Reporte Enviado Exitosamente',
                `El reporte ha sido registrado correctamente.\n\n` +
                `📋 Proyecto: ${selectedProject.project_name}\n` +
                `📍 Ubicación: ${selectedProject.location}\n\n` +
                `El PDF será generado y enviado al cliente automáticamente.`,
                [
                  { 
                    text: 'Ver Reportes', 
                    onPress: () => navigation.replace('ReportHistory')
                  },
                  { 
                    text: 'Ir al Inicio', 
                    onPress: () => navigation.replace('Dashboard'),
                    style: 'cancel'
                  }
                ]
              );

            } catch (error: any) {
              console.error('Error al enviar reporte:', error);
              Alert.alert('Error', `No se pudo enviar el reporte: ${error.message}`);
            } finally {
              dispatch(setLoading(false));
            }
          },
        },
      ]
    );
  };

  const parameterConfigs = [
    { key: 'cl', label: 'Cloro Libre (ppm)', icon: 'water-outline' },
    { key: 'ph', label: 'pH', icon: 'beaker-outline' },
    { key: 'alk', label: 'Alcalinidad (ppm)', icon: 'flask-outline' },
    { key: 'stabilizer', label: 'Estabilizador (ppm)', icon: 'shield-outline' },
    { key: 'hardness', label: 'Dureza (ppm)', icon: 'hammer-outline' },
    { key: 'salt', label: 'Sal (ppm)', icon: 'cube-outline' },
    { key: 'temperature', label: 'Temperatura (°C)', icon: 'thermometer-outline' },
  ];

  const chemicalConfigs = [
    { key: 'tricloro', label: 'Tricloro', unit: 'kg' },
    { key: 'tabletas', label: 'Tabletas de Cloro', unit: 'unidades' },
    { key: 'acido', label: 'Ácido', unit: 'L' },
    { key: 'soda', label: 'Soda', unit: 'kg' },
    { key: 'bicarbonato', label: 'Bicarbonato', unit: 'kg' },
    { key: 'sal', label: 'Sal', unit: 'kg' },
    { key: 'alguicida', label: 'Alguicida', unit: 'L' },
    { key: 'clarificador', label: 'Clarificador', unit: 'L' },
    { key: 'cloro_liquido', label: 'Cloro Líquido', unit: 'L' },
  ];

  const equipmentSections = [
    {
      title: 'Bombas',
      items: [
        { key: 'bomba_filtro', label: 'Bomba de Filtro' },
        { key: 'bomba_reposadero', label: 'Bomba de Reposadero' },
        { key: 'bomba_espejo', label: 'Bomba de Espejo' },
        { key: 'bomba_jets', label: 'Bomba de Jets' },
        { key: 'blower', label: 'Blower' },
      ]
    },
    {
      title: 'Iluminación',
      items: [
        { key: 'luces_piscina', label: 'Luces de Piscina' },
        { key: 'luces_spa', label: 'Luces de Spa' },
        { key: 'luces_espejo', label: 'Luces de Espejo' },
      ]
    },
    {
      title: 'Filtración',
      items: [
        { key: 'filtro_piscina', label: 'Filtro de Piscina' },
        { key: 'filtro_spa', label: 'Filtro de Spa' },
        { key: 'filtro_espejo', label: 'Filtro de Espejo' },
      ]
    },
    {
      title: 'Clorinadores',
      items: [
        { key: 'clorinador_piscina', label: 'Clorinador de Piscina' },
        { key: 'clorinador_spa', label: 'Clorinador de Spa' },
        { key: 'clorinador_espejo', label: 'Clorinador de Espejo' },
      ]
    }
  ];

  const getStepProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  const canProceedToNextStep = () => {
    switch(currentStep) {
      case 1: // Proyecto
        return selectedProject !== null;
      case 2: // Cloro y pH + foto
        return photoCloroPh !== null && parametersBefore.cl > 0 && parametersBefore.ph > 0 && parametersBefore.temperature > 0;
      case 3: // Alcalinidad + foto
        return photoAlcalinidad !== null && parametersBefore.alk > 0;
      case 4: // Dureza (opcional)
        if (!durezaAplica) return true; // Si no aplica, puede continuar
        return photoDureza !== null && parametersBefore.hardness > 0;
      case 5: // Estabilizador (opcional)
        if (!estabilizadorAplica) return true; // Si no aplica, puede continuar
        return photoEstabilizador !== null && parametersBefore.stabilizer > 0;
      case 6: // Sal (opcional, sin foto)
        if (!salAplica) return true; // Si no aplica, puede continuar
        return parametersBefore.salt > 0;
      case 7: // Químicos (opcional)
        return true;
      case 8: // Equipos (opcional)
        return true;
      case 9: // Materiales y observaciones (opcional)
        return true;
      default: 
        return false;
    }
  };

  return (
    <View style={styles.fullContainer}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Nuevo Reporte</Text>
            <Text style={styles.headerSubtitle}>Paso {currentStep} de {totalSteps}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.saveButton}>
              <MaterialCommunityIcons name="content-save-outline" size={22} color="#0066CC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${getStepProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(getStepProgress())}% completado</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepIndicators}>
          <View style={styles.stepIndicatorsContainer}>
            {[
              { num: 1, icon: 'home', label: 'Proyecto' },
              { num: 2, icon: 'flask-outline', label: 'Cl/pH' },
              { num: 3, icon: 'water', label: 'Alcal.' },
              { num: 4, icon: 'diamond', label: 'Dureza' },
              { num: 5, icon: 'shield-checkmark', label: 'Estab.' },
              { num: 6, icon: 'color-filter', label: 'Sal' },
              { num: 7, icon: 'flask', label: 'Químicos' },
              { num: 8, icon: 'construct', label: 'Equipos' },
              { num: 9, icon: 'clipboard', label: 'Final' },
            ].map((step) => (
              <View
                key={step.num}
                style={[
                  styles.stepIndicator,
                  currentStep === step.num && styles.stepIndicatorActive,
                  currentStep > step.num && styles.stepIndicatorCompleted,
                ]}
              >
                <View style={[
                  styles.stepIcon,
                  currentStep === step.num && styles.stepIconActive,
                  currentStep > step.num && styles.stepIconCompleted,
                ]}>
                  {currentStep > step.num ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Ionicons name={step.icon as any} size={16} color={currentStep === step.num ? 'white' : '#999'} />
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  currentStep === step.num && styles.stepLabelActive,
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconLarge}>
                  <Ionicons name="home" size={32} color="#0066CC" />
                </View>
                <Text style={styles.stepTitle}>Seleccionar Proyecto</Text>
                <Text style={styles.stepDescription}>
                  Elige el proyecto al que le darás servicio
                </Text>
              </View>

              <View style={styles.card}>
                {isLoadingProjects ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando proyectos...</Text>
                  </View>
                ) : projects.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>No hay proyectos activos</Text>
                    <Text style={styles.emptySubtext}>Contacta al administrador para activar proyectos</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        <Ionicons name="home" size={16} color="#666" /> Proyecto *
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowProjectPicker(true)}
                      >
                        <View style={styles.dropdownContent}>
                          {selectedProject ? (
                            <>
                              <Ionicons name="home" size={20} color="#0066CC" />
                              <Text style={styles.dropdownText}>{selectedProject.project_name}</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="chevron-down-circle-outline" size={20} color="#999" />
                              <Text style={styles.dropdownPlaceholder}>Selecciona un proyecto</Text>
                            </>
                          )}
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>

                    {selectedProject && (
                      <View style={styles.selectedProjectCard}>
                        <Text style={styles.selectedProjectTitle}>
                          <Ionicons name="information-circle" size={16} /> Información del Proyecto
                        </Text>
                        <View style={styles.selectedProjectInfo}>
                          <Text style={styles.selectedProjectLabel}>Cliente:</Text>
                          <Text style={styles.selectedProjectValue}>{selectedProject.client_name}</Text>
                        </View>
                        <View style={styles.selectedProjectInfo}>
                          <Text style={styles.selectedProjectLabel}>Ubicación:</Text>
                          <Text style={styles.selectedProjectValue}>{selectedProject.location}</Text>
                        </View>
                        {selectedProject.client_email && (
                          <View style={styles.selectedProjectInfo}>
                            <Text style={styles.selectedProjectLabel}>Email:</Text>
                            <Text style={styles.selectedProjectValue}>{selectedProject.client_email}</Text>
                          </View>
                        )}
                        {selectedProject.client_phone && (
                          <View style={styles.selectedProjectInfo}>
                            <Text style={styles.selectedProjectLabel}>Teléfono:</Text>
                            <Text style={styles.selectedProjectValue}>{selectedProject.client_phone}</Text>
                          </View>
                        )}
                        {selectedProject.pool_gallons && (
                          <View style={styles.selectedProjectInfo}>
                            <Text style={styles.selectedProjectLabel}>Galonaje:</Text>
                            <Text style={styles.selectedProjectValue}>{selectedProject.pool_gallons.toLocaleString()} gal</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        <Ionicons name="person-circle" size={16} color="#666" /> Técnico Asignado
                      </Text>
                      <View style={styles.technicianCard}>
                        <View style={styles.technicianAvatar}>
                          <Text style={styles.technicianInitial}>
                            {user?.name?.charAt(0).toUpperCase() || 'T'}
                          </Text>
                        </View>
                        <View style={styles.technicianInfo}>
                          <Text style={styles.technicianName}>{user?.name || 'Técnico'}</Text>
                          <Text style={styles.technicianRole}>Técnico de mantenimiento</Text>
                        </View>
                        <View style={styles.technicianBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="flask-outline" size={32} color="#4CAF50" />
                </View>
                <Text style={styles.stepTitle}>Cloro y pH</Text>
                <Text style={styles.stepDescription}>
                  Mide cloro libre, pH y temperatura del agua
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.parameterRow}>
                  <View style={styles.parameterIcon}>
                    <Ionicons name="water" size={20} color="#0066CC" />
                  </View>
                  <View style={styles.parameterContent}>
                    <Text style={styles.parameterLabel}>Cloro Libre (ppm)</Text>
                    <TextInput
                      style={styles.parameterInput}
                      value={parametersBeforeStr.cl}
                      onChangeText={(value) => handleParameterChange('before', 'cl', value)}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.parameterRow}>
                  <View style={styles.parameterIcon}>
                    <Ionicons name="flask" size={20} color="#0066CC" />
                  </View>
                  <View style={styles.parameterContent}>
                    <Text style={styles.parameterLabel}>pH</Text>
                    <TextInput
                      style={styles.parameterInput}
                      value={parametersBeforeStr.ph}
                      onChangeText={(value) => handleParameterChange('before', 'ph', value)}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                <View style={styles.parameterRow}>
                  <View style={styles.parameterIcon}>
                    <Ionicons name="thermometer" size={20} color="#0066CC" />
                  </View>
                  <View style={styles.parameterContent}>
                    <Text style={styles.parameterLabel}>Temperatura (°C)</Text>
                    <TextInput
                      style={styles.parameterInput}
                      value={parametersBeforeStr.temperature}
                      onChangeText={(value) => handleParameterChange('before', 'temperature', value)}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.photoSectionTitle}>📸 Foto de Medición</Text>
                {photoCloroPh ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoCloroPh }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.photoRemove}
                      onPress={() => setPhotoCloroPh(null)}
                    >
                      <Ionicons name="close-circle" size={32} color="#f44336" />
                    </TouchableOpacity>
                    <View style={styles.photoOverlay}>
                      <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
                      <Text style={styles.photoOverlayText}>Foto capturada</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoEmpty}>
                    <View style={styles.photoEmptyIcon}>
                      <Ionicons name="camera-outline" size={64} color="#ccc" />
                    </View>
                    <Text style={styles.photoEmptyTitle}>Sin foto</Text>
                    <Text style={styles.photoEmptyText}>
                      Toma una foto de la medición de cloro y pH
                    </Text>
                  </View>
                )}

                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={styles.photoActionPrimary}
                    onPress={() => handleCameraCapture('cloro_ph')}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.photoActionText}>Tomar Foto</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoActionSecondary}
                    onPress={() => handleImagePicker('cloro_ph')}
                  >
                    <Ionicons name="images" size={24} color="#0066CC" />
                    <Text style={styles.photoActionTextSecondary}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e1f5fe' }]}>
                  <Ionicons name="water" size={32} color="#0288D1" />
                </View>
                <Text style={styles.stepTitle}>Alcalinidad</Text>
                <Text style={styles.stepDescription}>
                  Mide y registra la alcalinidad del agua
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.parameterRow}>
                  <View style={styles.parameterIcon}>
                    <Ionicons name="analytics" size={20} color="#0066CC" />
                  </View>
                  <View style={styles.parameterContent}>
                    <Text style={styles.parameterLabel}>Alcalinidad (ppm)</Text>
                    <TextInput
                      style={styles.parameterInput}
                      value={parametersBeforeStr.alk}
                      onChangeText={(value) => handleParameterChange('before', 'alk', value)}
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.photoSectionTitle}>📸 Foto de Medición</Text>
                {photoAlcalinidad ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photoAlcalinidad }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.photoRemove}
                      onPress={() => setPhotoAlcalinidad(null)}
                    >
                      <Ionicons name="close-circle" size={32} color="#f44336" />
                    </TouchableOpacity>
                    <View style={styles.photoOverlay}>
                      <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
                      <Text style={styles.photoOverlayText}>Foto capturada</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoEmpty}>
                    <View style={styles.photoEmptyIcon}>
                      <Ionicons name="camera-outline" size={64} color="#ccc" />
                    </View>
                    <Text style={styles.photoEmptyTitle}>Sin foto</Text>
                    <Text style={styles.photoEmptyText}>
                      Toma una foto de la medición de alcalinidad
                    </Text>
                  </View>
                )}

                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={styles.photoActionPrimary}
                    onPress={() => handleCameraCapture('alcalinidad')}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.photoActionText}>Tomar Foto</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoActionSecondary}
                    onPress={() => handleImagePicker('alcalinidad')}
                  >
                    <Ionicons name="images" size={24} color="#0066CC" />
                    <Text style={styles.photoActionTextSecondary}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#fce4ec' }]}>
                  <Ionicons name="diamond" size={32} color="#C2185B" />
                </View>
                <Text style={styles.stepTitle}>Dureza (Opcional)</Text>
                <Text style={styles.stepDescription}>
                  Marca si aplica dureza en este mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                <TouchableOpacity 
                  style={[styles.checkboxRow, durezaAplica && styles.checkboxRowActive]}
                  onPress={() => setDurezaAplica(!durezaAplica)}
                >
                  <View style={[styles.checkbox, durezaAplica && styles.checkboxChecked]}>
                    {durezaAplica && <Ionicons name="checkmark" size={20} color="white" />}
                  </View>
                  <Text style={[styles.checkboxLabel, durezaAplica && styles.checkboxLabelActive]}>
                    Aplica medición de dureza
                  </Text>
                </TouchableOpacity>
              </View>

              {durezaAplica && (
                <>
                  <View style={styles.card}>
                    <View style={styles.parameterRow}>
                      <View style={styles.parameterIcon}>
                        <Ionicons name="diamond" size={20} color="#0066CC" />
                      </View>
                      <View style={styles.parameterContent}>
                        <Text style={styles.parameterLabel}>Dureza (ppm)</Text>
                        <TextInput
                          style={styles.parameterInput}
                          value={parametersBeforeStr.hardness}
                          onChangeText={(value) => handleParameterChange('before', 'hardness', value)}
                          keyboardType="decimal-pad"
                          placeholder="0.0"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.photoSectionTitle}>📸 Foto de Medición</Text>
                    {photoDureza ? (
                      <View style={styles.photoPreview}>
                        <Image source={{ uri: photoDureza }} style={styles.photoImage} />
                        <TouchableOpacity 
                          style={styles.photoRemove}
                          onPress={() => setPhotoDureza(null)}
                        >
                          <Ionicons name="close-circle" size={32} color="#f44336" />
                        </TouchableOpacity>
                        <View style={styles.photoOverlay}>
                          <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
                          <Text style={styles.photoOverlayText}>Foto capturada</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoEmpty}>
                        <View style={styles.photoEmptyIcon}>
                          <Ionicons name="camera-outline" size={64} color="#ccc" />
                        </View>
                        <Text style={styles.photoEmptyTitle}>Sin foto</Text>
                        <Text style={styles.photoEmptyText}>
                          Toma una foto de la medición de dureza
                        </Text>
                      </View>
                    )}

                    <View style={styles.photoActions}>
                      <TouchableOpacity 
                        style={styles.photoActionPrimary}
                        onPress={() => handleCameraCapture('dureza')}
                      >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.photoActionText}>Tomar Foto</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.photoActionSecondary}
                        onPress={() => handleImagePicker('dureza')}
                      >
                        <Ionicons name="images" size={24} color="#0066CC" />
                        <Text style={styles.photoActionTextSecondary}>Galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="shield-checkmark" size={32} color="#F57C00" />
                </View>
                <Text style={styles.stepTitle}>Estabilizador (Opcional)</Text>
                <Text style={styles.stepDescription}>
                  Marca si aplica estabilizador en este mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                <TouchableOpacity 
                  style={[styles.checkboxRow, estabilizadorAplica && styles.checkboxRowActive]}
                  onPress={() => setEstabilizadorAplica(!estabilizadorAplica)}
                >
                  <View style={[styles.checkbox, estabilizadorAplica && styles.checkboxChecked]}>
                    {estabilizadorAplica && <Ionicons name="checkmark" size={20} color="white" />}
                  </View>
                  <Text style={[styles.checkboxLabel, estabilizadorAplica && styles.checkboxLabelActive]}>
                    Aplica medición de estabilizador
                  </Text>
                </TouchableOpacity>
              </View>

              {estabilizadorAplica && (
                <>
                  <View style={styles.card}>
                    <View style={styles.parameterRow}>
                      <View style={styles.parameterIcon}>
                        <Ionicons name="shield-checkmark" size={20} color="#0066CC" />
                      </View>
                      <View style={styles.parameterContent}>
                        <Text style={styles.parameterLabel}>Estabilizador (ppm)</Text>
                        <TextInput
                          style={styles.parameterInput}
                          value={parametersBeforeStr.stabilizer}
                          onChangeText={(value) => handleParameterChange('before', 'stabilizer', value)}
                          keyboardType="decimal-pad"
                          placeholder="0.0"
                          placeholderTextColor="#999"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.photoSectionTitle}>📸 Foto de Medición</Text>
                    {photoEstabilizador ? (
                      <View style={styles.photoPreview}>
                        <Image source={{ uri: photoEstabilizador }} style={styles.photoImage} />
                        <TouchableOpacity 
                          style={styles.photoRemove}
                          onPress={() => setPhotoEstabilizador(null)}
                        >
                          <Ionicons name="close-circle" size={32} color="#f44336" />
                        </TouchableOpacity>
                        <View style={styles.photoOverlay}>
                          <Ionicons name="checkmark-circle" size={48} color="#4caf50" />
                          <Text style={styles.photoOverlayText}>Foto capturada</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.photoEmpty}>
                        <View style={styles.photoEmptyIcon}>
                          <Ionicons name="camera-outline" size={64} color="#ccc" />
                        </View>
                        <Text style={styles.photoEmptyTitle}>Sin foto</Text>
                        <Text style={styles.photoEmptyText}>
                          Toma una foto de la medición de estabilizador
                        </Text>
                      </View>
                    )}

                    <View style={styles.photoActions}>
                      <TouchableOpacity 
                        style={styles.photoActionPrimary}
                        onPress={() => handleCameraCapture('estabilizador')}
                      >
                        <Ionicons name="camera" size={24} color="white" />
                        <Text style={styles.photoActionText}>Tomar Foto</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.photoActionSecondary}
                        onPress={() => handleImagePicker('estabilizador')}
                      >
                        <Ionicons name="images" size={24} color="#0066CC" />
                        <Text style={styles.photoActionTextSecondary}>Galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}

          {currentStep === 6 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="color-filter" size={32} color="#00ACC1" />
                </View>
                <Text style={styles.stepTitle}>Sal (Opcional)</Text>
                <Text style={styles.stepDescription}>
                  Marca si aplica sal en este mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                <TouchableOpacity 
                  style={[styles.checkboxRow, salAplica && styles.checkboxRowActive]}
                  onPress={() => setSalAplica(!salAplica)}
                >
                  <View style={[styles.checkbox, salAplica && styles.checkboxChecked]}>
                    {salAplica && <Ionicons name="checkmark" size={20} color="white" />}
                  </View>
                  <Text style={[styles.checkboxLabel, salAplica && styles.checkboxLabelActive]}>
                    Aplica medición de sal
                  </Text>
                </TouchableOpacity>
              </View>

              {salAplica && (
                <View style={styles.card}>
                  <View style={styles.parameterRow}>
                    <View style={styles.parameterIcon}>
                      <Ionicons name="color-filter" size={20} color="#0066CC" />
                    </View>
                    <View style={styles.parameterContent}>
                      <Text style={styles.parameterLabel}>Sal (ppm)</Text>
                      <TextInput
                        style={styles.parameterInput}
                        value={parametersBeforeStr.salt}
                        onChangeText={(value) => handleParameterChange('before', 'salt', value)}
                        keyboardType="decimal-pad"
                        placeholder="0.0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {currentStep === 7 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#f3e5f5' }]}>
                  <Ionicons name="flask" size={32} color="#9c27b0" />
                </View>
                <Text style={styles.stepTitle}>Químicos Utilizados</Text>
                <Text style={styles.stepDescription}>
                  Registra las cantidades de químicos aplicados (opcional)
                </Text>
              </View>

              <View style={styles.card}>
                {chemicalConfigs.map((chemical) => (
                  <View key={chemical.key} style={styles.chemicalRow}>
                    <View style={styles.chemicalInfo}>
                      <Text style={styles.chemicalLabel}>{chemical.label}</Text>
                      <Text style={styles.chemicalUnit}>{chemical.unit}</Text>
                    </View>
                    <TextInput
                      style={styles.chemicalInput}
                      value={(chemicals[chemical.key as keyof Chemicals] || 0).toString()}
                      onChangeText={(value) => handleChemicalChange(chemical.key as keyof Chemicals, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {currentStep === 8 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#fff8e1' }]}>
                  <Ionicons name="construct" size={32} color="#FF9800" />
                </View>
                <Text style={styles.stepTitle}>Revisión de Equipos</Text>
                <Text style={styles.stepDescription}>
                  Verifica el estado de los equipos instalados
                </Text>
              </View>

              {equipmentSections.map((section) => (
                <View key={section.title} style={styles.card}>
                  <Text style={styles.equipmentSectionTitle}>
                    {section.title}
                  </Text>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.equipmentItem,
                        equipmentCheck[item.key as keyof EquipmentCheck] && styles.equipmentItemChecked
                      ]}
                      onPress={() => handleEquipmentToggle(item.key as keyof EquipmentCheck)}
                    >
                      <View style={[
                        styles.equipmentCheckbox,
                        equipmentCheck[item.key as keyof EquipmentCheck] && styles.equipmentCheckboxChecked
                      ]}>
                        {equipmentCheck[item.key as keyof EquipmentCheck] && (
                          <Ionicons name="checkmark" size={18} color="white" />
                        )}
                      </View>
                      <Text style={[
                        styles.equipmentText,
                        equipmentCheck[item.key as keyof EquipmentCheck] && styles.equipmentTextChecked
                      ]}>
                        {item.label}
                      </Text>
                      {equipmentCheck[item.key as keyof EquipmentCheck] && (
                        <View style={styles.equipmentStatus}>
                          <Text style={styles.equipmentStatusText}>OK</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {currentStep === 9 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="clipboard" size={32} color="#4caf50" />
                </View>
                <Text style={styles.stepTitle}>Notas y Materiales</Text>
                <Text style={styles.stepDescription}>
                  Agrega observaciones y materiales entregados
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <MaterialCommunityIcons name="package-variant" size={16} color="#666" /> Materiales Entregados
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={materialsDelivered}
                    onChangeText={setMaterialsDelivered}
                    placeholder="Ej: 2 bolsas de cloro, 1 filtro nuevo..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="document-text" size={16} color="#666" /> Observaciones
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={observations}
                    onChangeText={setObservations}
                    placeholder="Ej: Limpieza profunda realizada, se encontró filtro dañado..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="person-circle" size={16} color="#666" /> Recibido por
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={receivedBy}
                    onChangeText={setReceivedBy}
                    placeholder="Nombre de quien recibe el servicio"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.navButtonSecondary}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Ionicons name="arrow-back" size={20} color="#0066CC" />
              <Text style={styles.navButtonTextSecondary}>Anterior</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps ? (
            <TouchableOpacity 
              style={[
                styles.navButtonPrimary,
                !canProceedToNextStep() && styles.navButtonDisabled,
                currentStep === 1 && styles.navButtonFull
              ]}
              onPress={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNextStep()}
            >
              <Text style={styles.navButtonText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                styles.submitButtonFinal,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !canProceedToNextStep()}
            >
              <MaterialCommunityIcons name="send-check" size={24} color="white" />
              <Text style={styles.submitButtonFinalText}>
                {isLoading ? 'Enviando...' : 'Enviar Reporte'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Project Picker Modal */}
      <Modal
        visible={showProjectPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Seleccionar Proyecto</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pickerList}>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.pickerItem,
                    selectedProject?.id === project.id && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setSelectedProject(project);
                    setShowProjectPicker(false);
                    // Guardar hora de entrada cuando selecciona el proyecto
                    if (!entryTime) {
                      setEntryTime(new Date().toISOString());
                      console.log('⏰ Hora de entrada registrada:', new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' }));
                    }
                  }}
                >
                  <View style={styles.pickerItemContent}>
                    <View style={[
                      styles.pickerItemIcon,
                      selectedProject?.id === project.id && styles.pickerItemIconSelected
                    ]}>
                      <Ionicons 
                        name="home" 
                        size={24} 
                        color={selectedProject?.id === project.id ? '#0066CC' : '#666'} 
                      />
                    </View>
                    <View style={styles.pickerItemInfo}>
                      <Text style={[
                        styles.pickerItemName,
                        selectedProject?.id === project.id && styles.pickerItemNameSelected
                      ]}>
                        {project.project_name}
                      </Text>
                      <Text style={styles.pickerItemDetails}>
                        {project.client_name}
                      </Text>
                      <Text style={styles.pickerItemLocation}>
                        📍 {project.location}
                      </Text>
                      {project.pool_gallons && (
                        <Text style={styles.pickerItemPool}>
                          💧 {project.pool_gallons.toLocaleString()} galones
                        </Text>
                      )}
                    </View>
                    {selectedProject?.id === project.id && (
                      <Ionicons name="checkmark-circle" size={28} color="#0066CC" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  
  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },

  // Container
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 0,
  },

  // Step Indicators
  stepIndicators: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
    opacity: 0.5,
  },
  stepIndicatorActive: {
    opacity: 1,
  },
  stepIndicatorCompleted: {
    opacity: 1,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepIconActive: {
    backgroundColor: '#0066CC',
  },
  stepIconCompleted: {
    backgroundColor: '#4caf50',
  },
  stepLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0066CC',
    fontWeight: '600',
  },

  // Step Content
  content: {
    padding: 20,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIconLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },

  // Cards
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Inputs
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },

  // Technician Card
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d6e9ff',
  },
  technicianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  technicianRole: {
    fontSize: 12,
    color: '#666',
  },
  technicianBadge: {
    marginLeft: 8,
  },

  // Photos
  photoPreview: {
    position: 'relative',
    marginBottom: 20,
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  photoRemove: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlayText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  photoEmpty: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  photoEmptyIcon: {
    marginBottom: 12,
  },
  photoEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
  },
  photoEmptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  photoActionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  photoActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  photoActionTextSecondary: {
    color: '#0066CC',
    fontSize: 15,
    fontWeight: '600',
  },

  // Parameters
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  parameterIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parameterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    width: 100,
    textAlign: 'center',
    backgroundColor: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Chemicals
  chemicalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chemicalInfo: {
    flex: 1,
  },
  chemicalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  chemicalUnit: {
    fontSize: 12,
    color: '#666',
  },
  chemicalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    width: 90,
    textAlign: 'center',
    backgroundColor: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Equipment
  equipmentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  equipmentItemChecked: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  equipmentCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentCheckboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  equipmentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  equipmentTextChecked: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  equipmentStatus: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  equipmentStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  // Summary
  summaryCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d6e9ff',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },

  // Comparison Card
  comparisonCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f57c00',
    marginBottom: 8,
  },
  comparisonSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },

  // Navigation
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonFull: {
    flex: 1,
  },
  navButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextSecondary: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  submitButtonFinal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonFinalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },

  // Project Styles
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  pickerContainer: {
    gap: 12,
  },
  projectOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  projectOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0066CC',
  },
  projectOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectNameSelected: {
    color: '#0066CC',
  },
  projectDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  projectPool: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  selectedProjectCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  selectedProjectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  selectedProjectInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  selectedProjectLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    width: 80,
  },
  selectedProjectValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },

  // Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
    flex: 1,
  },

  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pickerList: {
    padding: 16,
  },
  pickerItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0066CC',
  },
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerItemIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemIconSelected: {
    backgroundColor: '#bbdefb',
  },
  pickerItemInfo: {
    flex: 1,
  },
  pickerItemName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pickerItemNameSelected: {
    color: '#0066CC',
  },
  pickerItemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  pickerItemLocation: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  pickerItemPool: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
  },

  // Nuevos estilos para fotos y checkboxes
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 16,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  checkboxRowActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0066CC',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },

  checkboxLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  checkboxLabelActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
});
