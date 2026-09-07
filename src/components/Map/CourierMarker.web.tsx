import { borderRadius, colors } from '@/src/theme';
import { Bike } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CourierMarkerProps } from './types';

export const CourierMarkerWeb: React.FC<CourierMarkerProps> = () => {
  return (
    <View style={styles.markerContainer}>
      <View style={styles.pulseRing} />
      <View style={styles.iconCircle}>
        <Bike size={18} color={colors.textInverse} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default CourierMarkerWeb;

