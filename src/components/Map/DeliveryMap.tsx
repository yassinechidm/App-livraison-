import React from 'react';
import { Platform } from 'react-native';
import { DeliveryMapProps } from './types';
import DeliveryMapWeb from './DeliveryMap.web';

export const DeliveryMap: React.FC<DeliveryMapProps> = (props) => {
  if (Platform.OS === 'web') {
    return <DeliveryMapWeb {...props} />;
  }

  // Lazy require on native so web bundler never touches react-native-maps
  const DeliveryMapNative = require('./DeliveryMap.native').default;
  return <DeliveryMapNative {...props} />;
};

export default DeliveryMap;
