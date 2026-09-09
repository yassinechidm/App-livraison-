import Colors from "@/constants/Colors";
import { Tabs } from "expo-router";
import { Navigation, PackageSearch, UserCircle } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Icon
        size={20}
        strokeWidth={focused ? 2.6 : 2}
        color={focused ? "#5C5BDB" : "#7F77DD"}
      />
    </View>
  );
}

export default function DeliveryTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5C5BDB",
        tabBarInactiveTintColor: "#7F77DD",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTintColor: "#3C3489",
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 18,
          color: "#3C3489",
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
          headerShown: false,
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
    backgroundColor: "#FFFFFF",
    borderTopColor: "#CECBF6",
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 7,
    elevation: 8,
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  iconContainer: {
    width: 36,
    height: 30,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerActive: { backgroundColor: "rgba(92, 91, 219, 0.12)" },
});
