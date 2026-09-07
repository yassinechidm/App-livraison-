import { MenuItem } from './restaurant.types';

export interface CartItem {
  id: string;
  item: MenuItem;
  quantity: number;
  selected_options_text?: string;
  special_instructions?: string;
  item_total: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  restaurantId?: string;
  restaurantName?: string;
}
