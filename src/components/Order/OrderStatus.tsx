import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
} from 'lucide-react-native';
import { borderRadius } from '@/src/theme';
import { ORDER_STATUS_CONFIG } from '@/src/types/order.types';
import { OrderStatusBadgeProps } from './types';

export const OrderStatus: React.FC<OrderStatusBadgeProps> = ({
  status,
  showIcon = true,
  style,
}) => {
  const config = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING;

  const renderIcon = () => {
    if (!showIcon) return undefined;
    const size = 14;
    const color = config.color;

    switch (status) {
      case 'PENDING':
        return () => <Clock size={size} color={color} />;
      case 'CONFIRMED':
        return () => <CheckCircle2 size={size} color={color} />;
      case 'PREPARING':
        return () => <ChefHat size={size} color={color} />;
      case 'READY':
        return () => <PackageCheck size={size} color={color} />;
      case 'OUT_FOR_DELIVERY':
        return () => <Bike size={size} color={color} />;
      case 'DELIVERED':
        return () => <CheckCircle2 size={size} color={color} />;
      case 'CANCELLED':
        return () => <AlertCircle size={size} color={color} />;
      default:
        return () => <Clock size={size} color={color} />;
    }
  };

  return (
    <Chip
      icon={renderIcon()}
      style={[
        styles.chip,
        { backgroundColor: config.bgColor },
        style,
      ]}
      textStyle={[styles.text, { color: config.color }]}
      compact
    >
      {config.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: borderRadius.sm,
    height: 28,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 0,
  },
});

export default OrderStatus;
