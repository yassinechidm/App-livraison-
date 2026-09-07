import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { ProductQuantitySelectorProps } from './types';

export const ProductQuantitySelector: React.FC<ProductQuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  size = 'md',
  style,
}) => {
  const isMin = quantity <= min;
  const isMax = quantity >= max;

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { btnSize: 28, iconSize: 14, fontSize: 13 };
      case 'lg':
        return { btnSize: 40, iconSize: 18, fontSize: 16 };
      case 'md':
      default:
        return { btnSize: 32, iconSize: 16, fontSize: 14 };
    }
  };

  const dim = getDimensions();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.btn,
          { width: dim.btnSize, height: dim.btnSize },
          isMin && styles.btnDisabled,
        ]}
        onPress={onDecrement}
        disabled={isMin && min > 0}
        activeOpacity={0.7}
      >
        {quantity === 1 && min === 0 ? (
          <Trash2 size={dim.iconSize} color={colors.error} />
        ) : (
          <Minus
            size={dim.iconSize}
            color={isMin ? colors.textMuted : colors.text}
          />
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.quantity,
          { fontSize: dim.fontSize },
        ]}
      >
        {quantity}
      </Text>

      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnPlus,
          { width: dim.btnSize, height: dim.btnSize },
          isMax && styles.btnDisabled,
        ]}
        onPress={onIncrement}
        disabled={isMax}
        activeOpacity={0.7}
      >
        <Plus size={dim.iconSize} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  btn: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  btnPlus: {
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  quantity: {
    paddingHorizontal: spacing.sm,
    fontWeight: '800',
    color: colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
});

export default ProductQuantitySelector;
