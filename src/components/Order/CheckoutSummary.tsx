import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Surface, Text } from 'react-native-paper';
import { borderRadius, colors, spacing } from '@/src/theme';
import { CheckoutSummaryProps } from './types';

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  summary,
  style,
}) => {
  return (
    <Surface elevation={0} style={[styles.card, style]}>
      <Text variant="titleMedium" style={styles.title}>
        Détail de la commande
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sous-total ({summary.itemCount} articles)</Text>
        <Text style={styles.value}>{summary.subtotal.toFixed(2)} DH</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Frais de livraison</Text>
        <Text style={[styles.value, summary.deliveryFee === 0 && styles.freeValue]}>
          {summary.deliveryFee === 0 ? 'Offert' : `${summary.deliveryFee.toFixed(2)} DH`}
        </Text>
      </View>

      {summary.serviceFee > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Frais de service</Text>
          <Text style={styles.value}>{summary.serviceFee.toFixed(2)} DH</Text>
        </View>
      )}

      <Divider style={styles.divider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total à payer</Text>
        <Text style={styles.totalValue}>{summary.total.toFixed(2)} DH</Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  freeValue: {
    color: colors.success,
    fontWeight: '700',
  },
  divider: {
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
  },
});

export default CheckoutSummary;
