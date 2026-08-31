import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import Colors from '@/constants/Colors';
import Logo from '@/components/ui/Logo';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.iconText, { opacity: focused ? 1 : 0.6 }]}>{emoji}</Text>
    </View>
  );
}

export default function AdminTabLayout() {
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
          title: 'Dashboard',
          headerTitle: '👑 Admin Dashboard',
          headerLeft: () => (
            <View style={{ marginLeft: 16 }}>
              <Logo size={28} rounded={false} imageStyle={{ borderRadius: 8 }} />
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          headerTitle: 'Gestion des Commandes',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits',
          headerTitle: 'Catalogue & Stocks',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🍔" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Catégories',
          headerTitle: 'Gestion des Catégories',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗂️" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Admin',
          headerTitle: 'Profil Administrateur',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👑" focused={focused} />
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
});
