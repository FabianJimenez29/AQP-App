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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    try {
      if (product.has_variants && selectedVariant) {
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
            <Ionicons name="cube-outline" size={14} color={Colors.primary.blue} />
            <Text style={styles.stockText}>
              Stock: {selectedVariant ? selectedVariant.stock : product.stock} {selectedVariant?.unit || 'unidades'}
            </Text>
          </View>
        </View>

        {/* 5. Variantes (espacio reservado siempre) */}
        <View style={styles.variantsContainer}>
          {product.has_variants && product.variants && product.variants.length > 0 ? (
            <>
              <Text style={styles.variantsLabel}>Presentación</Text>
              <View style={styles.variantsList}>
                {product.variants.map((variant) => (
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
          ) : null}
        </View>
      </View>

      {/* Action - Always at bottom */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={handleAddToCart}
          disabled={!selectedVariant && product.has_variants}
        >
          <Ionicons name="cart" size={16} color="white" />
          <Text style={[styles.cartButtonText, { marginLeft: 6 }]}>Agregar</Text>
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
  actionContainer: {
    marginTop: 'auto', // Empuja el botón hacia abajo
    paddingTop: 8, // Espacio adicional arriba del botón
  },
  cartButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  cartButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.neutral.white,
  },

});

export default ProductCard;