import React from 'react';
import { Platform } from 'react-native';
import DeliveryMapWeb from './DeliveryMap.web';
import { DeliveryMapProps } from './types';

export const DeliveryMap: React.FC<DeliveryMapProps> = (props) => {
  if (Platform.OS === 'web') {
    return <DeliveryMapWeb {...props} />;
  }

  // Lazy require on native so web bundler never touches react-native-maps
  const DeliveryMapNative = require('./DeliveryMap.native').default;
  return <DeliveryMapNative {...props} />;
};

export default DeliveryMap;
