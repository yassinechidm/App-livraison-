import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Colors from '@/constants/Colors';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export default function Card({ children, style, noPadding = false }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        noPadding ? styles.noPadding : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noPadding: {
    padding: 0,
  },
});
