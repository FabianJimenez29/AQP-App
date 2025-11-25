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
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import ApiService from '../services/api';

interface ProductVariant {
  id?: number;
  product_id?: number;
  variant_name: string;
  stock: number;
  unit: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  stock?: number;
  description?: string;
  has_variants: boolean;
  variants?: ProductVariant[];
}

export default function AdminInventoryScreen() {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.auth.token);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: '',
    description: '',
    has_variants: false,
    variants: [] as ProductVariant[],
  });

  const loadProducts = async () => {
    try {
      const response = await ApiService.get<any>('/products/all', token!);
      
      // Manejar diferentes formatos de respuesta
      let productsArray = [];
      if (Array.isArray(response)) {
        productsArray = response;
      } else if (response.products && Array.isArray(response.products)) {
        productsArray = response.products;
      } else if (response.data && Array.isArray(response.data)) {
        productsArray = response.data;
      }
      
      setProducts(productsArray);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.category) {
      Alert.alert('Error', 'Nombre y categoría son obligatorios');
      return;
    }

    if (formData.has_variants) {
      if (formData.variants.length === 0) {
        Alert.alert('Error', 'Debes agregar al menos una variante');
        return;
      }
      // Validar que todas las variantes tengan nombre y stock
      const invalidVariant = formData.variants.find(v => !v.variant_name.trim() || !v.unit.trim());
      if (invalidVariant) {
        Alert.alert('Error', 'Todas las variantes deben tener nombre, stock y unidad');
        return;
      }
    } else if (!formData.stock) {
      Alert.alert('Error', 'El stock es obligatorio');
      return;
    }

    try {
      await ApiService.post(
        '/products',
        {
          name: formData.name,
          category: formData.category,
          stock: formData.has_variants ? 0 : parseInt(formData.stock),
          description: formData.description || undefined,
          has_variants: formData.has_variants,
          variants: formData.has_variants ? formData.variants : undefined,
        },
        token!
      );
      Alert.alert('Éxito', 'Producto creado correctamente');
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el producto');
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !formData.name || !formData.category) {
      Alert.alert('Error', 'Nombre y categoría son obligatorios');
      return;
    }

    if (formData.has_variants) {
      if (formData.variants.length === 0) {
        Alert.alert('Error', 'Debes agregar al menos una variante');
        return;
      }
      const invalidVariant = formData.variants.find(v => !v.variant_name.trim() || !v.unit.trim());
      if (invalidVariant) {
        Alert.alert('Error', 'Todas las variantes deben tener nombre, stock y unidad');
        return;
      }
    } else if (!formData.stock) {
      Alert.alert('Error', 'El stock es obligatorio');
      return;
    }

    try {
      await ApiService.put(
        `/products/${selectedProduct.id}`,
        {
          name: formData.name,
          category: formData.category,
          stock: formData.has_variants ? 0 : parseInt(formData.stock),
          description: formData.description || undefined,
          has_variants: formData.has_variants,
          variants: formData.has_variants ? formData.variants : undefined,
        },
        token!
      );
      Alert.alert('Éxito', 'Producto actualizado correctamente');
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el producto');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar ${product.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.delete(`/products/${product.id}`, token!);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              loadProducts();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    resetForm();
    setEditMode(false);
    setSelectedProduct(null);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name || '',
      category: product.category || '',
      stock: product.stock !== undefined && product.stock !== null ? product.stock.toString() : '0',
      description: product.description || '',
      has_variants: product.has_variants || false,
      variants: product.variants || [],
    });
    setEditMode(true);
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      stock: '',
      description: '',
      has_variants: false,
      variants: [],
    });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        { variant_name: '', stock: 0, unit: 'unidades' },
      ],
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setFormData({ ...formData, variants: updatedVariants });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventario</Text>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
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
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>No hay productos registrados</Text>
            </View>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <View style={styles.productIcon}>
                    <Ionicons name="cube" size={24} color="#7C3AED" />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name || 'Sin nombre'}</Text>
                    <Text style={styles.productCategory}>{product.category || 'Sin categoría'}</Text>
                    {product.has_variants && product.variants && product.variants.length > 0 ? (
                      <View style={styles.variantsContainer}>
                        {product.variants.map((variant, idx) => (
                          <View key={idx} style={styles.variantBadge}>
                            <Text style={styles.variantText}>
                              {variant.variant_name}: {variant.stock} {variant.unit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.productMeta}>
                        <View style={styles.stockBadge}>
                          <Ionicons name="layers" size={12} color="#059669" />
                          <Text style={styles.stockText}>{product.stock || 0} unidades</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(product)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={20} color="#0284C7" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(product)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
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
                {editMode ? 'Editar Producto' : 'Nuevo Producto'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.inputLabel}>Categoría</Text>
              <TextInput
                style={styles.input}
                placeholder="Categoría"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />

              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del producto"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              {/* Checkbox de variantes */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFormData({ ...formData, has_variants: !formData.has_variants })}
              >
                <View style={[styles.checkbox, formData.has_variants && styles.checkboxChecked]}>
                  {formData.has_variants && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Este producto tiene variantes</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Activa esta opción si el producto viene en diferentes presentaciones o tamaños
              </Text>

              {/* Stock simple o variantes */}
              {!formData.has_variants ? (
                <>
                  <Text style={styles.inputLabel}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    keyboardType="numeric"
                  />
                </>
              ) : (
                <>
                  <View style={styles.variantsSectionHeader}>
                    <Text style={styles.variantsSectionTitle}>📦 Variantes del Producto</Text>
                    <TouchableOpacity style={styles.addVariantButton} onPress={addVariant}>
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                      <Text style={styles.addVariantText}>Agregar</Text>
                    </TouchableOpacity>
                  </View>

                  {formData.variants.length === 0 ? (
                    <View style={styles.noVariantsContainer}>
                      <Ionicons name="cube-outline" size={32} color="#CBD5E1" />
                      <Text style={styles.noVariantsText}>
                        No hay variantes. Agrega al menos una.
                      </Text>
                    </View>
                  ) : (
                    formData.variants.map((variant, index) => (
                      <View key={index} style={styles.variantItem}>
                        <View style={styles.variantHeader}>
                          <Text style={styles.variantNumber}>Variante #{index + 1}</Text>
                          <TouchableOpacity
                            onPress={() => removeVariant(index)}
                            style={styles.removeVariantButton}
                          >
                            <Ionicons name="trash" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.variantInputs}>
                          <View style={styles.variantInputGroup}>
                            <Text style={styles.variantInputLabel}>Nombre *</Text>
                            <TextInput
                              style={styles.variantInput}
                              placeholder="Ej: 1kg, 5kg, 25lb"
                              value={variant.variant_name}
                              onChangeText={(text) => updateVariant(index, 'variant_name', text)}
                            />
                          </View>
                          <View style={styles.variantInputRow}>
                            <View style={[styles.variantInputGroup, { flex: 1 }]}>
                              <Text style={styles.variantInputLabel}>Stock *</Text>
                              <TextInput
                                style={styles.variantInput}
                                placeholder="0"
                                value={variant.stock.toString()}
                                onChangeText={(text) => updateVariant(index, 'stock', parseInt(text) || 0)}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={[styles.variantInputGroup, { flex: 1 }]}>
                              <Text style={styles.variantInputLabel}>Unidad *</Text>
                              <TextInput
                                style={styles.variantInput}
                                placeholder="kg, lb, unidades"
                                value={variant.unit}
                                onChangeText={(text) => updateVariant(index, 'unit', text)}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}
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
                onPress={editMode ? handleUpdateProduct : handleCreateProduct}
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
  addButton: {
    backgroundColor: '#7C3AED',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  productCategory: {
    fontSize: 14,
    color: '#64748B',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Estilos para variantes en la lista de productos
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  variantBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  variantText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  // Estilos para el checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  // Estilos para sección de variantes
  variantsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  variantsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addVariantText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noVariantsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noVariantsText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  // Estilos para items de variante
  variantItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variantNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },
  removeVariantButton: {
    padding: 4,
  },
  variantInputs: {
    gap: 12,
  },
  variantInputGroup: {
    gap: 6,
  },
  variantInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  variantInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  variantInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
