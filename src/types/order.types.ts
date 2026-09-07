import { colors } from '../theme/colors';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethodType = 'CASH' | 'TRANSFER' | 'CARD';

export interface Address {
  id: string;
  user_id: string;
  label: string; // 'Maison', 'Travail', 'Autre'
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_customizations_text?: string;
  special_instructions?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address_id?: string;
  delivery_address_text: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  delivery_mode?: 'DELIVERY' | 'PICKUP';
  total: number;
  payment_method: PaymentMethodType;
  notes?: string;
  estimated_delivery_minutes: number;
  items?: OrderItem[];
  rating?: number;
  review_text?: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  stepIndex: number;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  PENDING: {
    key: 'PENDING',
    label: 'Reçue',
    description: 'Votre commande a été transmise',
    color: colors.warning,
    bgColor: colors.warningLight,
    stepIndex: 0,
  },
  CONFIRMED: {
    key: 'CONFIRMED',
    label: 'Confirmée',
    description: 'La commande a été acceptée',
    color: colors.primary,
    bgColor: colors.primaryLight,
    stepIndex: 1,
  },
  PREPARING: {
    key: 'PREPARING',
    label: 'En cuisine',
    description: 'Préparation en cours',
    color: colors.primary,
    bgColor: colors.primaryLight,
    stepIndex: 2,
  },
  READY: {
    key: 'READY',
    label: 'Prête',
    description: 'La commande attend le livreur',
    color: colors.primary,
    bgColor: colors.primaryLight,
    stepIndex: 3,
  },
  OUT_FOR_DELIVERY: {
    key: 'OUT_FOR_DELIVERY',
    label: 'En livraison',
    description: 'Le livreur est en route vers votre adresse',
    color: colors.primary,
    bgColor: colors.primaryLight,
    stepIndex: 4,
  },
  DELIVERED: {
    key: 'DELIVERED',
    label: 'Livrée',
    description: 'Commande livrée avec succès',
    color: colors.success,
    bgColor: colors.successLight,
    stepIndex: 5,
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Annulée',
    description: 'Cette commande a été annulée',
    color: colors.error,
    bgColor: colors.errorLight,
    stepIndex: -1,
  },
};
