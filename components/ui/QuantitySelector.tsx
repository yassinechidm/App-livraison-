import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';

interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'small' | 'medium';
}

export default function QuantitySelector({
  quantity,
  onIncrement,
  onDecrement,
  size = 'medium',
}: QuantitySelectorProps) {
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <TouchableOpacity
        style={[styles.button, isSmall && styles.buttonSmall]}
        onPress={onDecrement}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isSmall && styles.buttonTextSmall]}>−</Text>
      </TouchableOpacity>

      <Text style={[styles.quantityText, isSmall && styles.quantityTextSmall]}>
        {quantity}
      </Text>

      <TouchableOpacity
        style={[styles.button, isSmall && styles.buttonSmall]}
        onPress={onIncrement}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, isSmall && styles.buttonTextSmall]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  containerSmall: {
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 18,
  },
  buttonTextSmall: {
    fontSize: 13,
    lineHeight: 15,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 16,
    textAlign: 'center',
  },
  quantityTextSmall: {
    fontSize: 12,
    minWidth: 14,
  },
});
