import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Product } from '../types';
import Colors from '../constants/colors';
import PoolHeader from '../components/ui/PoolHeader';
import ProductCard from '../components/ui/ProductCard';
import BottomTabBar from '../components/ui/BottomTabBar';
import ApiService from '../services/api';
import { useAppSelector } from '../store/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

type NavigationProp = StackNavigationProp<any>;

// Datos de ejemplo para mostrar el diseño
const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Cloro Granulado',
    description: 'Cloro HTH granulado para desinfección eficaz del agua de piscina',
    category: 'Químicos',
    has_variants: true,
    stock: 0,
    variants: [
      { id: 1, variant_name: '4kg', stock: 15, unit: 'kg', is_available: true },
      { id: 2, variant_name: '10kg', stock: 8, unit: 'kg', is_available: true }
    ]
  },
  {
    id: 2,
    name: 'Cloro Tabletas',
    description: 'Tabletas de cloro de lenta disolución para mantenimiento regular',
    category: 'Químicos',
    has_variants: true,
    stock: 0,
    variants: [
      { id: 3, variant_name: '4kg', stock: 15, unit: 'kg', is_available: true },
      { id: 4, variant_name: '10kg', stock: 8, unit: 'kg', is_available: true }
    ]
  },
  {
    id: 3,
    name: 'Bicarbonato de Sodio',
    description: 'Ajusta la alcalinidad total del agua para pH equilibrado',
    category: 'Químicos',
    has_variants: true,
    stock: 0,
    variants: [
      { id: 5, variant_name: '2.5kg', stock: 30, unit: 'kg', is_available: true },
      { id: 6, variant_name: '25kg', stock: 10, unit: 'kg', is_available: true }
    ]
  },
  {
    id: 4,
    name: 'Ácido Muriático',
    description: 'Ácido clorhídrico para reducir pH del agua',
    category: 'Químicos',
    has_variants: false,
    stock: 25,
    variants: []
  },
  {
    id: 5,
    name: 'Bomba de Agua',
    description: 'Bomba centrífuga de alta eficiencia para filtración continua',
    category: 'Equipos',
    has_variants: false,
    stock: 5,
    variants: []
  },
  {
    id: 6,
    name: 'Sal para Piscina',
    description: 'Sal especial para sistemas de cloración salina',
    category: 'Químicos',
    has_variants: true,
    stock: 0,
    variants: [
      { id: 7, variant_name: '25kg', stock: 40, unit: 'kg', is_available: true },
      { id: 8, variant_name: '50kg', stock: 15, unit: 'kg', is_available: true }
    ]
  }
];

const sampleCategories = ['Todos', 'Químicos', 'Equipos', 'Accesorios'];

export default function ProductsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { token } = useAppSelector((state) => state.auth);
  const { items: cartItems, totalItems } = useSelector((state: RootState) => state.cart);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (token) {
        // Cargar productos
        const productsResponse = await ApiService.getProducts(token);
        
        if (productsResponse && productsResponse.success && productsResponse.products) {
          setProducts(productsResponse.products);
        } else {
          setProducts(sampleProducts);
        }
        
        // Cargar categorías
        const categoriesResponse = await ApiService.getProductCategories(token);
        
        if (categoriesResponse && categoriesResponse.success && categoriesResponse.categories) {
          const categoryNames = ['Todos', ...categoriesResponse.categories.map((cat: any) => 
            typeof cat === 'string' ? cat : cat.name || String(cat)
          )];
          setCategories(categoryNames);
        } else {
          setCategories(sampleCategories);
        }
      } else {
        setProducts(sampleProducts);
        setCategories(sampleCategories);
      }
      
      // Siempre agregar algunos productos de ejemplo para mostrar la interfaz
      if (products.length === 0) {
        setProducts(prevProducts => 
          prevProducts.length === 0 ? sampleProducts : prevProducts
        );
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      Alert.alert(
        'Error de conexión', 
        'No se pudieron cargar los productos de la base de datos. Mostrando productos de ejemplo.',
        [{ text: 'OK' }]
      );
      setProducts(sampleProducts);
      setCategories(sampleCategories);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredProducts = selectedCategory === 'Todos' 
    ? products 
    : products.filter(product => 
        String(product.category).toLowerCase() === selectedCategory.toLowerCase()
      );



  const renderCategoryButton = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === item && styles.categoryButtonTextActive,
      ]}>
        {String(item)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PoolHeader title="Productos" />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProducts(true)}
            colors={[Colors.primary.blue]}
            tintColor={Colors.primary.blue}
          />
        }
      >
        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <View style={styles.cartSummary}>
            <View style={styles.cartInfo}>
              <Ionicons name="cart" size={20} color={Colors.primary.blue} />
              <Text style={styles.cartText}>
                Carrito ({totalItems} productos)
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.cartButtonText}>Ver Carrito</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <FlatList
            data={categories.length > 0 ? categories : sampleCategories}
            renderItem={renderCategoryButton}
            keyExtractor={(item, index) => `category-${index}-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'Todos' ? 'Todos los Productos' : selectedCategory}
            </Text>
            {isLoading && (
              <View style={styles.loadingIndicator}>
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <MaterialIcons name="hourglass-empty" size={48} color={Colors.primary.blue} />
              <Text style={styles.loadingTitle}>Cargando productos...</Text>
              <Text style={styles.loadingSubtitle}>Conectando con la base de datos</Text>
            </View>
          ) : filteredProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productWrapper}>
                  <ProductCard
                    product={product}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory" size={48} color={Colors.neutral.gray} />
              <Text style={styles.emptyTitle}>No hay productos</Text>
              <Text style={styles.emptySubtitle}>
                No se encontraron productos en esta categoría
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => loadProducts(false)}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeTab="products" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.lightGray,
  },
  scrollContainer: {
    flex: 1,
  },
  cartSummary: {
    backgroundColor: Colors.neutral.white,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginLeft: 12,
  },
  cartButton: {
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cartButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginBottom: 15,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary.blue,
    shadowColor: Colors.primary.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryButtonText: {
    color: Colors.neutral.darkGray,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  productsSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
    marginBottom: 16,
  },
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.neutral.gray,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingIndicator: {
    backgroundColor: Colors.primary.blue + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.primary.blue,
    fontWeight: '600',
  },
  loadingContainer: {
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
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.blue,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: Colors.neutral.gray,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
