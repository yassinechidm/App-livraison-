import Colors from '@/constants/Colors';
import { MenuItem } from '@/types/restaurant.types';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QuantitySelector from './QuantitySelector';

interface MenuItemRowProps {
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress?: () => void;
}

export default function MenuItemRow({
  item,
  quantityInCart,
  onAddToCart,
  onIncrement,
  onDecrement,
  onPress,
}: MenuItemRowProps) {
  const isAvailable = item.is_available !== false;

  return (
    <TouchableOpacity
      style={[styles.container, !isAvailable && styles.containerDisabled]}
      onPress={onPress}
      activeOpacity={isAvailable ? 0.85 : 0.6}
    >
      {/* Dish Details (Left side in Deliveroo) */}
      <View style={styles.content}>
        <Text
          style={[styles.name, !isAvailable && styles.textDisabled]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={[styles.price, !isAvailable && styles.textDisabled]}>
            {item.price.toFixed(2)} DH
          </Text>

          {item.is_popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Populaire</Text>
            </View>
          )}
        </View>
      </View>

      {/* Dish Photo on Right (Deliveroo format) */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image_url }}
          style={[styles.image, !isAvailable && styles.imageDisabled]}
          resizeMode="cover"
        />

        {!isAvailable ? (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>ÉPUISÉ</Text>
          </View>
        ) : (
          <View style={styles.actionOverlay}>
            {quantityInCart > 0 ? (
              <QuantitySelector
                quantity={quantityInCart}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                size="small"
              />
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={onAddToCart}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnIcon}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  containerDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  popularBadge: {
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  textDisabled: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  imageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDisabled: {
    opacity: 0.5,
  },
  soldOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addBtnIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 20,
  },
});

