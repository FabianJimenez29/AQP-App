import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../store/hooks';
import ApiService from '../services/api';

type NavigationProp = StackNavigationProp<any>;

type ProjectPool = {
  id: number;
  name: string;
  type: 'pool' | 'spa' | 'fountain';
};

export default function BreakdownReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { token, user } = useAppSelector((state) => state.auth);

  const [projects, setProjects] = useState<any[]>([]);
  const [projectPools, setProjectPools] = useState<ProjectPool[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedPool, setSelectedPool] = useState<ProjectPool | null>(null);
  const [description, setDescription] = useState('');
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPools, setLoadingPools] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showPoolPicker, setShowPoolPicker] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      if (!token) return;
      try {
        setLoadingProjects(true);
        const data = await ApiService.getAllProjects(token);
        setProjects(data.filter((item: any) => item.status === 'active'));
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los proyectos.');
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [token]);

  const loadPools = async (projectId: string) => {
    if (!token) return;
    try {
      setLoadingPools(true);
      const pools = await ApiService.getProjectPools(projectId, token);
      setProjectPools(pools || []);
      if (pools && pools.length > 0) {
        setSelectedPool(pools[0]);
      } else {
        setSelectedPool(null);
        Alert.alert('Sin areas', 'Este proyecto no tiene piscina, spa o espejo configurado.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las areas del proyecto.');
    } finally {
      setLoadingPools(false);
    }
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitas habilitar la camara para tomar fotos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Configuracion',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              }
            },
          },
        ]
      );
      return false;
    }

    return true;
  };

  const pickFromGallery = async (slot: 1 | 2) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      if (slot === 1) setPhoto1(result.assets[0].uri);
      if (slot === 2) setPhoto2(result.assets[0].uri);
    }
  };

  const takePhoto = async (slot: 1 | 2) => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      if (slot === 1) setPhoto1(result.assets[0].uri);
      if (slot === 2) setPhoto2(result.assets[0].uri);
    }
  };

  const openPhotoOptions = (slot: 1 | 2) => {
    Alert.alert('Foto de averia', 'Selecciona una opcion', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Camara', onPress: () => takePhoto(slot) },
      { text: 'Galeria', onPress: () => pickFromGallery(slot) },
    ]);
  };

  const handleContinue = () => {
    if (!selectedProject) {
      Alert.alert('Falta proyecto', 'Selecciona el proyecto.');
      return;
    }

    if (!selectedPool) {
      Alert.alert('Falta area', 'Selecciona piscina, spa o espejo de agua.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Falta descripcion', 'Describe que esta malo.');
      return;
    }

    if (!photo1 || !photo2) {
      Alert.alert('Faltan fotos', 'Debes adjuntar dos fotos de la averia.');
      return;
    }

    navigation.navigate('BreakdownPreview', {
      reportData: {
        projectId: selectedProject.id,
        projectName: selectedProject.project_name,
        projectPoolId: selectedPool.id,
        poolName: selectedPool.name,
        poolType: selectedPool.type,
        description: description.trim(),
        technicianName: user?.name || 'Tecnico',
        createdAt: new Date().toISOString(),
        photo1Local: photo1,
        photo2Local: photo2,
        clientPhone:
          selectedProject.project_client_phone ||
          selectedProject.client_phone ||
          selectedProject.phone ||
          null,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reporte de Averia</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proyecto</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowProjectPicker(true)}>
            <Text style={styles.selectorText}>
              {selectedProject ? selectedProject.project_name : 'Seleccionar proyecto'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#374151" />
          </TouchableOpacity>

          {loadingPools ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={styles.inlineLoadingText}>Cargando areas...</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.cardTitle, { marginTop: 14 }]}>Piscina / Spa / Espejo</Text>
              <TouchableOpacity
                style={[styles.selector, !selectedProject && styles.selectorDisabled]}
                disabled={!selectedProject}
                onPress={() => setShowPoolPicker(true)}
              >
                <Text style={styles.selectorText}>
                  {selectedPool
                    ? `${selectedPool.name} (${selectedPool.type === 'pool' ? 'Piscina' : selectedPool.type === 'spa' ? 'Spa' : 'Espejo de agua'})`
                    : 'Seleccionar area'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#374151" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descripcion de la averia</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe que esta malo o que problema encontraste..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Tecnico:</Text>
            <Text style={styles.metaValue}>{user?.name || 'Tecnico'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Fecha y hora:</Text>
            <Text style={styles.metaValue}>{new Date().toLocaleString('es-CR')}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fotos de averia (2)</Text>

          <TouchableOpacity style={styles.photoButton} onPress={() => openPhotoOptions(1)}>
            <Ionicons name="camera" size={18} color="#0ea5e9" />
            <Text style={styles.photoButtonText}>Foto 1</Text>
          </TouchableOpacity>
          {photo1 && <Image source={{ uri: photo1 }} style={styles.photoPreview} />}

          <TouchableOpacity style={[styles.photoButton, { marginTop: 12 }]} onPress={() => openPhotoOptions(2)}>
            <Ionicons name="camera" size={18} color="#0ea5e9" />
            <Text style={styles.photoButtonText}>Foto 2</Text>
          </TouchableOpacity>
          {photo2 && <Image source={{ uri: photo2 }} style={styles.photoPreview} />}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Ionicons name="eye" size={18} color="white" />
          <Text style={styles.primaryButtonText}>Vista previa antes de enviar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showProjectPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona proyecto</Text>
            {loadingProjects ? (
              <ActivityIndicator size="small" color="#0ea5e9" />
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedProject(project);
                      setSelectedPool(null);
                      setShowProjectPicker(false);
                      loadPools(project.id);
                    }}
                  >
                    <Text style={styles.modalItemText}>{project.project_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowProjectPicker(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPoolPicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecciona area</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {projectPools.map((pool) => (
                <TouchableOpacity
                  key={pool.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedPool(pool);
                    setShowPoolPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {pool.name} ({pool.type === 'pool' ? 'Piscina' : pool.type === 'spa' ? 'Spa' : 'Espejo de agua'})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowPoolPicker(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerPlaceholder: { width: 34, height: 34 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  selector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  selectorDisabled: { backgroundColor: '#f3f4f6' },
  selectorText: { color: '#111827', fontSize: 14, flex: 1, marginRight: 10 },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 10,
    color: '#111827',
    backgroundColor: 'white',
  },
  metaRow: { flexDirection: 'row', marginTop: 8 },
  metaLabel: { color: '#6b7280', width: 92, fontSize: 13 },
  metaValue: { color: '#111827', fontWeight: '600', fontSize: 13, flex: 1 },
  photoButton: {
    borderWidth: 1,
    borderColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f0f9ff',
  },
  photoButtonText: { color: '#0369a1', fontWeight: '700' },
  photoPreview: {
    marginTop: 10,
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    padding: 16,
    paddingBottom: 26,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  modalItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  modalItemText: { color: '#111827', fontSize: 14 },
  modalClose: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  modalCloseText: { color: 'white', fontWeight: '700' },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  inlineLoadingText: { color: '#6b7280', fontSize: 13 },
});
