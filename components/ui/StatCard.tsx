import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export default function StatCard({
  icon,
  value,
  label,
  color = Colors.primary,
  bgColor = Colors.backgroundOverlay,
  style,
}: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
