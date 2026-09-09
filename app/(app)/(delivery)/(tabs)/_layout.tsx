import Colors from "@/constants/Colors";
import { Tabs } from "expo-router";
import { Navigation, PackageSearch, UserCircle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Icon
        size={20}
        strokeWidth={focused ? 2.7 : 2}
        color={focused ? Colors.primary : Colors.tabIconDefault}
      />
    </View>
  );
}

export default function DeliveryTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: Colors.backgroundWhite },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 18,
          color: Colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Disponibles",
          headerTitle: "Commandes Disponibles",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={PackageSearch} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: "En Cours",
          headerTitle: "Livraisons en Cours",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Navigation} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerTitle: "Profil Livreur",
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={UserCircle} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopColor: Colors.borderLight,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 7,
    elevation: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  iconContainer: {
    width: 36,
    height: 30,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerActive: { backgroundColor: Colors.primaryMuted },
});
