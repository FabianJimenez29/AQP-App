import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../constants/colors';
import { RootState, AppDispatch } from '../store';
import { 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  createOrder, 
  clearError,
  CreateOrderRequest 
} from '../store/cartSlice';

type NavigationProp = StackNavigationProp<any>;

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { items, totalItems, totalAmount, isSubmitting, error, lastOrderNumber } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      Alert.alert(
        'Eliminar producto',
        '¿Estás seguro de que quieres eliminar este producto del carrito?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => dispatch(removeFromCart(itemId)) }
        ]
      );
    } else {
      dispatch(updateQuantity({ itemId, quantity }));
    }
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    Alert.alert(
      'Eliminar producto',
      `¿Estás seguro de que quieres eliminar "${productName}" de la orden?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => dispatch(removeFromCart(itemId)) }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: () => dispatch(clearCart()) }
      ]
    );
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }

    const orderData: CreateOrderRequest = {
      items: items.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        variant_id: item.variantId,
        variant_name: item.variantName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      delivery_address: deliveryAddress.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      
      Alert.alert(
        '✅ ¡Pedido creado exitosamente!',
        `Tu pedido ${result.order_number} ha sido enviado por correo y está siendo procesado.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setDeliveryAddress('');
              setNotes('');
              navigation.navigate('Products');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'No se pudo crear el pedido. Inténtalo de nuevo.');
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary.blue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carrito de Compras</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={Colors.neutral.gray} />
          <Text style={styles.emptyTitle}>Sin productos en la orden</Text>
          <Text style={styles.emptySubtitle}>
            Agrega productos desde la pantalla de productos para crear una orden de compra
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Ionicons name="storefront-outline" size={20} color="white" />
            <Text style={styles.shopButtonText}>Ir a Productos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Orden de Compra</Text>
          <Text style={styles.headerSubtitle}>{`${totalItems} ${totalItems === 1 ? 'producto' : 'productos'}`}</Text>
        </View>
        <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={22} color="#f44336" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="document-text" size={32} color="white" />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Orden de Compra</Text>
            <Text style={styles.summaryLabelSmall}>{`${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} en tu pedido`}</Text>
          </View>
        </View>

        <View style={styles.itemsContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="cube-outline" size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Productos</Text>
          </View>
          {items.map((item, index) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {item.variantName && (
                    <View style={styles.variantBadge}>
                      <Ionicons name="pricetag" size={12} color="#666" />
                      <Text style={styles.itemVariant}>{item.variantName}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id, item.productName)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>

              <View style={styles.itemFooter}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="remove" size={18} color="#0066CC" />
                  </TouchableOpacity>
                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="add" size={18} color="#0066CC" />
                  </TouchableOpacity>
                </View>

                <View style={styles.quantityLabel}>
                  <Text style={styles.quantityLabelText}>Cantidad solicitada</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.formContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="document-text-outline" size={20} color="#1a1a1a" />
            <Text style={styles.sectionTitle}>Detalles del Pedido</Text>
          </View>
          
          <View style={styles.technicianCard}>
            <View style={styles.technicianIcon}>
              <Ionicons name="person" size={20} color="#0066CC" />
            </View>
            <View style={styles.technicianInfo}>
              <Text style={styles.technicianLabel}>Solicitado por</Text>
              <Text style={styles.technicianName}>{user?.name || 'Usuario'}</Text>
            </View>
            <View style={styles.technicianBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.inputLabel}>Dirección de Entrega</Text>
            </View>
            <TextInput
              style={styles.input}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Ingresa la dirección de entrega..."
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="chatbox-ellipses-outline" size={16} color="#666" />
              <Text style={styles.inputLabel}>Notas Adicionales</Text>
            </View>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Comentarios o instrucciones especiales..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#f44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => dispatch(clearError())} style={styles.dismissButton}>
              <Ionicons name="close" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? (
            <View style={styles.submitContent}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.submitButtonText}>Procesando...</Text>
            </View>
          ) : (
            <View style={styles.submitContent}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.submitButtonText}>
                Enviar Orden de Compra
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#0066CC',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  summaryLabelSmall: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  itemsContainer: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066CC',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  quantityLabel: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quantityLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d6e9ff',
  },
  technicianIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  technicianName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  technicianBadge: {
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    gap: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
  submitContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.5,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default CartScreen;
