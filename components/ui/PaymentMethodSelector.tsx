import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { PaymentMethod, PAYMENT_METHODS } from '@/types/payment.types';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({
  selected,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <View style={styles.container}>
      {PAYMENT_METHODS.map((method) => {
        const isSelected = selected === method.id;

        return (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              isSelected && styles.methodCardSelected,
              isSelected && { borderColor: method.color },
            ]}
            onPress={() => onSelect(method.id)}
            activeOpacity={0.7}
          >
            {/* Radio indicator */}
            <View
              style={[
                styles.radio,
                isSelected && { borderColor: method.color },
              ]}
            >
              {isSelected && (
                <View
                  style={[styles.radioFill, { backgroundColor: method.color }]}
                />
              )}
            </View>

            {/* Icon */}
            <View
              style={[styles.iconCircle, { backgroundColor: method.bgColor }]}
            >
              <Text style={styles.emoji}>{method.emoji}</Text>
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  isSelected && { color: method.color },
                ]}
              >
                {method.title}
              </Text>
              <Text style={styles.subtitle}>{method.subtitle}</Text>
            </View>

            {/* Badge for card */}
            {method.id === 'card' && (
              <View style={styles.secureBadge}>
                <Text style={styles.secureBadgeText}>🔒 Sécurisé</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  methodCardSelected: {
    backgroundColor: Colors.backgroundWhite,
    shadowOpacity: 0.08,
    elevation: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  secureBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
});
