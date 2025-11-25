import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { showError, showSuccess, ErrorMessages, SuccessMessages } from '../components/ui/CustomAlert';

interface Order {
  id: number;
  user: {
    name: string;
  };
  items: Array<{
    product_name: string;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export default function AdminOrdersScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const response = await ApiService.getOrders(token!, 1, 50);
      setOrders(response.orders || []);
    } catch (error: any) {
      showError(ErrorMessages.LOAD_FAILED);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await ApiService.patch(`/orders/${orderId}`, { status: newStatus }, token!);
      showSuccess(SuccessMessages.ORDER_UPDATED);
      loadOrders();
    } catch (error: any) {
      showError(ErrorMessages.SAVE_FAILED);
    }
  };

  const showStatusMenu = (order: Order) => {
    Alert.alert(
      'Actualizar Estado',
      `Orden #${order.id}`,
      [
        {
          text: 'Pendiente',
          onPress: () => handleUpdateStatus(order.id, 'pending'),
        },
        {
          text: 'Completado',
          onPress: () => handleUpdateStatus(order.id, 'completed'),
        },
        {
          text: 'Cancelado',
          onPress: () => handleUpdateStatus(order.id, 'cancelled'),
          style: 'destructive',
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#EF4444' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
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
        <Text style={styles.headerTitle}>Órdenes</Text>
        <View style={styles.placeholder} />
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
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No hay órdenes registradas</Text>
            </View>
          ) : (
            orders.map((order) => {
              const statusColors = getStatusColor(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => showStatusMenu(order)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderIcon}>
                      <Ionicons name="cart" size={24} color="#EC4899" />
                    </View>
                    <View style={styles.orderInfo}>
                      <View style={styles.orderTop}>
                        <Text style={styles.orderId}>Orden #{order.id}</Text>
                        <View
                          style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
                        >
                          <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {getStatusLabel(order.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userName}>{order.user.name}</Text>
                      <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
                    </View>
                  </View>

                  <View style={styles.orderItems}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <Ionicons name="cube" size={16} color="#64748B" />
                        <Text style={styles.itemText}>
                          {item.product_name} x{item.quantity}
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text style={styles.moreItems}>
                        +{order.items.length - 3} productos más
                      </Text>
                    )}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
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
  placeholder: {
    width: 40,
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    gap: 4,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    color: '#64748B',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  orderItems: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#64748B',
  },
  moreItems: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 24,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
});
