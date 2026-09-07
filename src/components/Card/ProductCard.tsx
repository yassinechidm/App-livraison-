import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { ProductCardProps } from './types';

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  onPress,
  onAddPress,
  style,
}) => {
  return (
    <Card
      mode="outlined"
      style={[styles.card, style]}
      onPress={() => onPress(item)}
    >
      <View style={styles.container}>
        <View style={styles.textColumn}>
          <Text variant="titleMedium" style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price.toFixed(2)} DH</Text>
            {item.order_count_badge && (
              <Text style={styles.badge}>{item.order_count_badge}</Text>
            )}
          </View>
        </View>

        <View style={styles.imageColumn}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {onAddPress && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                onAddPress(item);
              }}
              activeOpacity={0.8}
            >
              <Plus size={18} color={colors.textInverse} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: spacing.md,
  },
  name: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  badge: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  imageColumn: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
  },
  addButton: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});

export default ProductCard;
