import { StyleProp, ViewStyle } from 'react-native';
import { CartItem as CartItemType, CartSummary } from '@/src/types/cart.types';
import { Order, OrderStatus as OrderStatusEnum } from '@/src/types/order.types';

export interface ProductQuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export interface CartItemRowProps {
  item: CartItemType;
  onIncrement: (item: CartItemType) => void;
  onDecrement: (item: CartItemType) => void;
  onRemove?: (item: CartItemType) => void;
  style?: StyleProp<ViewStyle>;
}

export interface CheckoutSummaryProps {
  summary: CartSummary;
  style?: StyleProp<ViewStyle>;
}

export interface OrderStatusBadgeProps {
  status: OrderStatusEnum;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface DeliveryTrackingProps {
  order: Order;
  style?: StyleProp<ViewStyle>;
}
