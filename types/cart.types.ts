import { Product } from './product.types';
import { MenuItem } from './restaurant.types';

export type AnyPurchasableItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id?: string;
  restaurant_id?: string;
  stock?: number;
};

export interface SelectedCustomization {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cart_item_id?: string; // unique id in cart taking into account customization combinations
  product: AnyPurchasableItem;
  quantity: number;
  selected_customizations?: SelectedCustomization[];
  special_instructions?: string;
  unit_total_price?: number; // base price + sum of options
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryMode: 'DELIVERY' | 'PICKUP';
  freeDeliveryThreshold: number; // 300 MAD
  total: number;
  itemCount: number;
  freeDeliveryReason?: 'threshold' | 'loyalty' | null; // why delivery is free
}
