import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { Tabs } from 'expo-router';
import { Home, MapPin, Search, ShoppingCart, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTabBarProps {
  state: {
    routes: Array<{ key: string; name: string }>;
    index: number;
  };
  descriptors: Record<string, { options: any }>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string) => void;
  };
  cartCount: number;
}

function CustomTabBar({ state, descriptors, navigation, cartCount }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatingWrapper,
        { bottom: Math.max(insets.bottom, 14) },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.barContainer}>
        {state.routes.map((route: { key: string; name: string }, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const activeColor = Colors.primary;
          const inactiveColor = '#2D3748';
          const iconColor = isFocused ? activeColor : inactiveColor;
          const iconSize = 20;

          // 1. Home
          if (route.name === 'index') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.circleButton, isFocused && styles.circleButtonActive]}
                activeOpacity={0.8}
              >
                <Home
                  size={iconSize}
                  color={iconColor}
                  strokeWidth={isFocused ? 2.7 : 2}
                  fill={isFocused ? Colors.primaryLight : 'none'}
                />
              </TouchableOpacity>
            );
          }

          // 2. Orders / Location Tracking
          if (route.name === 'orders') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.circleButton, isFocused && styles.circleButtonActive]}
                activeOpacity={0.8}
              >
                <MapPin
                  size={iconSize}
                  color={iconColor}
                  strokeWidth={isFocused ? 2.7 : 2}
                  fill={isFocused ? Colors.primaryLight : 'none'}
                />
              </TouchableOpacity>
            );
          }

          // 3. Search (Center Pill Button)
          if (route.name === 'catalog') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.pillButton, isFocused && styles.pillButtonActive]}
                activeOpacity={0.8}
              >
                <Search
                  size={18}
                  color={iconColor}
                  strokeWidth={isFocused ? 2.7 : 2}
                />
                <Text
                  style={[
                    styles.pillText,
                    { color: isFocused ? Colors.primary : Colors.textPrimary },
                  ]}
                >
                  Search
                </Text>
              </TouchableOpacity>
            );
          }

          // 4. Cart
          if (route.name === 'cart') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.circleButton, isFocused && styles.circleButtonActive]}
                activeOpacity={0.8}
              >
                <ShoppingCart
                  size={iconSize}
                  color={iconColor}
                  strokeWidth={isFocused ? 2.7 : 2}
                />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }

          // 5. Profile
          if (route.name === 'profile') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.circleButton, isFocused && styles.circleButtonActive]}
                activeOpacity={0.8}
              >
                <User
                  size={iconSize}
                  color={iconColor}
                  strokeWidth={isFocused ? 2.7 : 2}
                  fill={isFocused ? Colors.primaryLight : 'none'}
                />
              </TouchableOpacity>
            );
          }

          return null;
        })}
      </View>
    </View>
  );
}

export default function ClientTabLayout() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => cartService.subscribe((state) => setCartCount(state.itemCount)), []);

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} cartCount={cartCount} />}
      screenOptions={{
        headerStyle: { backgroundColor: Colors.backgroundWhite },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: Colors.textPrimary },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Découvrir',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          headerTitle: 'Mes commandes',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Recherche',
          headerTitle: 'Rechercher',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          headerTitle: 'Mon panier',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Compte',
          headerTitle: 'Mon compte',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    maxWidth: 480,
    width: '100%',
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  circleButtonActive: {
    borderColor: Colors.primary + '50',
    backgroundColor: '#F7FAFF',
    shadowColor: Colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  pillButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  pillButtonActive: {
    borderColor: Colors.primary + '50',
    backgroundColor: '#F7FAFF',
    shadowColor: Colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.secondary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
