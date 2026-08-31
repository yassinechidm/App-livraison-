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
  rating?: number; // 1 to 5 stars
  review_text?: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  address_id?: string;
  delivery_address_text: string;
  delivery_mode?: 'DELIVERY' | 'PICKUP';
  payment_method: PaymentMethodType;
  notes?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    selected_customizations_text?: string;
    special_instructions?: string;
  }[];
}

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  stepIndex: number;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  PENDING: {
    key: 'PENDING',
    label: 'Reçue',
    description: 'Votre commande a été reçue par le restaurant/boutique',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    icon: '⏳',
    stepIndex: 0,
  },
  CONFIRMED: {
    key: 'CONFIRMED',
    label: 'Confirmée',
    description: 'La commande a été acceptée et confirmée',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: '✓',
    stepIndex: 1,
  },
  PREPARING: {
    key: 'PREPARING',
    label: 'En préparation',
    description: 'Le chef prépare votre repas aux saveurs gourmandes',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    icon: '🍳',
    stepIndex: 2,
  },
  READY: {
    key: 'READY',
    label: 'Prête',
    description: 'Votre commande est emballée et prête pour le coursier',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    icon: '🛍️',
    stepIndex: 3,
  },
  OUT_FOR_DELIVERY: {
    key: 'OUT_FOR_DELIVERY',
    label: 'En livraison 🛵',
    description: 'Votre coursier QuickLivraison est en route vers votre porte',
    color: '#FF6B00',
    bgColor: '#FFF0E5',
    icon: '🛵',
    stepIndex: 4,
  },
  DELIVERED: {
    key: 'DELIVERED',
    label: 'Livrée avec succès 🎉',
    description: 'Bon appétit ! Commande remise en main propre',
    color: '#00B602',
    bgColor: '#E6F8E6',
    icon: '✅',
    stepIndex: 5,
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Annulée',
    description: 'La commande a été annulée',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    icon: '✕',
    stepIndex: -1,
  },
};
