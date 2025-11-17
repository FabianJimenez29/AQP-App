import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout, updateUserProfile } from '../store/authSlice';
import ApiService from '../services/api';
import updateService from '../services/updateService';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import PoolHeader from '../components/ui/PoolHeader';

type NavigationProp = StackNavigationProp<any>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [appVersion, setAppVersion] = useState('Cargando...');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    loadAppVersion();
  }, [user]);

  const loadAppVersion = async () => {
    try {
      const versionData = await ApiService.getAppVersion();
      if (versionData.success) {
        setAppVersion(versionData.version);
      }
    } catch (error) {
      console.error('Error loading version:', error);
      setAppVersion('1.0.0'); 
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No se encontró el token de autenticación');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiService.put('/auth/profile', { name, email }, token);
      
      dispatch(updateUserProfile({ name, email }));
      
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleContactSupport = (method: 'phone' | 'email') => {
    if (method === 'phone') {
      Linking.openURL('tel:+50687510545');
    } else {
      Linking.openURL('mailto:fabianj.dev@gmail.com?subject=Soporte AquaPool App');
    }
  };

  const handleCheckUpdates = () => {
    updateService.checkForUpdates(true);
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/50687510545?text=Hola, necesito ayuda con AquaPool App');
  };

  return (
    <View style={styles.container}>
      <PoolHeader 
        title="Mi Perfil" 
        showBack={true} 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color={Colors.primary.blue} />
            </View>
            <Text style={styles.roleBadge}>{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                  <Ionicons name="pencil" size={18} color={Colors.primary.blue} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Tu nombre"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={email}
                onChangeText={setEmail}
                editable={isEditing}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {isEditing && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.neutral.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayuda y Soporte</Text>
          
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleContactSupport('phone')}
          >
            <View style={[styles.optionIcon, { backgroundColor: Colors.primary.green + '20' }]}>
              <Ionicons name="call" size={24} color={Colors.primary.green} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Llamar a Soporte</Text>
              <Text style={styles.optionSubtitle}>+506 8751 0545</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={handleWhatsApp}
          >
            <View style={[styles.optionIcon, { backgroundColor: '#25D366' + '20' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>WhatsApp</Text>
              <Text style={styles.optionSubtitle}>Chatea con nosotros</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral.gray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleContactSupport('email')}
          >
            <View style={[styles.optionIcon, { backgroundColor: Colors.primary.orange + '20' }]}>
              <Ionicons name="mail" size={24} color={Colors.primary.orange} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Email de Soporte</Text>
              <Text style={styles.optionSubtitle}>fabianj.dev@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de la App</Text>
          
          <View style={styles.aboutCard}>
            <View style={styles.appIconContainer}>
              <Ionicons name="water" size={40} color={Colors.primary.blue} />
            </View>
            <Text style={styles.appName}>AquaPool</Text>
            <Text style={styles.appVersion}>Versión {appVersion}</Text>
            <Text style={styles.appDescription}>
              Sistema de gestión de mantenimiento de piscinas. Simplifica el registro, 
              seguimiento y reporte de servicios de mantenimiento.
            </Text>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Ionicons name="code-slash" size={16} color={Colors.neutral.gray} />
              <Text style={styles.infoText}>Desarrollado con React Native</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.neutral.gray} />
              <Text style={styles.infoText}>© 2025 AquaPool. Todos los derechos reservados.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.updateButton} onPress={handleCheckUpdates}>
            <Ionicons name="refresh-outline" size={24} color="#0066CC" />
            <Text style={styles.updateButtonText}>Buscar Actualizaciones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#f44336" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 0,
    marginTop: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary.blue + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.darkGray,
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    color: Colors.primary.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.neutral.darkGray,
    backgroundColor: Colors.neutral.white,
  },
  inputDisabled: {
    backgroundColor: Colors.neutral.lightGray,
    color: Colors.neutral.gray,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.neutral.lightGray,
  },
  cancelButtonText: {
    color: Colors.neutral.darkGray,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary.blue,
  },
  saveButtonText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Colors.neutral.gray,
  },
  aboutCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary.blue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.darkGray,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.neutral.gray,
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.neutral.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.neutral.lightGray,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.neutral.gray,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#0066CC20',
    marginBottom: 12,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f4433620',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
});
