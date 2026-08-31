import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Product } from '@/types/product.types';
import QuantitySelector from './QuantitySelector';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress: () => void;
}

export default function ProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onIncrement,
  onDecrement,
  onPress,
}: ProductCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{product.price.toFixed(2)}</Text>
            <Text style={styles.currency}> DH</Text>
          </View>

          {quantityInCart > 0 ? (
            <QuantitySelector
              quantity={quantityInCart}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              size="small"
            />
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddToCart}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  currency: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  addButton: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
});
