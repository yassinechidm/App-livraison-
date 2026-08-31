import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ParcelStatus } from '@/types/parcel.types';
import { PARCEL_STATUSES } from '@/constants/mockData';

interface StatusBadgeProps {
  status: ParcelStatus;
  showIcon?: boolean;
}

export default function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const statusInfo = PARCEL_STATUSES.find((s) => s.key === status);

  if (!statusInfo) return null;

  return (
    <View style={[styles.badge, { backgroundColor: statusInfo.bgColor }]}>
      {showIcon && <Text style={styles.icon}>{statusInfo.icon}</Text>}
      <Text style={[styles.label, { color: statusInfo.color }]}>
        {statusInfo.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
