import Colors from "@/constants/Colors";
import { cartService } from "@/services/cart.service";
import { locationStore } from "@/services/location.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { useLanguage } from "@/src/context/LanguageContext";
import { Tabs, useRouter } from "expo-router";
import {
    CircleUserRound,
    Home,
    Map,
    Search,
    ShoppingCart,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Custom Floating Tab Bar with Home, Search, Map, Cart, Profile
function FloatingTabBar({
  state,
  navigation,
  cartCount,
  onOpenMap,
}: {
  state: any;
  navigation: any;
  cartCount: number;
  onOpenMap?: () => void;
}) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const currentRouteName = state.routes[state.index]?.name;
  const bottomOffset = Math.max(
    insets.bottom + 10,
    Platform.OS === "ios" ? 34 : 26,
  );

  return (
    <View
      style={[
        styles.floatingBarContainer,
        { bottom: bottomOffset, pointerEvents: "box-none" as const },
      ]}
    >
      {/* 1. Home Circle Button */}
      <TouchableOpacity
        style={[
          styles.circlePill,
          currentRouteName === "index" && styles.circlePillActive,
        ]}
        onPress={() => navigation.navigate("index")}
        activeOpacity={0.85}
      >
        <Home
          size={21}
          color="#3C3489"
          strokeWidth={currentRouteName === "index" ? 2.5 : 2}
          fill={currentRouteName === "index" ? "#3C3489" : "none"}
        />
      </TouchableOpacity>

      {/* 2. Map Circle Button */}
      <TouchableOpacity
        style={styles.circlePill}
        onPress={onOpenMap}
        activeOpacity={0.85}
      >
        <Map size={21} color="#3C3489" strokeWidth={2} />
      </TouchableOpacity>

      {/* 3. Center Search Capsule Pill (Exact Middle) */}
      <TouchableOpacity
        style={[
          styles.searchCapsulePill,
          currentRouteName === "catalog" && styles.searchCapsulePillActive,
        ]}
        onPress={() => navigation.navigate("catalog")}
        activeOpacity={0.85}
      >
        <Search
          size={18}
          color={currentRouteName === "catalog" ? Colors.primary : "#3C3489"}
          strokeWidth={2.4}
        />
        <Text
          style={[
            styles.searchText,
            currentRouteName === "catalog" && styles.searchTextActive,
          ]}
        >
          {t("nav.search", "Search")}
        </Text>
      </TouchableOpacity>

      {/* 4. Cart Circle Button */}
      <TouchableOpacity
        style={[
          styles.circlePill,
          currentRouteName === "cart" && styles.circlePillActive,
        ]}
        onPress={() => navigation.navigate("cart")}
        activeOpacity={0.85}
      >
        <ShoppingCart
          size={20}
          color="#3C3489"
          strokeWidth={currentRouteName === "cart" ? 2.5 : 2}
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
          size={21}
          color="#3C3489"
          strokeWidth={currentRouteName === "profile" ? 2.5 : 2}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function ClientTabLayout() {
  const { t } = useLanguage();
  const [cartCount, setCartCount] = useState(0);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    "Rue Ziri Ibn Atia, 35",
  );

  const router = useRouter();

  useEffect(() => {
    const unsubCart = cartService.subscribe((state) =>
      setCartCount(state.itemCount),
    );
    const unsubLoc = locationStore.subscribe((addr) =>
      setSelectedAddress(addr),
    );
    return () => {
      unsubCart();
      unsubLoc();
    };
  }, []);

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar
            {...props}
            cartCount={cartCount}
            onOpenMap={() => setIsMapModalVisible(true)}
          />
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: t("nav.home", "Home") }} />
        <Tabs.Screen
          name="catalog"
          options={{ title: t("nav.catalog", "Discover") }}
        />
        <Tabs.Screen name="cart" options={{ title: t("nav.cart", "Cart") }} />
        <Tabs.Screen
          name="orders"
          options={{ href: null, title: t("nav.orders", "Orders") }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t("nav.profile", "Profile") }}
        />
      </Tabs>

      {/* Direct Global Map Access */}
      <LocationPickerModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        selectedAddress={selectedAddress}
        initialViewMode="map"
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          locationStore.setAddress(addr);
          Alert.alert(
            t("location.deliveryAddress", "Adresse de livraison :"),
            `${addr}`,
            [
              {
                text: t("cart.browseCatalog", "Découvrir le catalogue"),
                onPress: () =>
                  router.push("/(app)/(client)/(tabs)/catalog" as any),
              },
              { text: t("common.ok", "OK") },
            ],
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },

  // Circle Pill (Home, Map, Cart, Profile)
  circlePill: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
