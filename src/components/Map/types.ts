import { StyleProp, ViewStyle } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryMapProps {
  courierLocation?: Coordinates;
  deliveryLocation: Coordinates;
  restaurantLocation?: Coordinates;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
}

export interface CourierMarkerProps {
  coordinate: Coordinates;
  heading?: number;
}
