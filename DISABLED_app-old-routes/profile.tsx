import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import { fetchUserStats } from '../store/statsActions';
import PoolHeader from '../components/ui/PoolHeader';
import BottomTabBar from '../components/ui/BottomTabBar';
import Colors from '../constants/colors';

type NavigationProp = StackNavigationProp<any>;

interface ProfileOption {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

export default function Profile() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { userStats } = useSelector((state: RootState) => state.stats);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUserStats() as any);
  }, [dispatch]);

  const handleBack = () => {
    navigation.goBack();
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
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    {
      id: 'edit-profile',
      title: 'Editar Perfil',
      icon: 'person-outline',
      onPress: () => Alert.alert('Próximamente', 'Función en desarrollo'),
      showArrow: true,
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications-outline',
      onPress: () => Alert.alert('Próximamente', 'Función en desarrollo'),
      showArrow: true,
    },
    {
      id: 'settings',
      title: 'Configuración',
      icon: 'settings-outline',
      onPress: () => Alert.alert('Próximamente', 'Función en desarrollo'),
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Ayuda y Soporte',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Próximamente', 'Función en desarrollo'),
      showArrow: true,
    },
    {
      id: 'about',
      title: 'Acerca de la App',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('AQUA POOL BLUE CR', 'Versión 1.0.0\nDesarrollada para el mantenimiento profesional de piscinas.'),
      showArrow: true,
    },
    {
      id: 'logout',
      title: 'Cerrar Sesión',
      icon: 'log-out-outline',
      onPress: handleLogout,
      color: Colors.status.error,
      showArrow: false,
    },
  ];

  return (
    <View style={styles.container}>
      <PoolHeader 
        title="Perfil" 
        showBack={true}
        onBack={handleBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.primary.blue} />
            </View>
            <View style={styles.statusIndicator} />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@ejemplo.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'admin' ? 'Administrador' : 'Técnico'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color={Colors.primary.blue} />
            <Text style={styles.statNumber}>{userStats?.totalReports || 0}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={Colors.primary.green} />
            <Text style={styles.statNumber}>{Math.floor((userStats?.totalReports || 0) * 2.5)}</Text>
            <Text style={styles.statLabel}>Horas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={Colors.primary.yellow} />
            <Text style={styles.statNumber}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.optionsContainer}>
          {profileOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: (option.color || Colors.primary.blue) + '20' }]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={22} 
                    color={option.color || Colors.primary.blue} 
                  />
                </View>
                <Text style={[styles.optionTitle, { color: option.color || Colors.neutral.darkGray }]}>
                  {option.title}
                </Text>
              </View>
              {option.showArrow && (
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={Colors.neutral.gray} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.lightGray,
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: Colors.neutral.white,
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.blue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.status.success,
    borderWidth: 3,
    borderColor: Colors.neutral.white,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.darkGray,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.neutral.gray,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral.white,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.neutral.darkGray,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.neutral.gray,
    marginTop: 4,
    fontWeight: '500',
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});