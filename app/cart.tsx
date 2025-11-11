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

  // Form state
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
      `¿Estás seguro de que quieres eliminar "${productName}" del carrito?`,
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
    // Validaciones
    if (items.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }

    // Preparar datos del pedido
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
              // Limpiar formulario
              setDeliveryAddress('');
              setNotes('');
              // Volver a productos
              navigation.navigate('Products');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'No se pudo crear el pedido. Inténtalo de nuevo.');
    }
  };

  // Si no hay items en el carrito
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
          <Ionicons name="cart-outline" size={80} color={Colors.neutral.gray} />
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubtitle}>
            Agrega productos desde la pantalla de productos
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary.blue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carrito de Compras</Text>
          <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger.red} />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Productos:</Text>
            <Text style={styles.summaryValue}>{totalItems} items</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Productos en tu carrito</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variantName && (
                  <Text style={styles.itemVariant}>Variante: {item.variantName}</Text>
                )}
                <Text style={styles.itemPrice}>
                  ${item.unitPrice.toFixed(2)} c/u
                </Text>
              </View>
              
              <View style={styles.itemActions}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="remove" size={16} color={Colors.primary.blue} />
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Ionicons name="add" size={16} color={Colors.primary.blue} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id, item.productName)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger.red} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.itemTotalContainer}>
                <Text style={styles.itemTotal}>
                  ${item.totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información del pedido</Text>
          
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Técnico:</Text>
            <Text style={styles.infoValue}>{user?.name || 'Usuario'}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Dirección de entrega</Text>
            <TextInput
              style={styles.input}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Dirección o ubicación de entrega"
              placeholderTextColor={Colors.neutral.gray}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notas adicionales</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Comentarios o instrucciones especiales..."
              placeholderTextColor={Colors.neutral.gray}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity onPress={() => dispatch(clearError())}>
              <Text style={styles.dismissError}>Descartar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmitOrder}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.submitButtonText}>Enviando pedido...</Text>
            </View>
          ) : (
            <View style={styles.submitContent}>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                Finalizar Pedido ({totalItems} items)
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
    backgroundColor: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.lightGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  clearButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: Colors.primary.lightBlue,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.neutral.darkGray,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.blue,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.neutral.gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 16,
  },
  itemsContainer: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 14,
    color: Colors.neutral.gray,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.primary.blue,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 8,
    backgroundColor: Colors.neutral.white,
    borderRadius: 6,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  itemTotalContainer: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.blue,
  },
  formContainer: {
    padding: 16,
    backgroundColor: Colors.neutral.lightGray,
  },
  infoGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.gray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.neutral.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.neutral.gray + '40',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.neutral.darkGray,
  },
  notesInput: {
    minHeight: 80,
  },
  errorContainer: {
    backgroundColor: Colors.danger.lightRed,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: Colors.danger.red,
    fontSize: 14,
    flex: 1,
  },
  dismissError: {
    color: Colors.danger.red,
    fontSize: 14,
    fontWeight: '600',
  },
  submitContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.lightGray,
  },
  submitButton: {
    backgroundColor: Colors.primary.blue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral.gray,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CartScreen;