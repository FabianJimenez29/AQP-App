import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { fetchUserStats, fetchUserReports } from '../store/statsActions';
import { incrementTodayReports } from '../store/statsSlice';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const { userStats, reportHistory, isLoading, lastUpdate } = useAppSelector((state) => state.stats);
  const dispatch = useAppDispatch();

  // Auto-actualizar estadísticas al cargar y cada 5 minutos
  useEffect(() => {
    const loadStats = () => {
      dispatch(fetchUserStats());
      dispatch(fetchUserReports({ page: 1, limit: 3 })); // Solo los últimos 3 para el dashboard
    };

    // Cargar inmediatamente
    loadStats();

    // Configurar actualización automática cada 5 minutos
    const interval = setInterval(loadStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchUserStats());
    dispatch(fetchUserReports({ page: 1, limit: 3 }));
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
            router.replace('login' as any);
          }
        },
      ]
    );
  };

  const handleNewReport = () => {
    router.push('unified-new-report' as any);
  };

  const handleViewReports = () => {
    // TODO: Implementar vista de reportes con historial
    router.push('report-history' as any);
  };

  const handleAnalytics = () => {
    // TODO: Implementar analytics
    Alert.alert('Próximamente', 'Analytics en desarrollo');
  };

  const quickActions = [
    {
      icon: 'add-circle-outline',
      title: 'Nuevo Reporte',
      subtitle: 'Crear reporte de mantenimiento',
      color: '#4CAF50',
      onPress: handleNewReport,
    },
    {
      icon: 'document-text-outline',
      title: 'Ver Reportes',
      subtitle: 'Historial de reportes',
      color: '#2196F3',
      onPress: handleViewReports,
    },
    {
      icon: 'analytics-outline',
      title: 'Estadísticas',
      subtitle: 'Análisis y métricas',
      color: '#FF9800',
      onPress: handleAnalytics,
    },
  ];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3"
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <View style={styles.userText}>
              <Text style={styles.welcomeText}>Bienvenido</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : 'Técnico'}</Text>
              {lastUpdate && (
                <Text style={styles.lastUpdateText}>
                  Actualizado: {new Date(lastUpdate).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Resumen de Actividad</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="assignment" size={24} color="#2196F3" />
            </View>
            <Text style={styles.statNumber}>{userStats?.totalReports || 0}</Text>
            <Text style={styles.statLabel}>Total Reportes</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="today-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.statNumber}>{userStats?.todayReports || 0}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="calendar-outline" size={24} color="#FF9800" />
            </View>
            <Text style={styles.statNumber}>{userStats?.weekReports || 0}</Text>
            <Text style={styles.statLabel}>Esta Semana</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Reports Section */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reportes Recientes</Text>
          <TouchableOpacity onPress={handleViewReports}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        
        {reportHistory && reportHistory.reports.length > 0 ? (
          reportHistory.reports.map((report: any, index: number) => (
            <View key={index} style={styles.reportCard}>
              <View style={styles.reportIcon}>
                <FontAwesome5 name="clipboard-check" size={20} color="#2196F3" />
              </View>
              <View style={styles.reportContent}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportNumber}>Reporte #{report.id}</Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.created_at).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <Text style={styles.reportClient}>{report.status || 'Completado'}</Text>
                <Text style={styles.reportLocation}>
                  <Ionicons name="location-outline" size={12} color="#666" /> {report.location || 'Ubicación no especificada'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="assignment" size={48} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No hay reportes</Text>
            <Text style={styles.emptySubtitle}>Crea tu primer reporte de mantenimiento</Text>
            <TouchableOpacity style={styles.emptyAction} onPress={handleNewReport}>
              <Text style={styles.emptyActionText}>Crear Reporte</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Header Styles
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userText: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '400',
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  userRole: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  lastUpdateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 4,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats Section
  statsSection: {
    padding: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Recent Reports Section
  recentSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportContent: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  reportClient: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  reportLocation: {
    fontSize: 13,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});