import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { Product, ProductVariant } from '../../types';
import { Colors } from '../../constants/colors';
import { addToCart } from '../../store/cartSlice';
import { AppDispatch } from '../../store';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columnas con padding

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Filtrar variantes sin stock
  const availableVariants = product.variants?.filter(v => v.stock > 0) || [];
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    availableVariants.length > 0 ? availableVariants[0] : null
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  // Determinar si el producto/variante tiene stock
  const hasStock = product.has_variants 
    ? (selectedVariant && selectedVariant.stock > 0)
    : (product.stock > 0);

  const isDisabled = !hasStock || (!selectedVariant && product.has_variants);

  const handleAddToCart = () => {
    try {
      // Verificar stock antes de agregar
      if (product.has_variants && selectedVariant) {
        if (selectedVariant.stock <= 0) {
          Alert.alert('Sin stock', `${product.name} (${selectedVariant.variant_name}) no tiene stock disponible`);
          return;
        }

        dispatch(addToCart({
          productId: product.id,
          productName: product.name,
          variantId: selectedVariant.id,
          variantName: selectedVariant.variant_name,
          quantity: 1,
          unitPrice: 0, // Precio por defecto
        }));
        
        Alert.alert(
          '✅ Agregado al carrito', 
          `${product.name} (${selectedVariant.variant_name}) agregado correctamente`
        );
      } else if (!product.has_variants) {
        if (product.stock <= 0) {
          Alert.alert('Sin stock', `${product.name} no tiene stock disponible`);
          return;
        }

        dispatch(addToCart({
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: 0, // Precio por defecto
        }));
        
        Alert.alert(
          '✅ Agregado al carrito', 
          `${product.name} agregado correctamente`
        );
      } else {
        Alert.alert('Error', 'Por favor selecciona una variante');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el producto al carrito');
    }
  };



  return (
    <View style={styles.card}>
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Ionicons 
            name="cube-outline" 
            size={32} 
            color="#d9d9d9" 
            style={styles.placeholderIcon}
          />
        </View>

        {/* 1. Nombre del producto */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>
        </View>

    

        {/* 3. Descripción */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {product.description || 'Sin descripción disponible'}
          </Text>
        </View>

        {/* 4. Stock */}
        <View style={styles.stockContainer}>
          <View style={styles.stockRow}>
            <Ionicons 
              name="cube-outline" 
              size={14} 
              color={hasStock ? Colors.primary.blue : '#ef4444'} 
            />
            <Text style={[
              styles.stockText,
              !hasStock && styles.stockTextEmpty
            ]}>
              {hasStock 
                ? `Stock: ${selectedVariant ? selectedVariant.stock : product.stock} ${selectedVariant?.unit || 'unidades'}`
                : 'Sin stock disponible'}
            </Text>
          </View>
        </View>

        {/* 5. Variantes (espacio reservado siempre) */}
        <View style={styles.variantsContainer}>
          {product.has_variants && availableVariants.length > 0 ? (
            <>
              <Text style={styles.variantsLabel}>Presentación</Text>
              <View style={styles.variantsList}>
                {availableVariants.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.variantButton,
                      selectedVariant?.id === variant.id && styles.variantButtonSelected,
                    ]}
                    onPress={() => handleVariantSelect(variant)}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        selectedVariant?.id === variant.id && styles.variantButtonTextSelected,
                      ]}
                    >
                      {variant.variant_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : product.has_variants ? (
            <Text style={styles.noVariantsText}>Sin presentaciones disponibles</Text>
          ) : null}
        </View>
      </View>

      {/* Action - Always at bottom */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[
            styles.cartButton,
            isDisabled && styles.cartButtonDisabled
          ]}
          onPress={handleAddToCart}
          disabled={isDisabled}
        >
          <Ionicons name="cart" size={16} color="white" />
          <Text style={styles.cartButtonText}>
            {hasStock ? 'Agregar' : 'Sin stock'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 15, // Menos padding inferior para que el botón esté más abajo
    width: cardWidth,
    height: 340, // ✅ Aumenté de 320 a 350px para extender el card blanco hacia abajo
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'space-between', // Distribuir el contenido uniformemente
  },
  contentContainer: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.primary.lightBlue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderIcon: {
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.neutral.darkGray,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: Colors.neutral.gray,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: Colors.neutral.gray,
    lineHeight: 16,
  },
  variantsContainer: {
    marginBottom: 8,
    minHeight: 50, // Altura mínima fija para la sección de variantes
    justifyContent: 'flex-start',
  },
  variantsLabel: {
    fontSize: 12,
    color: Colors.neutral.darkGray,
    marginBottom: 6,
  },
  variantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: Colors.neutral.gray + '20',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.neutral.gray + '20',
    marginRight: 4,
    marginBottom: 4,
  },
  variantButtonSelected: {
    backgroundColor: Colors.primary.blue,
    borderColor: Colors.primary.blue,
    shadowColor: Colors.primary.blue,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  variantButtonText: {
    fontSize: 11,
    color: Colors.neutral.darkGray,
    fontWeight: '500',
  },
  variantButtonTextSelected: {
    color: Colors.neutral.white,
    fontWeight: '600',
  },
  stockContainer: {
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockText: {
    fontSize: 11,
    color: Colors.neutral.darkGray,
    fontWeight: '500',
  },
  stockTextEmpty: {
    color: '#ef4444',
    fontWeight: '600',
  },
  noVariantsText: {
    fontSize: 11,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  actionContainer: {
    marginTop: 'auto', // Empuja el botón hacia abajo
    paddingTop: 8, // Espacio adicional arriba del botón
  },
  cartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary.blue,
    borderRadius: 8,
    shadowColor: Colors.primary.blue,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  cartButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
    opacity: 0.6,
  },
  cartButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral.white,
  },

});

export default ProductCard;