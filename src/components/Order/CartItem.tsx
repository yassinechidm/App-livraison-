import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { borderRadius, colors, spacing } from '@/src/theme';
import ProductQuantitySelector from './ProductQuantitySelector';
import { CartItemRowProps } from './types';

export const CartItem: React.FC<CartItemRowProps> = ({
  item,
  onIncrement,
  onDecrement,
  style,
}) => {
  return (
    <Surface elevation={0} style={[styles.card, style]}>
      {item.item.image_url ? (
        <Image
          source={{ uri: item.item.image_url }}
          style={styles.image}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
            {item.item.name}
          </Text>
          <Text style={styles.price}>{item.item_total.toFixed(2)} DH</Text>
        </View>

        {item.selected_options_text ? (
          <Text variant="bodySmall" style={styles.customizations} numberOfLines={2}>
            {item.selected_options_text}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <Text variant="bodySmall" style={styles.unitPrice}>
            {item.item.price.toFixed(2)} DH / unité
          </Text>
          <ProductQuantitySelector
            quantity={item.quantity}
            onIncrement={() => onIncrement(item)}
            onDecrement={() => onDecrement(item)}
            min={0}
            size="sm"
          />
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  price: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 14,
  },
  customizations: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  unitPrice: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default CartItem;
