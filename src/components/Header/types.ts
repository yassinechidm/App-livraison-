import { StyleProp, ViewStyle } from 'react-native';
import { Restaurant } from '@/src/types/restaurant.types';

export interface RestaurantHeaderProps {
  restaurant: Restaurant;
  onBackPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface DeliveryAddressSelectorProps {
  currentAddress: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}
