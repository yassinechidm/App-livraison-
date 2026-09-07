import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { DeliveryAddressSelectorProps } from './types';

export const DeliveryAddressSelector: React.FC<DeliveryAddressSelectorProps> = ({
  currentAddress,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <MapPin size={16} color={colors.primary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.deliveryTo}>LIVRER À</Text>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>
            {currentAddress || 'Choisir une adresse'}
          </Text>
          <ChevronDown size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    maxWidth: 220,
  },
  deliveryTo: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  address: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
});

export default DeliveryAddressSelector;
