import Colors from "@/constants/Colors";
import { cartService } from "@/services/cart.service";
import { useLanguage } from "@/src/context/LanguageContext";
import { CartState } from "@/types/cart.types";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CartFloatingButtonProps {
  bottomOffset?: number;
}

export default function CartFloatingButton({
  bottomOffset,
}: CartFloatingButtonProps) {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
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

  // Calculate bottom offset to never overlap with bottom navigation bar or safe insets
  const defaultOffset =
    bottomOffset !== undefined
      ? bottomOffset
      : Math.max(insets.bottom + 12, Platform.OS === "ios" ? 24 : 16);

  return (
    <View
      style={[styles.floatingContainer, { bottom: defaultOffset }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.button, isRTL && { flexDirection: "row-reverse" }]}
        onPress={() => router.push("/(app)/(client)/(tabs)/cart" as any)}
        activeOpacity={0.9}
      >
        <View
          style={[styles.leftRow, isRTL && { flexDirection: "row-reverse" }]}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartState.itemCount}</Text>
          </View>
          <Text style={styles.centerText}>
            {t("cart.viewCart", "Voir le panier")}
          </Text>
        </View>

        <View
          style={[styles.rightRow, isRTL && { flexDirection: "row-reverse" }]}
        >
          <Text style={styles.totalText}>{cartState.total.toFixed(2)} MAD</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cta,
    borderRadius: 26,
    paddingVertical: 13,
    paddingHorizontal: 18,
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.cta,
  },
  centerText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
