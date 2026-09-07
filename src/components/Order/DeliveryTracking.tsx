import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Surface, Text } from 'react-native-paper';
import { Bike, Clock, MapPin, Phone } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { ORDER_STATUS_CONFIG } from '@/src/types/order.types';
import AppButton from '../Button/AppButton';
import { DeliveryTrackingProps } from './types';

export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
  order,
  style,
}) => {
  const currentStatusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PENDING;
  const currentStep = Math.max(0, currentStatusConfig.stepIndex);
  const totalSteps = 5;
  const progress = order.status === 'CANCELLED' ? 0 : currentStep / totalSteps;

  return (
    <Surface elevation={1} style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View>
          <Text variant="titleMedium" style={styles.title}>
            {currentStatusConfig.label}
          </Text>
          <Text variant="bodySmall" style={styles.description}>
            {currentStatusConfig.description}
          </Text>
        </View>

        <View style={styles.timePill}>
          <Clock size={14} color={colors.primary} />
          <Text style={styles.timeText}>{order.estimated_delivery_minutes || 25} min</Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        color={order.status === 'CANCELLED' ? colors.error : colors.primary}
        style={styles.progressBar}
      />

      <View style={styles.stepsLabelRow}>
        <Text style={styles.stepIndicator}>Étape {currentStep + 1} sur 6</Text>
        <Text style={styles.orderRef}>#{order.order_number}</Text>
      </View>

      <View style={styles.addressRow}>
        <MapPin size={16} color={colors.textSecondary} />
        <Text style={styles.addressText} numberOfLines={1}>
          {order.delivery_address_text}
        </Text>
      </View>

      {order.driver_name && (
        <View style={styles.driverSection}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Bike size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.driverName}>{order.driver_name}</Text>
              <Text style={styles.driverRole}>Votre livreur Quickly</Text>
            </View>
          </View>

          {order.driver_phone && (
            <AppButton
              title="Appeler"
              size="sm"
              variant="outline"
              icon={() => <Phone size={14} color={colors.primary} />}
            />
          )}
        </View>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '900',
    color: colors.text,
  },
  description: {
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.xs,
  },
  stepsLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepIndicator: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  orderRef: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  driverRole: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default DeliveryTracking;
