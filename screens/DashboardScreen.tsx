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

import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { fetchUserStats, fetchUserReports } from '../store/statsActions';
import { incrementTodayReports } from '../store/statsSlice';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import PoolHeader from '../components/ui/PoolHeader';
import BottomTabBar from '../components/ui/BottomTabBar';
import Colors from '../constants/colors';

type NavigationProp = StackNavigationProp<any>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
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

  const quickActions = [
    {
      icon: 'add-circle-outline',
      title: 'Nuevo Reporte',
      subtitle: 'Crear reporte de mantenimiento',
      color: Colors.primary.blue,
      onPress: handleNewReport,
    },
    {
      icon: 'document-text-outline',
      title: 'Ver Reportes',
      subtitle: 'Historial de reportes',
      color: Colors.primary.green,
      onPress: handleViewReports,
    },
    {
      icon: 'storefront-outline',
      title: 'Productos',
      subtitle: 'Pedidos y suministros',
      color: Colors.primary.orange,
      onPress: handleProductOrder,
    }
  ];

  return (
    <View style={styles.container}>
      <PoolHeader 
        title="Panel de Control" 
        subtitle={`Bienvenido, ${user?.name || 'Usuario'}`}
        showLogout={true} 
        onLogout={handleLogout}
      />
      
      <ScrollView 
        style={styles.container} 
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
        {/* Header Section eliminado - ahora usa PoolHeader */}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen de Actividad</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary.blue + '20' }]}>
                <MaterialIcons name="assignment" size={24} color={Colors.primary.blue} />
              </View>
              <Text style={styles.statNumber}>{userStats?.totalReports || 0}</Text>
              <Text style={styles.statLabel}>Total Reportes</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary.green + '20' }]}>
                <Ionicons name="today-outline" size={24} color={Colors.primary.green} />
              </View>
              <Text style={styles.statNumber}>{userStats?.todayReports || 0}</Text>
              <Text style={styles.statLabel}>Hoy</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary.orange + '20' }]}>
                <Ionicons name="calendar-outline" size={24} color={Colors.primary.orange} />
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
          </View>
          
          {reportHistory && reportHistory.reports.length > 0 ? (
            reportHistory.reports.map((report: any, index: number) => (
              <View key={index} style={styles.reportCard}>
                <View style={styles.reportIcon}>
                  <FontAwesome5 name="clipboard-check" size={20} color={Colors.primary.blue} />
                </View>
                <View style={styles.reportContent}>
                  <Text style={styles.reportNumber}>Reporte {report.report_number}</Text>
                  <Text style={styles.reportClient}>{report.status || 'Completado'}</Text>
                  <Text style={styles.reportLocation}>
                    <Ionicons name="location-outline" size={12} color="#666" /> {report.location || 'Ubicación no especificada'}
                  </Text>
                  <Text style={styles.reportDate}>
                    {new Date(report.created_at).toLocaleDateString('es-ES')}
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

        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomTabBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.lightGray,
  },
  // Stats Section
  statsSection: {
    padding: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
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
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    color: Colors.neutral.darkGray,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.neutral.gray,
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
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 10,
    color: Colors.neutral.gray,
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
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.blue + '20',
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
    color: Colors.primary.blue,
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 11,
    color: Colors.neutral.gray,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  reportClient: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 2,
  },
  reportLocation: {
    fontSize: 13,
    color: Colors.neutral.gray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Empty State
  emptyState: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyAction: {
    backgroundColor: Colors.primary.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
});