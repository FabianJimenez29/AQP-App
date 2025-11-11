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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { startNewReport, updateCurrentReport, finishReport, setLoading, setError } from '../store/reportSlice';
import { incrementTodayReports } from '../store/statsSlice';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { Parameters, Chemicals, EquipmentCheck } from '../types';

type NavigationProp = StackNavigationProp<any>;

export default function UnifiedNewReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, token } = useAppSelector((state) => state.auth);
  const { currentReport, isLoading } = useAppSelector((state) => state.report);
  const dispatch = useAppDispatch();

  // Form State
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [showParametersAfter, setShowParametersAfter] = useState(false);
  
  // Parameters Before
  const [parametersBefore, setParametersBefore] = useState<Parameters>({
    cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
  });
  
  // Parameters After (initially hidden)
  const [parametersAfter, setParametersAfter] = useState<Parameters>({
    cl: 0, ph: 0, alk: 0, stabilizer: 0, hardness: 0, salt: 0, temperature: 0
  });

  // Chemicals
  const [chemicals, setChemicals] = useState<Chemicals>({
    tricloro: 0, tabletas: 0, acido: 0, soda: 0, bicarbonato: 0,
    sal: 0, alguicida: 0, clarificador: 0, cloro_liquido: 0
  });

  // Equipment
  const [equipmentCheck, setEquipmentCheck] = useState<EquipmentCheck>({
    bomba_filtro: false, bomba_reposadero: false, bomba_espejo: false,
    bomba_jets: false, blower: false, luces_piscina: false, luces_spa: false,
    luces_espejo: false, filtro_piscina: false, filtro_spa: false,
    filtro_espejo: false, clorinador_piscina: false, clorinador_spa: false,
    clorinador_espejo: false
  });

  // Materials and Observations
  const [materialsDelivered, setMaterialsDelivered] = useState('');
  const [observations, setObservations] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  // Check if all parameters before are filled
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

              // El número de reporte se generará en el servidor de forma consecutiva
              // Usar ID temporal para las imágenes
              const tempId = `temp_${Date.now()}`;

              // Subir imágenes a S3 antes de crear el reporte
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
                // reportNumber se generará automáticamente en el servidor
                clientName: clientName.trim(),
                location: location.trim(),
                technician: user?.name || 'Técnico',
                entryTime: new Date().toISOString(),
                exitTime: new Date().toISOString(),
                userId: user?.id || 'unknown',
                beforePhoto: beforePhotoUrl, // URL de S3
                afterPhoto: afterPhotoUrl,   // URL de S3
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
              
              // Incrementar estadísticas inmediatamente
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Basic Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Información Básica</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cliente *</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Nombre del cliente"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ubicación *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Dirección o ubicación"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Técnico</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.name || 'Técnico'}
              editable={false}
              placeholderTextColor="#999"
            />
            <Text style={styles.helperText}>Este campo se completa automáticamente</Text>
          </View>
        </View>

        {/* Photo Before Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Foto Antes del Mantenimiento *</Text>
          </View>
          
          <View style={styles.photoSection}>
            {beforePhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: beforePhoto }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setBeforePhoto(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#ccc" />
                <Text style={styles.photoPlaceholderText}>Agregar foto antes</Text>
              </View>
            )}
            
            <View style={styles.photoButtons}>
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => handleCameraCapture('before')}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.photoButtonText}>Cámara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.photoButton, styles.photoButtonSecondary]}
                onPress={() => handleImagePicker('before')}
              >
                <Ionicons name="images" size={20} color="#1976D2" />
                <Text style={[styles.photoButtonText, styles.photoButtonTextSecondary]}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Parameters Before Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Parámetros Antes del Mantenimiento</Text>
          </View>
          
          <View style={styles.parametersGrid}>
            {parameterConfigs.map((param) => (
              <View key={param.key} style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>
                  <Ionicons name={param.icon as any} size={16} color="#666" /> {param.label}
                </Text>
                <TextInput
                  style={styles.parameterInput}
                  value={parametersBefore[param.key as keyof Parameters].toString()}
                  onChangeText={(value) => handleParameterChange('before', param.key as keyof Parameters, value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Parameters After Section - Shows when before parameters are complete */}
        {showParametersAfter && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Parámetros Después del Mantenimiento</Text>
            </View>
            
            <View style={styles.parametersGrid}>
              {parameterConfigs.map((param) => (
                <View key={param.key} style={styles.parameterItem}>
                  <Text style={styles.parameterLabel}>
                    <Ionicons name={param.icon as any} size={16} color="#666" /> {param.label}
                  </Text>
                  <TextInput
                    style={styles.parameterInput}
                    value={parametersAfter[param.key as keyof Parameters].toString()}
                    onChangeText={(value) => handleParameterChange('after', param.key as keyof Parameters, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#999"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Chemicals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Químicos Utilizados</Text>
          </View>
          
          <View style={styles.chemicalsGrid}>
            {chemicalConfigs.map((chemical) => (
              <View key={chemical.key} style={styles.chemicalItem}>
                <Text style={styles.chemicalLabel}>
                  {chemical.label} ({chemical.unit})
                </Text>
                <TextInput
                  style={styles.chemicalInput}
                  value={(chemicals[chemical.key as keyof Chemicals] || 0).toString()}
                  onChangeText={(value) => handleChemicalChange(chemical.key as keyof Chemicals, value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Equipment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Revisión de Equipos</Text>
          </View>
          
          {equipmentSections.map((section) => (
            <View key={section.title} style={styles.equipmentSection}>
              <Text style={styles.equipmentSectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.equipmentItem,
                    equipmentCheck[item.key as keyof EquipmentCheck] && styles.equipmentItemActive
                  ]}
                  onPress={() => handleEquipmentToggle(item.key as keyof EquipmentCheck)}
                >
                  <Text style={[
                    styles.equipmentItemText,
                    equipmentCheck[item.key as keyof EquipmentCheck] && styles.equipmentItemTextActive
                  ]}>
                    {item.label}
                  </Text>
                  <Ionicons 
                    name={equipmentCheck[item.key as keyof EquipmentCheck] ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={equipmentCheck[item.key as keyof EquipmentCheck] ? "#4CAF50" : "#ccc"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Materials and Observations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="clipboard-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Materiales y Observaciones</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Materiales Entregados</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={materialsDelivered}
              onChangeText={setMaterialsDelivered}
              placeholder="Lista de materiales entregados..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observations}
              onChangeText={setObservations}
              placeholder="Observaciones del mantenimiento..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recibido por</Text>
            <TextInput
              style={styles.input}
              value={receivedBy}
              onChangeText={setReceivedBy}
              placeholder="Nombre de quien recibe"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Photo After Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera-outline" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>Foto Después del Mantenimiento *</Text>
          </View>
          
          <View style={styles.photoSection}>
            {afterPhoto ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: afterPhoto }} style={styles.photo} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => setAfterPhoto(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#ccc" />
                <Text style={styles.photoPlaceholderText}>Agregar foto después</Text>
              </View>
            )}
            
            <View style={styles.photoButtons}>
              <TouchableOpacity 
                style={styles.photoButton}
                onPress={() => handleCameraCapture('after')}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.photoButtonText}>Cámara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.photoButton, styles.photoButtonSecondary]}
                onPress={() => handleImagePicker('after')}
              >
                <Ionicons name="images" size={20} color="#1976D2" />
                <Text style={[styles.photoButtonText, styles.photoButtonTextSecondary]}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Enviando...' : 'Enviar Reporte'}
          </Text>
          {!isLoading && <Ionicons name="send" size={20} color="white" style={styles.submitIcon} />}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    height: 100,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  photoPlaceholderText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  photoButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  photoButtonTextSecondary: {
    color: '#1976D2',
  },
  parametersGrid: {
    gap: 16,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  parameterLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  chemicalsGrid: {
    gap: 16,
  },
  chemicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  chemicalLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chemicalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  equipmentSection: {
    marginBottom: 20,
  },
  equipmentSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  equipmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  equipmentItemActive: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  equipmentItemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  equipmentItemTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 8,
  },
});