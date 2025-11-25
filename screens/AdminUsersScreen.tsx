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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';
import Colors from '../constants/colors';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'technician';
  created_at: string;
}

export default function AdminUsersScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'technician'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician' as 'admin' | 'technician',
  });

  const loadUsers = async () => {
    try {
      const response = await ApiService.get<{ users: User[] }>('/users', token!);
      setUsers(response.users || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      await ApiService.post('/users', formData, token!);
      Alert.alert('Éxito', 'Usuario creado correctamente');
      setModalVisible(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el usuario');
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      await ApiService.put(`/users/${selectedUser.id}`, updateData, token!);
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      setModalVisible(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el usuario');
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar al usuario ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.delete(`/users/${user.id}`, token!);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    resetForm();
    setEditMode(false);
    setSelectedUser(null);
    setModalVisible(true);
  };

  const openEditModal = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setEditMode(true);
    setSelectedUser(user);
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'technician',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Estadísticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    technicians: users.filter(u => u.role === 'technician').length,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#0066CC']}
              tintColor="#0066CC"
            />
          }
        >
          {/* Estadísticas */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Usuarios</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#0066CC' }]}>
              <Text style={[styles.statValue, { color: '#0066CC' }]}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Administradores</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: '#4caf50' }]}>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>{stats.technicians}</Text>
              <Text style={styles.statLabel}>Técnicos</Text>
            </View>
          </View>

          {/* Filtros */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#999"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.roleFilterContainer}>
              <TouchableOpacity
                style={[styles.roleFilterButton, roleFilter === 'all' && styles.roleFilterActive]}
                onPress={() => setRoleFilter('all')}
              >
                <Text style={[styles.roleFilterText, roleFilter === 'all' && styles.roleFilterTextActive]}>
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleFilterButton, roleFilter === 'admin' && styles.roleFilterActive]}
                onPress={() => setRoleFilter('admin')}
              >
                <Text style={[styles.roleFilterText, roleFilter === 'admin' && styles.roleFilterTextActive]}>
                  Admins
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleFilterButton, roleFilter === 'technician' && styles.roleFilterActive]}
                onPress={() => setRoleFilter('technician')}
              >
                <Text style={[styles.roleFilterText, roleFilter === 'technician' && styles.roleFilterTextActive]}>
                  Técnicos
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchTerm || roleFilter !== 'all' ? 'No se encontraron usuarios' : 'No hay usuarios'}
              </Text>
              <Text style={styles.emptyText}>
                {searchTerm || roleFilter !== 'all' 
                  ? 'Intenta cambiar los filtros de búsqueda' 
                  : 'Comienza agregando el primer usuario'}
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Crear Usuario</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.usersList}>
              <Text style={styles.listHeader}>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'usuario' : 'usuarios'} 
                {searchTerm || roleFilter !== 'all' ? ' encontrados' : ' registrados'}
              </Text>
              {filteredUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userMeta}>
                        <View
                          style={[
                            styles.roleBadge,
                            user.role === 'admin' ? styles.adminBadge : styles.technicianBadge,
                          ]}
                        >
                          <MaterialIcons 
                            name={user.role === 'admin' ? 'admin-panel-settings' : 'engineering'} 
                            size={12} 
                            color={user.role === 'admin' ? '#0066CC' : '#4caf50'} 
                          />
                          <Text
                            style={[
                              styles.roleText,
                              user.role === 'admin' ? styles.adminText : styles.technicianText,
                            ]}
                          >
                            {user.role === 'admin' ? 'Administrador' : 'Técnico'}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(user.created_at)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(user)}
                      style={[styles.actionButton, styles.editButton]}
                    >
                      <Ionicons name="pencil" size={18} color="#0066CC" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteUser(user)}
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Ionicons name="trash" size={18} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
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
                {editMode ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>
                Contraseña {editMode && '(dejar vacío para mantener)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={editMode ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />

              <Text style={styles.inputLabel}>Rol</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'technician' && styles.roleOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'technician' })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      formData.role === 'technician' && styles.roleOptionTextActive,
                    ]}
                  >
                    Técnico
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'admin' && styles.roleOptionActive,
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'admin' })}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      formData.role === 'admin' && styles.roleOptionTextActive,
                    ]}
                  >
                    Administrador
                  </Text>
                </TouchableOpacity>
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
                onPress={editMode ? handleUpdateUser : handleCreateUser}
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
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#444444ff',
    fontWeight: '600',
  },
  filtersContainer: {
    gap: 12,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  roleFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  roleFilterActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  roleFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  roleFilterTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0066CC',
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usersList: {
    gap: 12,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#E3F2FF',
  },
  technicianBadge: {
    backgroundColor: '#E8F5E9',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminText: {
    color: '#0066CC',
  },
  technicianText: {
    color: '#4caf50',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#E3F2FF',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  roleOptionActive: {
    borderColor: '#0066CC',
    backgroundColor: '#E3F2FF',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleOptionTextActive: {
    color: '#0066CC',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F7FA',
    backgroundColor: '#FAFBFC',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
