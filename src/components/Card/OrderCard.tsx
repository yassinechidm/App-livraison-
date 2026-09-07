import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { ChevronRight, Clock, RefreshCw } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { ORDER_STATUS_CONFIG } from '@/src/types/order.types';
import AppButton from '../Button/AppButton';
import { OrderCardProps } from './types';

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onReorderPress,
  style,
}) => {
  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.PENDING;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      mode="outlined"
      style={[styles.card, style]}
      onPress={() => onPress(order)}
    >
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text variant="titleMedium" style={styles.orderNumber}>
              Commande #{order.order_number}
            </Text>
            <View style={styles.dateRow}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.dateText}>{formatDate(order.created_at)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {order.items && order.items.length > 0 && (
          <Text variant="bodySmall" style={styles.itemsSummary} numberOfLines={2}>
            {order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
          </Text>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.total}>{order.total.toFixed(2)} DH</Text>

          <View style={styles.actions}>
            {onReorderPress && (
              <AppButton
                title="Recommander"
                variant="outline"
                size="sm"
                onPress={() => onReorderPress(order)}
                icon={() => <RefreshCw size={14} color={colors.primary} />}
                style={styles.reorderBtn}
              />
            )}
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontWeight: '800',
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  itemsSummary: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  total: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reorderBtn: {
    height: 34,
  },
});

export default OrderCard;
