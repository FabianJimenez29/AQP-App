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
  const totalSteps = 8;

  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [showParametersAfter, setShowParametersAfter] = useState(false);
  
  const [parametersBefore, setParametersBefore] = useState<Parameters>({
    cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
  });
  
  const [parametersAfter, setParametersAfter] = useState<Parameters>({
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

  useEffect(() => {
    const allParametersBeforeFilled = Object.values(parametersBefore).every(value => value > 0);
    if (allParametersBeforeFilled && !showParametersAfter) {
      setShowParametersAfter(true);
    }
  }, [parametersBefore, showParametersAfter]);

  const handleImagePicker = async (type: 'before' | 'after') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'before') {
        setBeforePhoto(result.assets[0].uri);
      } else {
        setAfterPhoto(result.assets[0].uri);
      }
    }
  };

  const handleCameraCapture = async (type: 'before' | 'after') => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'before') {
        setBeforePhoto(result.assets[0].uri);
      } else {
        setAfterPhoto(result.assets[0].uri);
      }
    }
  };

  const handleParameterChange = (type: 'before' | 'after', key: keyof Parameters, value: string) => {
    const numValue = parseFloat(value) || 0;
    if (type === 'before') {
      setParametersBefore(prev => ({ ...prev, [key]: numValue }));
    } else {
      setParametersAfter(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleChemicalChange = (key: keyof Chemicals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setChemicals(prev => ({ ...prev, [key]: numValue }));
  };

  const handleEquipmentToggle = (key: keyof EquipmentCheck) => {
    setEquipmentCheck(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const validateForm = () => {
    if (!clientName.trim()) {
      Alert.alert('Error', 'El nombre del cliente es obligatorio');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'La ubicación es obligatoria');
      return false;
    }
    if (!beforePhoto) {
      Alert.alert('Error', 'La foto antes del mantenimiento es obligatoria');
      return false;
    }
    if (!afterPhoto) {
      Alert.alert('Error', 'La foto después del mantenimiento es obligatoria');
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

              let beforePhotoUrl = '';
              let afterPhotoUrl = '';

              if (beforePhoto) {
                try {
                  const beforeUpload = await ApiService.uploadImage(
                    beforePhoto, 
                    token || '', 
                    `${tempId}_before`
                  );
                  beforePhotoUrl = beforeUpload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen antes:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen antes del mantenimiento');
                  return;
                }
              }

              if (afterPhoto) {
                try {
                  const afterUpload = await ApiService.uploadImage(
                    afterPhoto, 
                    token || '', 
                    `${tempId}_after`
                  );
                  afterPhotoUrl = afterUpload.url;
                } catch (uploadError) {
                  console.error('❌ Error subiendo imagen después:', uploadError);
                  Alert.alert('Error', 'No se pudo subir la imagen después del mantenimiento');
                  return;
                }
              }

              const reportData = {
                clientName: clientName.trim(),
                location: location.trim(),
                technician: user?.name || 'Técnico',
                entryTime: new Date().toISOString(),
                exitTime: new Date().toISOString(),
                userId: user?.id || 'unknown',
                beforePhoto: beforePhotoUrl, 
                afterPhoto: afterPhotoUrl,  
                parametersBefore,
                parametersAfter,
                chemicals,
                equipmentCheck,
                materialsDelivered: materialsDelivered.trim(),
                observations: observations.trim(),
                receivedBy: receivedBy.trim(),
                createdAt: new Date().toISOString(),
              };

              const savedReport = await ApiService.createReport(reportData as any, token || '');
              
              dispatch(incrementTodayReports());
              
              Alert.alert(
                'Éxito',
                'Reporte enviado correctamente con imágenes subidas a S3. El número de reporte se asignó automáticamente.',
                [{ text: 'OK', onPress: () => navigation.replace('Dashboard') }]
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
      case 1: return clientName.trim() && location.trim();
      case 2: return beforePhoto !== null;
      case 3: return Object.values(parametersBefore).every(v => v > 0);
      case 4: return true;
      case 5: return true; 
      case 6: return Object.values(parametersAfter).every(v => v > 0);
      case 7: return true; 
      case 8: return afterPhoto !== null;
      default: return false;
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
              { num: 1, icon: 'information-circle', label: 'Info' },
              { num: 2, icon: 'camera', label: 'Antes' },
              { num: 3, icon: 'analytics', label: 'Inicial' },
              { num: 4, icon: 'flask', label: 'Químicos' },
              { num: 5, icon: 'construct', label: 'Equipos' },
              { num: 6, icon: 'analytics', label: 'Final' },
              { num: 7, icon: 'clipboard', label: 'Notas' },
              { num: 8, icon: 'camera', label: 'Después' },
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
                  <Ionicons name="information-circle" size={32} color="#0066CC" />
                </View>
                <Text style={styles.stepTitle}>Información Básica</Text>
                <Text style={styles.stepDescription}>
                  Ingresa los datos del cliente y la ubicación del servicio
                </Text>
              </View>

              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="person" size={16} color="#666" /> Cliente *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder="Nombre completo del cliente"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    <Ionicons name="location" size={16} color="#666" /> Ubicación *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Dirección o ubicación exacta"
                    placeholderTextColor="#999"
                    multiline
                  />
                </View>

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
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="camera" size={32} color="#FF9800" />
                </View>
                <Text style={styles.stepTitle}>Foto Antes</Text>
                <Text style={styles.stepDescription}>
                  Captura el estado inicial de la piscina antes del mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                {beforePhoto ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: beforePhoto }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.photoRemove}
                      onPress={() => setBeforePhoto(null)}
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
                      Toma una foto del estado inicial de la piscina
                    </Text>
                  </View>
                )}

                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={styles.photoActionPrimary}
                    onPress={() => handleCameraCapture('before')}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.photoActionText}>Tomar Foto</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoActionSecondary}
                    onPress={() => handleImagePicker('before')}
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
                <View style={[styles.stepIconLarge, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="analytics" size={32} color="#2196F3" />
                </View>
                <Text style={styles.stepTitle}>Parámetros Iniciales</Text>
                <Text style={styles.stepDescription}>
                  Mide y registra los parámetros antes del mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                {parameterConfigs.map((param, index) => (
                  <View key={param.key} style={styles.parameterRow}>
                    <View style={styles.parameterIcon}>
                      <Ionicons name={param.icon as any} size={20} color="#0066CC" />
                    </View>
                    <View style={styles.parameterContent}>
                      <Text style={styles.parameterLabel}>{param.label}</Text>
                      <TextInput
                        style={styles.parameterInput}
                        value={parametersBefore[param.key as keyof Parameters].toString()}
                        onChangeText={(value) => handleParameterChange('before', param.key as keyof Parameters, value)}
                        keyboardType="decimal-pad"
                        placeholder="0.0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {currentStep === 4 && (
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

          {currentStep === 5 && (
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

          {currentStep === 6 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="analytics" size={32} color="#4caf50" />
                </View>
                <Text style={styles.stepTitle}>Parámetros Finales</Text>
                <Text style={styles.stepDescription}>
                  Mide y registra los parámetros después del mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                {parameterConfigs.map((param, index) => (
                  <View key={param.key} style={styles.parameterRow}>
                    <View style={[styles.parameterIcon, { backgroundColor: '#e8f5e9' }]}>
                      <Ionicons name={param.icon as any} size={20} color="#4caf50" />
                    </View>
                    <View style={styles.parameterContent}>
                      <Text style={styles.parameterLabel}>{param.label}</Text>
                      <TextInput
                        style={styles.parameterInput}
                        value={parametersAfter[param.key as keyof Parameters].toString()}
                        onChangeText={(value) => handleParameterChange('after', param.key as keyof Parameters, value)}
                        keyboardType="decimal-pad"
                        placeholder="0.0"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>
                  <MaterialCommunityIcons name="compare" size={18} color="#0066CC" /> Comparación
                </Text>
                <Text style={styles.comparisonSubtitle}>
                  Asegúrate de que los parámetros finales estén dentro del rango óptimo
                </Text>
              </View>
            </View>
          )}

          {currentStep === 7 && (
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

          {currentStep === 8 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconLarge, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="camera" size={32} color="#4caf50" />
                </View>
                <Text style={styles.stepTitle}>Foto Después</Text>
                <Text style={styles.stepDescription}>
                  Captura el resultado final del mantenimiento
                </Text>
              </View>

              <View style={styles.card}>
                {afterPhoto ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: afterPhoto }} style={styles.photoImage} />
                    <TouchableOpacity 
                      style={styles.photoRemove}
                      onPress={() => setAfterPhoto(null)}
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
                      Toma una foto del resultado final
                    </Text>
                  </View>
                )}

                <View style={styles.photoActions}>
                  <TouchableOpacity 
                    style={styles.photoActionPrimary}
                    onPress={() => handleCameraCapture('after')}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.photoActionText}>Tomar Foto</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoActionSecondary}
                    onPress={() => handleImagePicker('after')}
                  >
                    <Ionicons name="images" size={24} color="#0066CC" />
                    <Text style={styles.photoActionTextSecondary}>Galería</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen del Reporte</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.summaryLabel}>Cliente:</Text>
                  <Text style={styles.summaryValue}>{clientName || 'Sin especificar'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.summaryLabel}>Ubicación:</Text>
                  <Text style={styles.summaryValue}>{location || 'Sin especificar'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="checkmark-done" size={16} color="#666" />
                  <Text style={styles.summaryLabel}>Pasos completados:</Text>
                  <Text style={styles.summaryValue}>{currentStep} de {totalSteps}</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
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
});