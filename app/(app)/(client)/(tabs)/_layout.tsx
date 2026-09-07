import Logo from '@/components/ui/Logo';
import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { CircleUserRound, Home, ReceiptText, Search, ShoppingBag } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function TabIcon({ Icon, focused, badgeCount }: { Icon: any; focused: boolean; badgeCount?: number }) {
  return <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Icon size={20} strokeWidth={focused ? 2.7 : 2} color={focused ? Colors.primary : Colors.tabIconDefault} />
    {!!badgeCount && <View style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text></View>}
  </View>;
}

export default function ClientTabLayout() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => cartService.subscribe((state) => setCartCount(state.itemCount)), []);

  return <Tabs screenOptions={{
    tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.tabIconDefault,
    tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel,
    headerStyle: { backgroundColor: Colors.backgroundWhite }, headerTintColor: Colors.textPrimary,
    headerTitleStyle: { fontWeight: '800', fontSize: 18, color: Colors.textPrimary }, headerShadowVisible: false,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Découvrir', headerShown: false, tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }} />
    <Tabs.Screen name="catalog" options={{ title: 'Recherche', headerTitle: 'Rechercher', tabBarIcon: ({ focused }) => <TabIcon Icon={Search} focused={focused} /> }} />
    <Tabs.Screen name="cart" options={{ title: 'Panier', headerTitle: 'Mon panier', tabBarIcon: ({ focused }) => <TabIcon Icon={ShoppingBag} focused={focused} badgeCount={cartCount} /> }} />
    <Tabs.Screen name="orders" options={{ title: 'Commandes', headerTitle: 'Mes commandes', tabBarIcon: ({ focused }) => <TabIcon Icon={ReceiptText} focused={focused} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Compte', headerTitle: 'Mon compte', tabBarIcon: ({ focused }) => <TabIcon Icon={CircleUserRound} focused={focused} /> }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: Colors.tabBarBackground, borderTopColor: Colors.borderLight, borderTopWidth: 1, height: 68, paddingBottom: 10, paddingTop: 7, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 10 },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  iconContainer: { width: 36, height: 30, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconContainerActive: { backgroundColor: Colors.primaryMuted },
  badge: { position: 'absolute', top: -3, right: -5, backgroundColor: Colors.secondary, borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.white },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: '900' },
});
