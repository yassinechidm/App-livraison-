import Logo from '@/components/ui/Logo';
import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function TabIcon({
  emoji,
  focused,
  badgeCount,
}: {
  emoji: string;
  focused: boolean;
  badgeCount?: number;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.iconText, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function ClientTabLayout() {
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = cartService.subscribe((state) => {
      setCartCount(state.itemCount);
    });
    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: Colors.backgroundWhite,
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: Colors.primary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Découvrir',
          headerTitle: () => (
            <Logo size={28} showText={true} />
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧭" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Recherche',
          headerTitle: 'Rechercher un plat, un resto',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          headerTitle: 'Mon Panier Quickly',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛍️" focused={focused} badgeCount={cartCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          headerTitle: 'Mes Commandes',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧾" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Compte',
          headerTitle: 'Mon Compte',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>

  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.backgroundOverlay,
  },
  iconText: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
});
