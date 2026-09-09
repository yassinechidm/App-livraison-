import { useLanguage } from "@/src/context/LanguageContext";
import Colors from "@/constants/Colors";
import { cartService } from "@/services/cart.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { Tabs, useRouter } from "expo-router";
import {
  CircleUserRound,
  Home,
  Search,
  ShoppingCart,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Map with Pin Icon matching Image 1 exactly
function MapPinIcon({ color = "#3C3489" }: { color?: string }) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 2a5 5 0 0 0-5 5c0 3.75 5 8 5 8s5-4.25 5-8a5 5 0 0 0-5-5z" />
      <Circle cx="12" cy="7" r="1.5" />
      <Path d="M4 18l4-2 8 2 4-2" />
    </Svg>
  );
}

// Custom Floating Tab Bar matching Image 1
function FloatingTabBar({
  state,
  navigation,
  cartCount,
  onOpenMap,
  isMapActive,
}: {
  state: any;
  navigation: any;
  cartCount: number;
  onOpenMap: () => void;
  isMapActive: boolean;
}) {
  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.floatingBarContainer} pointerEvents="box-none">
      {/* 1. Home Circle Button */}
      <TouchableOpacity
        style={[
          styles.circlePill,
          currentRouteName === "index" && !isMapActive && styles.circlePillActive,
        ]}
        onPress={() => navigation.navigate("index")}
        activeOpacity={0.85}
      >
        <Home
          size={22}
          color="#3C3489"
          strokeWidth={currentRouteName === "index" && !isMapActive ? 2.5 : 2}
          fill={currentRouteName === "index" && !isMapActive ? "#3C3489" : "none"}
        />
      </TouchableOpacity>

      {/* 2. Map Circle Button (The added element for map) */}
      <TouchableOpacity
        style={[styles.circlePill, isMapActive && styles.circlePillActive]}
        onPress={onOpenMap}
        activeOpacity={0.85}
      >
        <MapPinIcon color={isMapActive ? Colors.cta : "#3C3489"} />
      </TouchableOpacity>

      {/* 3. Center Search Capsule Pill */}
      <TouchableOpacity
        style={[
          styles.searchCapsulePill,
          currentRouteName === "catalog" && styles.searchCapsulePillActive,
        ]}
        onPress={() => navigation.navigate("catalog")}
        activeOpacity={0.85}
      >
        <Search
          size={19}
          color={currentRouteName === "catalog" ? Colors.primary : "#3C3489"}
          strokeWidth={2.4}
        />
        <Text
          style={[
            styles.searchText,
            currentRouteName === "catalog" && styles.searchTextActive,
          ]}
        >
          Search
        </Text>
      </TouchableOpacity>

      {/* 4. Cart / Orders Circle Button */}
      <TouchableOpacity
        style={[
          styles.circlePill,
          (currentRouteName === "orders" || currentRouteName === "cart") &&
            styles.circlePillActive,
        ]}
        onPress={() => navigation.navigate("orders")}
        activeOpacity={0.85}
      >
        <ShoppingCart
          size={21}
          color="#3C3489"
          strokeWidth={
            currentRouteName === "orders" || currentRouteName === "cart"
              ? 2.5
              : 2
          }
        />
        {cartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>
              {cartCount > 9 ? "9+" : cartCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 5. Profile Circle Button */}
      <TouchableOpacity
        style={[
          styles.circlePill,
          currentRouteName === "profile" && styles.circlePillActive,
        ]}
        onPress={() => navigation.navigate("profile")}
        activeOpacity={0.85}
      >
        <CircleUserRound
          size={22}
          color="#3C3489"
          strokeWidth={currentRouteName === "profile" ? 2.5 : 2}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function ClientTabLayout() {
  const [cartCount, setCartCount] = useState(0);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    "Rue Ziri Ibn Atia, 35"
  );

  useEffect(() => {
    return cartService.subscribe((state) => setCartCount(state.itemCount));
  }, []);

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            {...props}
            cartCount={cartCount}
            onOpenMap={() => setIsMapModalVisible(true)}
            isMapActive={isMapModalVisible}
          />
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="catalog" options={{ title: "Discover" }} />
        <Tabs.Screen name="cart" options={{ href: null, title: "Cart" }} />
        <Tabs.Screen name="orders" options={{ title: "Orders" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>

      {/* Direct Global Map Access via the Map Icon */}
      <LocationPickerModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        selectedAddress={selectedAddress}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 26 : 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },

  // Circle Pill (Home, Map, Cart, Profile)
  circlePill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  circlePillActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F7F7FF",
    transform: [{ scale: 1.04 }],
  },

  // Search Center Capsule Pill
  searchCapsulePill: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  searchCapsulePillActive: {
    borderColor: Colors.primary,
    backgroundColor: "#F7F7FF",
    transform: [{ scale: 1.04 }],
  },
  searchText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C3489",
    marginLeft: 8,
  },
  searchTextActive: {
    color: Colors.primary,
    fontWeight: "800",
  },

  // Badge on Cart
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.cta, // #FF4D6D
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});
