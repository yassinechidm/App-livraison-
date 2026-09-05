import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { CartState } from '@/types/cart.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
        activeOpacity={0.92}
      >
        <View style={styles.leftRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartState.itemCount}</Text>
          </View>
          <Text style={styles.centerText}>Voir le panier</Text>
        </View>

        <Text style={styles.totalText}>{cartState.total.toFixed(2)} DH</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  centerText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
});

