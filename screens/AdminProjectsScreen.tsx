import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';

interface Project {
  id: number;
  project_name: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  pool_gallons?: number;
  location: string;
  status: 'active' | 'inactive' | 'completed';
  notes?: string;
  created_at: string;
}

export default function AdminProjectsScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    pool_gallons: '',
    location: '',
    status: 'active' as 'active' | 'inactive' | 'completed',
    notes: '',
  });

  const loadProjects = async () => {
    try {
      const response = await ApiService.getAllProjects(token!);
      
      // Verificar si la respuesta es un array directamente
      const projectsArray = Array.isArray(response) ? response : [];
      setProjects(projectsArray);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los proyectos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!formData.project_name || !formData.client_name || !formData.location) {
      Alert.alert('Error', 'Nombre del proyecto, cliente y ubicación son obligatorios');
      return;
    }

    try {
      const submitData: any = {
        projectName: formData.project_name,
        clientName: formData.client_name,
        location: formData.location,
        status: formData.status,
      };
      
      // Agregar campos opcionales solo si tienen valor
      if (formData.client_email) submitData.clientEmail = formData.client_email;
      if (formData.client_phone) submitData.clientPhone = formData.client_phone;
      if (formData.pool_gallons) submitData.poolGallons = parseInt(formData.pool_gallons);
      if (formData.notes) submitData.notes = formData.notes;

      await ApiService.post('/projects', submitData, token!);
      Alert.alert('Éxito', 'Proyecto creado correctamente');
      setModalVisible(false);
      resetForm();
      loadProjects();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el proyecto');
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    
    if (!formData.project_name || !formData.client_name || !formData.location) {
      Alert.alert('Error', 'Nombre del proyecto, cliente y ubicación son obligatorios');
      return;
    }

    try {
      const submitData: any = {
        projectName: formData.project_name,
        clientName: formData.client_name,
        location: formData.location,
        status: formData.status,
      };
      
      // Agregar campos opcionales
      if (formData.client_email) submitData.clientEmail = formData.client_email;
      if (formData.client_phone) submitData.clientPhone = formData.client_phone;
      if (formData.pool_gallons) submitData.poolGallons = parseInt(formData.pool_gallons);
      if (formData.notes) submitData.notes = formData.notes;

      await ApiService.put(`/projects/${selectedProject.id}`, submitData, token!);
      Alert.alert('Éxito', 'Proyecto actualizado correctamente');
      setModalVisible(false);
      resetForm();
      loadProjects();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el proyecto');
    }
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Estás seguro de ELIMINAR el proyecto "${project.project_name}"?\n\n❌ Esta acción NO SE PUEDE DESHACER\n\n⚠️ Se eliminarán:\n• El proyecto\n• TODOS los reportes asociados a este proyecto\n\n¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.delete(`/projects/${project.id}`, token!);
              Alert.alert('Éxito', 'Proyecto eliminado correctamente');
              loadProjects();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el proyecto');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    resetForm();
    setEditMode(false);
    setSelectedProject(null);
    setModalVisible(true);
  };

  const openEditModal = (project: Project) => {
    setFormData({
      project_name: project.project_name,
      client_name: project.client_name,
      client_email: project.client_email || '',
      client_phone: project.client_phone || '',
      pool_gallons: project.pool_gallons ? project.pool_gallons.toString() : '',
      location: project.location,
      status: project.status,
      notes: project.notes || '',
    });
    setEditMode(true);
    setSelectedProject(project);
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      project_name: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      pool_gallons: '',
      location: '',
      status: 'active',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#DBEAFE', text: '#0284C7' };
      case 'inactive':
        return { bg: '#F1F5F9', text: '#64748B' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#059669' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proyectos</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No hay proyectos registrados</Text>
            </View>
          ) : (
            projects.map((project) => {
              const statusColors = getStatusColor(project.status);
              return (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectInfo}>
                    <View style={styles.projectIcon}>
                      <Ionicons name="business" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.projectDetails}>
                      <Text style={styles.projectName}>{project.project_name}</Text>
                      <Text style={styles.projectClient}>{project.client_name}</Text>
                      <View style={styles.projectMeta}>
                        <Ionicons name="location" size={14} color="#64748B" />
                        <Text style={styles.metaText}>{project.location}</Text>
                      </View>
                      <View
                        style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
                      >
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {getStatusLabel(project.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(project)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="pencil" size={20} color="#0284C7" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProject(project)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre del Proyecto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Piscina Residencial Norte"
                value={formData.project_name}
                onChangeText={(text) => setFormData({ ...formData, project_name: text })}
              />

              <Text style={styles.inputLabel}>Cliente *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del cliente"
                value={formData.client_name}
                onChangeText={(text) => setFormData({ ...formData, client_name: text })}
              />

              <Text style={styles.inputLabel}>Email del Cliente (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="cliente@ejemplo.com"
                value={formData.client_email}
                onChangeText={(text) => setFormData({ ...formData, client_email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Teléfono del Cliente (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+506 8888-8888"
                value={formData.client_phone}
                onChangeText={(text) => setFormData({ ...formData, client_phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Galonaje de Piscina (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10000"
                value={formData.pool_gallons}
                onChangeText={(text) => setFormData({ ...formData, pool_gallons: text })}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Ubicación *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del cliente"
                value={formData.client_name}
                onChangeText={(text) => setFormData({ ...formData, client_name: text })}
              />

              <Text style={styles.inputLabel}>Ubicación *</Text>
              <TextInput
                style={styles.input}
                placeholder="Dirección o ubicación"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />

              <Text style={styles.inputLabel}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Información adicional sobre el proyecto..."
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Estado</Text>
              <View style={styles.statusSelector}>
                {(['active', 'inactive', 'completed'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.status === status && styles.statusOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        formData.status === status && styles.statusOptionTextActive,
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={editMode ? handleUpdateProject : handleCreateProject}
              >
                <Text style={styles.saveButtonText}>
                  {editMode ? 'Guardar' : 'Crear'}
                </Text>
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
  addButton: {
    backgroundColor: '#F59E0B',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projectInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectDetails: {
    flex: 1,
    gap: 4,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  projectClient: {
    fontSize: 14,
    color: '#64748B',
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusOptionActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusOptionTextActive: {
    color: '#F59E0B',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
