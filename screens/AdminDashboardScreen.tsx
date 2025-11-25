import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { RootState } from '../store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/colors';
import { showConfirm } from '../components/ui/CustomAlert';

type NavigationProp = StackNavigationProp<any>;

interface AdminMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  iconLibrary: 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons';
  color: string;
  bgColor: string;
  screen: string;
}

const adminMenuItems: AdminMenuItem[] = [
  {
    id: '1',
    title: 'Usuarios',
    subtitle: 'Gestionar usuarios',
    icon: 'people',
    iconLibrary: 'Ionicons',
    color: '#0066CC',
    bgColor: '#E3F2FF',
    screen: 'AdminUsers',
  },
  {
    id: '2',
    title: 'Reportes',
    subtitle: 'Ver reportes',
    icon: 'description',
    iconLibrary: 'MaterialIcons',
    color: '#4caf50',
    bgColor: '#E8F5E9',
    screen: 'AdminReports',
  },
  {
    id: '3',
    title: 'Inventario',
    subtitle: 'Productos y stock',
    icon: 'cube',
    iconLibrary: 'Ionicons',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    screen: 'AdminInventory',
  },
  {
    id: '4',
    title: 'Proyectos',
    subtitle: 'Gestionar proyectos',
    icon: 'business',
    iconLibrary: 'Ionicons',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    screen: 'AdminProjects',
  },
  {
    id: '5',
    title: 'Órdenes',
    subtitle: 'Pedidos de productos',
    icon: 'cart',
    iconLibrary: 'Ionicons',
    color: '#E91E63',
    bgColor: '#FCE4EC',
    screen: 'AdminOrders',
  },
  {
    id: '6',
    title: 'Reporte Mensual',
    subtitle: 'Generar reportes',
    icon: 'calendar-month',
    iconLibrary: 'MaterialCommunityIcons',
    color: '#f44336',
    bgColor: '#FFEBEE',
    screen: 'AdminMonthlyReport',
  },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    showConfirm(
      '¿Estás seguro que deseas cerrar sesión?',
      () => {
        dispatch(logout());
        navigation.replace('Login');
      }
    );
  };

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen);
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  const renderIcon = (item: AdminMenuItem) => {
    const iconProps = {
      name: item.icon,
      size: 28,
      color: item.color,
    };

    switch (item.iconLibrary) {
      case 'Ionicons':
        return <Ionicons {...iconProps} />;
      case 'MaterialIcons':
        return <MaterialIcons {...iconProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...iconProps} />;
      default:
        return <Ionicons {...iconProps} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getCurrentGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'Administrador'}</Text>
          <View style={styles.roleBadge}>
            <MaterialIcons name="admin-panel-settings" size={16} color="#0066CC" />
            <Text style={styles.roleText}>Panel de Administración</Text>
          </View>
        </View>
      </View>

      {/* Menu Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066CC']}
            tintColor="#0066CC"
          />
        }
      >
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gestión del Sistema</Text>
          </View>

          <View style={styles.menuGrid}>
            {adminMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuCard}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  {renderIcon(item)}
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => navigation.navigate('AdminReports')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="document-text" size={32} color="#0066CC" />
              </View>
              <Text style={styles.actionTitle}>Ver</Text>
              <Text style={styles.actionSubtitle}>Reportes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => navigation.navigate('AdminUsers')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="person-add" size={32} color="#4caf50" />
              </View>
              <Text style={styles.actionTitle}>Nuevo</Text>
              <Text style={styles.actionSubtitle}>Usuario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonWarning]}
              onPress={() => navigation.navigate('AdminInventory')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Ionicons name="cube" size={32} color="#FF9800" />
              </View>
              <Text style={styles.actionTitle}>Ver</Text>
              <Text style={styles.actionSubtitle}>Inventario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => navigation.navigate('AdminMonthlyReport')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <MaterialCommunityIcons name="calendar-month" size={32} color="#f44336" />
              </View>
              <Text style={styles.actionTitle}>Reporte</Text>
              <Text style={styles.actionSubtitle}>Mensual</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
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
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    marginTop: 8,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FF',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066CC',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPrimary: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonSuccess: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonWarning: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonDanger: {
    backgroundColor: '#FFFFFF',
  },
  actionIconWrapper: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});
