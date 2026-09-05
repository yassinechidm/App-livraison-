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
    description: 'Votre commande a été transmise au restaurant',
    color: '#FF9E00',
    bgColor: '#FFF8E6',
    icon: '⏳',
    stepIndex: 0,
  },
  CONFIRMED: {
    key: 'CONFIRMED',
    label: 'Acceptée',
    description: 'Le restaurant a validé votre commande',
    color: '#00CDBC',
    bgColor: '#E8F8F5',
    icon: '✓',
    stepIndex: 1,
  },
  PREPARING: {
    key: 'PREPARING',
    label: 'En cuisine',
    description: 'Vos plats sont en cours de préparation',
    color: '#4D2C5E',
    bgColor: '#F3EDF7',
    icon: '🍳',
    stepIndex: 2,
  },
  READY: {
    key: 'READY',
    label: 'Commande prête',
    description: 'La commande attend la prise en charge par le livreur',
    color: '#00CDBC',
    bgColor: '#E8F8F5',
    icon: '🛍️',
    stepIndex: 3,
  },
  OUT_FOR_DELIVERY: {
    key: 'OUT_FOR_DELIVERY',
    label: 'Livreur en route 🛵',
    description: 'Votre livreur Deliveroo approche de votre adresse',
    color: '#00CDBC',
    bgColor: '#E8F8F5',
    icon: '🛵',
    stepIndex: 4,
  },
  DELIVERED: {
    key: 'DELIVERED',
    label: 'Livrée 🎉',
    description: 'Commande livrée ! Régalez-vous bien',
    color: '#00B67A',
    bgColor: '#E6F8F2',
    icon: '✅',
    stepIndex: 5,
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Annulée',
    description: 'Cette commande a été annulée',
    color: '#FF4D4D',
    bgColor: '#FFF0F0',
    icon: '✕',
    stepIndex: -1,
  },
};

