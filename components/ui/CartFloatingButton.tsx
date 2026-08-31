import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { CartState } from '@/types/cart.types';

export default function CartFloatingButton() {
  const router = useRouter();
  const [cartState, setCartState] = useState<CartState>(cartService.getState());

  useEffect(() => {
    const unsubscribe = cartService.subscribe((state) => {
      setCartState(state);
    });
    return unsubscribe;
  }, []);

  if (cartState.itemCount === 0) {
    return null;
  }

  return (
    <View style={styles.floatingContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(app)/(client)/(tabs)/cart' as any)}
        activeOpacity={0.9}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartState.itemCount}</Text>
        </View>

        <Text style={styles.centerText}>Voir mon panier</Text>

        <View style={styles.totalBox}>
          <Text style={styles.totalText}>{cartState.total.toFixed(2)} DH</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.white,
  },
  centerText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  totalBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
});
