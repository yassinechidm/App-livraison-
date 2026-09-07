import { StyleProp, ViewStyle } from 'react-native';
import { Restaurant, MenuItem, CategoryItem } from '@/src/types/restaurant.types';
import { Order } from '@/src/types/order.types';
import { Address } from '@/src/types/order.types';

export interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'featured' | 'standard' | 'compact';
}

export interface ProductCardProps {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
  onAddPress?: (item: MenuItem) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'grid' | 'row';
}

export interface CategoryCardProps {
  category: CategoryItem;
  isSelected?: boolean;
  onPress: (category: CategoryItem) => void;
  style?: StyleProp<ViewStyle>;
}

export interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onReorderPress?: (order: Order) => void;
  style?: StyleProp<ViewStyle>;
}

export interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect: (address: Address) => void;
  onEdit?: (address: Address) => void;
  style?: StyleProp<ViewStyle>;
}
