import React from 'react';
import { Platform } from 'react-native';
import CourierMarkerWeb from './CourierMarker.web';
import { CourierMarkerProps } from './types';

export const CourierMarker: React.FC<CourierMarkerProps> = (props) => {
  if (Platform.OS === 'web') {
    return <CourierMarkerWeb {...props} />;
  }

  // Lazy require on native
  const CourierMarkerNative = require('./CourierMarker.native').default;
  return <CourierMarkerNative {...props} />;
};

export default CourierMarker;
