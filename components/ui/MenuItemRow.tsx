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
      {/* Dish Photo */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: item.image_url }}
          style={[styles.image, !isAvailable && styles.imageDisabled]}
          resizeMode="cover"
        />
        {!isAvailable && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>ÉPUISÉ</Text>
          </View>
        )}
      </View>

      {/* Dish Details */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.name, !isAvailable && styles.textDisabled]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text style={[styles.price, !isAvailable && styles.textDisabled]}>
            {item.price.toFixed(2)} MAD
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Social Proof Tag & Add Button Row */}
        <View style={styles.footerRow}>
          {!isAvailable ? (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutBadgeText}>🚫 Rupture de stock</Text>
            </View>
          ) : item.order_count_badge ? (
            <View style={styles.socialTag}>
              <Text style={styles.socialTagEmoji}>🛍️</Text>
              <Text style={styles.socialTagText}>{item.order_count_badge}</Text>
            </View>
          ) : (
            <View />
          )}

          {isAvailable ? (
            quantityInCart > 0 ? (
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
                activeOpacity={0.75}
              >
                <Text style={styles.addBtnIcon}>+</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>Indisponible</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 14,
  },
  containerDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.75,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: 0.2,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  textDisabled: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  socialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialTagEmoji: {
    fontSize: 11,
  },
  socialTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  soldOutBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  soldOutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addBtnIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 20,
  },
  disabledBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  disabledBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
});
