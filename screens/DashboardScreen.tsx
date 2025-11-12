import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { fetchUserStats, fetchUserReports } from '../store/statsActions';
import { incrementTodayReports } from '../store/statsSlice';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<any>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAppSelector((state) => state.auth);
  const { userStats, reportHistory, isLoading, lastUpdate } = useAppSelector((state) => state.stats);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadStats = () => {
      dispatch(fetchUserStats());
      dispatch(fetchUserReports({ page: 1, limit: 5 }));
    };

    loadStats();
    const interval = setInterval(loadStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchUserStats());
    dispatch(fetchUserReports({ page: 1, limit: 5 }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          onPress: () => {
            dispatch(logout());
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  const handleNewReport = () => {
    navigation.navigate('UnifiedNewReport');
  };

  const handleViewReports = () => {
    navigation.navigate('ReportHistory');
  };

  const handleProductOrder = () => {
    navigation.navigate('Products');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  return (
    <View style={styles.container}>
      {/* Header Moderno */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 50) }]}>
        <View style={styles.headerTop}>
          <View style={styles.logoSection}>
            <Image 
              source={require('../assets/images/AQPLogoBlack.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#1a1a1a" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getCurrentGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={['#0066CC']}
            tintColor="#0066CC"
          />
        }
      >
        {/* Stats Cards Modernos */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statCardHeader}>
                <View style={styles.statIconContainer}>
                  <MaterialIcons name="description" size={24} color="#0066CC" />
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                </TouchableOpacity>
              </View>
              <Text style={styles.statNumber}>{userStats?.totalReports || 0}</Text>
              <Text style={styles.statLabel}>Total de Reportes</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={14} color="#4caf50" />
                <Text style={styles.statTrendText}>+12% este mes</Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.statCardSuccess]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconSuccess]}>
                  <Ionicons name="calendar-outline" size={24} color="#4caf50" />
                </View>
              </View>
              <Text style={styles.statNumber}>{userStats?.todayReports || 0}</Text>
              <Text style={styles.statLabel}>Reportes Hoy</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardWarning]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconWarning]}>
                  <MaterialCommunityIcons name="calendar-week" size={24} color="#FF9800" />
                </View>
              </View>
              <Text style={styles.statNumber}>{userStats?.weekReports || 0}</Text>
              <Text style={styles.statLabel}>Esta Semana</Text>
            </View>

            <View style={[styles.statCard, styles.statCardInfo]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconInfo]}>
                  <Ionicons name="time-outline" size={24} color="#2196F3" />
                </View>
              </View>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas con nuevo diseño */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleNewReport}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="add-circle" size={32} color="#0066CC" />
              </View>
              <Text style={styles.actionTitle}>Nuevo</Text>
              <Text style={styles.actionSubtitle}>Reporte</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={handleViewReports}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="document-text" size={32} color="#4caf50" />
              </View>
              <Text style={styles.actionTitle}>Ver</Text>
              <Text style={styles.actionSubtitle}>Historial</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonWarning]}
              onPress={handleProductOrder}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="storefront" size={32} color="#FF9800" />
              </View>
              <Text style={styles.actionTitle}>Pedidos</Text>
              <Text style={styles.actionSubtitle}>Productos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="log-out" size={32} color="#f44336" />
              </View>
              <Text style={styles.actionTitle}>Cerrar</Text>
              <Text style={styles.actionSubtitle}>Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actividad Reciente */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity onPress={handleViewReports}>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {reportHistory && reportHistory.reports.length > 0 ? (
            reportHistory.reports.slice(0, 5).map((report: any, index: number) => (
              <TouchableOpacity 
                key={index} 
                style={styles.activityCard}
                activeOpacity={0.7}
              >
                <View style={styles.activityIconContainer}>
                  <MaterialIcons name="description" size={20} color="#0066CC" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Reporte {report.report_number}</Text>
                  <Text style={styles.activitySubtitle}>
                    {report.location || 'Sin ubicación'} • {new Date(report.created_at).toLocaleDateString('es-ES', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </Text>
                </View>
                <View style={styles.activityStatusBadge}>
                  <Text style={styles.activityStatusText}>Completado</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="inbox" size={64} color="#e0e0e0" />
              </View>
              <Text style={styles.emptyTitle}>No hay reportes recientes</Text>
              <Text style={styles.emptySubtitle}>Crea tu primer reporte de mantenimiento</Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={handleNewReport}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.emptyButtonText}>Crear Reporte</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSection: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#f44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  greetingSection: {
    marginTop: 4,
  },
  greetingText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  // Stats Section
  statsSection: {
    padding: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconSuccess: {
    backgroundColor: '#f1f8f4',
  },
  statIconWarning: {
    backgroundColor: '#fff8f0',
  },
  statIconInfo: {
    backgroundColor: '#f0f5ff',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  
  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButtonPrimary: {
    borderTopWidth: 3,
    borderTopColor: '#0066CC',
  },
  actionButtonSuccess: {
    borderTopWidth: 3,
    borderTopColor: '#4caf50',
  },
  actionButtonWarning: {
    borderTopWidth: 3,
    borderTopColor: '#FF9800',
  },
  actionButtonDanger: {
    borderTopWidth: 3,
    borderTopColor: '#f44336',
  },
  actionIconWrapper: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  
  // Activity Section
  activitySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
  },
  activityStatusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 11,
    color: '#4caf50',
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});