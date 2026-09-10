import Card from "@/components/ui/Card";
import QuantitySelector from "@/components/ui/QuantitySelector";
import Colors from "@/constants/Colors";
import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";
import { productService } from "@/services/product.service";
import { useLanguage } from "@/src/context/LanguageContext";
import { AnyPurchasableItem, CartState } from "@/types/cart.types";
import { Order, ORDER_STATUS_CONFIG } from "@/types/order.types";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ArrowRight,
    ChevronRight,
    Package,
    ShieldCheck,
    ShoppingBag,
    Truck
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClientOrdersView } from "./orders";

const CROSS_SELL_SUGGESTIONS: AnyPurchasableItem[] = [
  {
    id: "cross-coca",
    name: "Coca-Cola Canette 33cl",
    description: "Boisson fraîche pétillante",
    price: 10,
    image_url:
      "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&auto=format&fit=crop&q=80",
    is_available: true,
    category_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "cross-eau",
    name: "Eau Minérale Ain Ifrane 50cl",
    description: "Eau minérale naturelle pure",
    price: 6,
    image_url:
      "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&auto=format&fit=crop&q=80",
    is_available: true,
    category_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "cross-tiramisu",
    name: "Tiramisu Spéculoos",
    description: "Dessert gourmand maison",
    price: 25,
    image_url:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&auto=format&fit=crop&q=80",
    is_available: true,
    category_id: "11111111-1111-1111-1111-111111111111",
  },
  {
    id: "cross-cheesecake",
    name: "Cheesecake Fruits Rouges",
    description: "Dessert onctueux et fruité",
    price: 28,
    image_url:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=200&auto=format&fit=crop&q=80",
    is_available: true,
    category_id: "11111111-1111-1111-1111-111111111111",
  },
];

export default function CartScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [mainTab, setMainTab] = useState<"cart" | "orders">("cart");
  const [cartState, setCartState] = useState<CartState>(cartService.getState());
  const [orders, setOrders] = useState<Order[]>([]);
  const [foodCategoryIds, setFoodCategoryIds] = useState<Set<string>>(
    new Set(["11111111-1111-1111-1111-111111111111"]),
  );

  useEffect(() => {
    productService
      .getCategories()
      .then((categories) => {
        const ids = new Set<string>(["11111111-1111-1111-1111-111111111111"]);
        categories.forEach((cat) => {
          const lowerName = (cat.name || "").toLowerCase();
          if (
            lowerName.includes("food") ||
            lowerName.includes("resto") ||
            lowerName.includes("restaurant")
          ) {
            ids.add(cat.id);
          }
        });
        setFoodCategoryIds(ids);
      })
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const list = await orderService.getClientOrders();
      setOrders(list);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const unsubscribeOrders = orderService.subscribe(() => {
      loadOrders();
    });
    const unsubscribeCart = cartService.subscribe((state) => {
      setCartState(state);
    });
    return () => {
      unsubscribeOrders();
      unsubscribeCart();
    };
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      setCartState(cartService.getState());
      loadOrders();
    }, [loadOrders]),
  );

  const activeOrdersCount = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  ).length;

  const renderTopSegmentedHeader = () => {
    const isCartActive = mainTab === "cart";
    const isOrdersActive = mainTab === "orders";

    return (
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View
          style={[
            styles.segmentedRow,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          <TouchableOpacity
            style={[styles.segmentBtn, isCartActive && styles.segmentBtnActive]}
            onPress={() => setMainTab("cart")}
            activeOpacity={0.8}
          >
            <ShoppingBag
              size={16}
              color={isCartActive ? "#FFFFFF" : "#5C5BDB"}
            />
            <Text
              style={[
                styles.segmentBtnText,
                isCartActive && styles.segmentBtnTextActive,
              ]}
            >
              {t("cart.title", "Mon Panier")} ({cartState.itemCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              isOrdersActive && styles.segmentBtnActive,
            ]}
            onPress={() => setMainTab("orders")}
            activeOpacity={0.8}
          >
            <Package size={16} color={isOrdersActive ? "#FFFFFF" : "#5C5BDB"} />
            <Text
              style={[
                styles.segmentBtnText,
                isOrdersActive && styles.segmentBtnTextActive,
              ]}
            >
              {t("orders.title", "Commandes")}{" "}
              {orders.length > 0 ? `(${orders.length})` : ""}
            </Text>
            {activeOrdersCount > 0 && (
              <View style={styles.activeBadgePill}>
                <Text style={styles.activeBadgeText}>{activeOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Render Orders View if user switched to Orders tab
  if (mainTab === "orders") {
    return (
      <View style={styles.container}>
        {renderTopSegmentedHeader()}
        <ClientOrdersView embedded={true} hideHeader={true} />
      </View>
    );
  }

  // Render Cart View (with Empty state + Recent Orders)
  if (cartState.items.length === 0) {
    return (
      <View style={styles.container}>
        {renderTopSegmentedHeader()}

        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ShoppingBag size={48} color="#5C5BDB" strokeWidth={1.6} />
            </View>
            <Text style={styles.emptyTitle}>
              {t("cart.emptyTitle", "Votre panier est vide")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t(
                "cart.emptySubtitle",
                "Ajoutez de délicieux plats, des sandwichs ou des courses pour commencer votre commande à Oujda !",
              )}
            </Text>
            <TouchableOpacity
              style={styles.emptyButtonPill}
              onPress={() =>
                router.push("/(app)/(client)/(tabs)/catalog" as any)
              }
              activeOpacity={0.85}
            >
              <Text style={styles.emptyButtonText}>
                {t("cart.browseCatalog", "Découvrir le catalogue")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Orders Section directly on Cart Page */}
          {orders.length > 0 && (
            <View style={styles.recentOrdersSection}>
              <View style={styles.recentOrdersHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Package size={18} color="#3C3489" />
                  <Text style={styles.recentOrdersTitle}>
                    {t("orders.recentOrders", "Vos Commandes")} ({orders.length}
                    )
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMainTab("orders")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Text style={styles.viewAllOrdersText}>
                    {t("orders.viewAll", "Voir tout")}
                  </Text>
                  <ArrowRight size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {orders.slice(0, 3).map((order) => {
                const statusCfg = ORDER_STATUS_CONFIG[order.status];
                const isOngoing =
                  order.status !== "DELIVERED" && order.status !== "CANCELLED";

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.recentOrderCard}
                    onPress={() => setMainTab("orders")}
                    activeOpacity={0.88}
                  >
                    <View style={styles.recentOrderTop}>
                      <View>
                        <Text style={styles.recentOrderNum}>
                          Commande #{order.order_number}
                        </Text>
                        <Text style={styles.recentOrderDate}>
                          {new Date(order.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.recentStatusBadge,
                          { backgroundColor: statusCfg.bgColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.recentStatusText,
                            { color: statusCfg.color },
                          ]}
                        >
                          {statusCfg.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recentOrderItems}>
                      <Text style={styles.recentItemsSummary} numberOfLines={1}>
                        {order.items && order.items.length > 0
                          ? order.items
                              .map((i) => `${i.quantity}x ${i.product_name}`)
                              .join(", ")
                          : "Articles de la commande"}
                      </Text>
                    </View>

                    <View style={styles.recentOrderBottom}>
                      <Text style={styles.recentOrderPrice}>
                        {order.total.toFixed(2)} DH
                      </Text>
                      <View style={styles.recentOrderTrackBtn}>
                        <Text style={styles.recentOrderTrackText}>
                          {isOngoing ? "Suivi en direct" : "Détails"}
                        </Text>
                        <ChevronRight size={14} color={Colors.primary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Free delivery progress calculation
  const threshold = cartState.freeDeliveryThreshold || 100;
  const progress = Math.min(1, cartState.subtotal / threshold);
  const remainingForFree = Math.max(0, threshold - cartState.subtotal);
  const isFreeDelivery =
    cartState.subtotal >= threshold && cartState.deliveryMode === "DELIVERY";

  // Check if any cart item is from the Food category or from a Restaurant
  const hasFoodItem = cartState.items.some((item) => {
    const prod = item.product;
    // 1. Items from a restaurant (all restaurant dishes are food)
    if (prod.restaurant_id || item.item?.restaurant_id) return true;
    // 2. Items from the food & restaurant category
    if (prod.category_id && foodCategoryIds.has(prod.category_id)) return true;
    // 3. Fallback check on category string
    const catStr = (prod.category_id || "").toLowerCase();
    return catStr.includes("food") || catStr.includes("resto");
  });

  const availableSuggestions = CROSS_SELL_SUGGESTIONS.filter(
    (sug) => !cartState.items.some((ci) => ci.product.id === sug.id),
  );

  return (
    <View style={styles.container}>
      {renderTopSegmentedHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Active Order Banner if ongoing order exists */}
        {activeOrdersCount > 0 && (
          <TouchableOpacity
            style={styles.activeOrderBanner}
            onPress={() => setMainTab("orders")}
            activeOpacity={0.85}
          >
            <View style={styles.activeBannerPulse}>
              <Truck size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>
                {activeOrdersCount === 1
                  ? "1 course en cours de livraison"
                  : `${activeOrdersCount} courses en cours de livraison`}
              </Text>
              <Text style={styles.activeBannerSub}>
                Touchez pour suivre le livreur sur la carte en direct
              </Text>
            </View>
            <ChevronRight size={18} color="#5C5BDB" />
          </TouchableOpacity>
        )}
        {/* Free Delivery Animated Progress Gauge */}
        <Card style={styles.gaugeCard}>
          <View
            style={[
              styles.gaugeHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text style={styles.gaugeTitle}>
              {isFreeDelivery
                ? t("cart.freeDeliveryUnlocked", "Livraison Gratuite activée !")
                : t("cart.freeDelivery", "Livraison Gratuite")}
            </Text>
            <Text style={styles.gaugeSub}>
              {isFreeDelivery
                ? t("cart.freeDeliveryOffered", "Frais de livraison offerts")
                : t(
                    "cart.remainingForFree",
                    "Plus que {amount} MAD pour la livraison offerte",
                  ).replace("{amount}", remainingForFree.toFixed(2))}
            </Text>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: isFreeDelivery
                    ? Colors.secondary
                    : Colors.primary,
                },
              ]}
            />
          </View>

          <Text
            style={[styles.gaugeFooterText, isRTL && { textAlign: "right" }]}
          >
            {isFreeDelivery
              ? t(
                  "cart.freeDeliveryOffered",
                  "Profitez de la livraison offerte sur votre commande à Oujda !",
                )
              : t(
                  "cart.reachThreshold",
                  "Atteignez 100,00 MAD pour bénéficier de la livraison 100% offerte.",
                )}
          </Text>
        </Card>

        {/* Header summary */}
        <View
          style={[styles.headerBox, isRTL && { flexDirection: "row-reverse" }]}
        >
          <Text style={styles.headerTitle}>
            {t("cart.selectedItems", "Articles sélectionnés")} (
            {cartState.itemCount})
          </Text>
          <TouchableOpacity onPress={() => cartService.clearCart()}>
            <Text style={styles.clearCartText}>
              {t("cart.emptyCart", "Vider le panier")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items List with Customizations */}
        {cartState.items.map((item, index) => {
          const itemIdentifier = item.cart_item_id || item.product.id;
          const unitPrice = item.unit_total_price ?? item.product.price;
          const totalItemPrice = unitPrice * item.quantity;

          return (
            <Card key={`${itemIdentifier}_${index}`} style={styles.itemCard}>
              <View
                style={[
                  styles.itemRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                {item.product.image_url && (
                  <Image
                    source={{ uri: item.product.image_url }}
                    style={styles.itemThumb}
                    resizeMode="cover"
                  />
                )}

                <View
                  style={[
                    styles.itemDetails,
                    isRTL && { alignItems: "flex-end" },
                  ]}
                >
                  <Text
                    style={[styles.itemName, isRTL && { textAlign: "right" }]}
                  >
                    {item.product.name}
                  </Text>

                  {/* Display Selected Customizations */}
                  {item.selected_customizations &&
                    item.selected_customizations.length > 0 && (
                      <View style={styles.customList}>
                        {item.selected_customizations.map((c, ci) => (
                          <Text
                            key={ci}
                            style={[
                              styles.customText,
                              isRTL && { textAlign: "right" },
                            ]}
                          >
                            • {c.optionName}{" "}
                            {c.price > 0 ? `(+${c.price} DH)` : ""}
                          </Text>
                        ))}
                      </View>
                    )}

                  {/* Display Special Note */}
                  {item.special_instructions && (
                    <Text
                      style={[
                        styles.specialNoteText,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {t("cart.specialNote", "Note :")} "
                      {item.special_instructions}"
                    </Text>
                  )}

                  <Text style={styles.itemTotalPrice}>
                    {totalItemPrice.toFixed(2)} MAD
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <QuantitySelector
                    quantity={item.quantity}
                    onIncrement={() =>
                      cartService.setQuantity(itemIdentifier, item.quantity + 1)
                    }
                    onDecrement={() =>
                      cartService.setQuantity(itemIdentifier, item.quantity - 1)
                    }
                    size="small"
                  />
                  <TouchableOpacity
                    onPress={() => cartService.removeItem(itemIdentifier)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>
                      {t("cart.delete", "Supprimer")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Cross-Selling Suggestions Carousel - Only shown if food category is selected */}
        {hasFoodItem && availableSuggestions.length > 0 && (
          <View style={styles.crossSellSection}>
            <Text
              style={[styles.crossSellHeading, isRTL && { textAlign: "right" }]}
            >
              {t(
                "cart.crossSellHeading",
                "Envie d'une boisson ou d'un dessert ?",
              )}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.crossSellScroll}
            >
              {availableSuggestions.map((suggestion) => (
                <View key={suggestion.id} style={styles.crossSellCard}>
                  <Image
                    source={{ uri: suggestion.image_url }}
                    style={styles.crossSellImg}
                    resizeMode="cover"
                  />
                  <Text style={styles.crossSellName} numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  <View
                    style={[
                      styles.crossSellBottom,
                      isRTL && { flexDirection: "row-reverse" },
                    ]}
                  >
                    <Text style={styles.crossSellPrice}>
                      {suggestion.price.toFixed(2)} MAD
                    </Text>
                    <TouchableOpacity
                      style={styles.crossSellAddBtn}
                      onPress={() => cartService.addItem(suggestion, 1)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.crossSellAddText}>
                        {t("cart.addBtn", "+ Ajouter")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Price Breakdown Card */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, isRTL && { textAlign: "right" }]}>
            {t("cart.paymentDetails", "Détail du paiement")}
          </Text>

          <View
            style={[
              styles.summaryRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text style={styles.summaryLabel}>
              {t("cart.subtotal", "Sous-total")} ({cartState.itemCount}{" "}
              {cartState.itemCount > 1
                ? t("cart.articles", "articles")
                : t("cart.article", "article")}
              )
            </Text>
            <Text style={styles.summaryValue}>
              {cartState.subtotal.toFixed(2)} MAD
            </Text>
          </View>

          <View
            style={[
              styles.summaryRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text style={styles.summaryLabel}>
              {t("cart.deliveryFee", "Frais de livraison (Oujda Express)")}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                isFreeDelivery && {
                  color: Colors.secondary,
                  fontWeight: "800",
                },
              ]}
            >
              {isFreeDelivery
                ? t("cart.free", "Gratuit (Promo 100 DH)")
                : `${cartState.deliveryFee.toFixed(2)} MAD`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View
            style={[
              styles.summaryRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Text style={styles.totalLabel}>
              {t("cart.totalTTC", "Total TTC")}
            </Text>
            <Text style={styles.totalValue}>
              {cartState.total.toFixed(2)} MAD
            </Text>
          </View>
        </Card>

        {/* Guarantee badge */}
        <View
          style={[
            styles.guaranteeBox,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          <ShieldCheck size={20} color="#5C5BDB" strokeWidth={2.2} />
          <Text style={[styles.guaranteeText, isRTL && { textAlign: "right" }]}>
            {t(
              "cart.guarantee",
              "Commande préparée à la minute à Oujda. Paiement sécurisé en espèces à la livraison ou en ligne.",
            )}
          </Text>
        </View>

        {/* Checkout CTA Deliveroo */}
        <TouchableOpacity
          style={styles.checkoutButtonPill}
          onPress={() => router.push("/(app)/(client)/checkout" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutButtonText}>
            {t("cart.checkoutBtn", "Passer commande")} •{" "}
            {cartState.total.toFixed(2)} MAD
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafe: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 12 : 6,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  screenHeaderTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  screenHeaderSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  modeSwitcherContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundWhite,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },

  modeTabEmoji: {
    fontSize: 20,
  },
  modeTabTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  modeTabTitleActive: {
    color: Colors.primary,
  },
  modeTabSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  gaugeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  gaugeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gaugeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
  },
  gaugeSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5C5BDB",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  gaugeFooterText: {
    fontSize: 11,
    color: "#7F77DD",
  },
  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  clearCartText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "700",
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F7F7FF",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 2,
  },
  customList: {
    marginVertical: 3,
  },
  customText: {
    fontSize: 11,
    color: "#7F77DD",
    lineHeight: 14,
  },
  specialNoteText: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#5C5BDB",
    marginTop: 2,
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#5C5BDB",
    marginTop: 4,
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  deleteBtn: {
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  crossSellSection: {
    marginVertical: 12,
  },
  crossSellHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 8,
  },
  crossSellScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  crossSellCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  crossSellImg: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    marginBottom: 6,
  },
  crossSellName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 6,
  },
  crossSellBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  crossSellPrice: {
    fontSize: 12,
    fontWeight: "900",
    color: "#5C5BDB",
  },
  crossSellAddBtn: {
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  crossSellAddText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5C5BDB",
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#7F77DD",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3C3489",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3C3489",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#5C5BDB",
  },
  guaranteeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  guaranteeText: {
    fontSize: 11,
    color: "#3C3489",
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  checkoutButtonPill: {
    backgroundColor: Colors.cta,
    borderRadius: 28,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingBottom: 110,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F7F7FF",
    borderWidth: 1.5,
    borderColor: "#CECBF6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    fontWeight: "500",
  },
  emptyButtonPill: {
    backgroundColor: Colors.cta,
    borderRadius: 28,
    height: 48,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyScrollContent: {
    paddingBottom: 120,
  },
  segmentedRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F7F7FF",
    borderWidth: 1.5,
    borderColor: "#E0E7FF",
    position: "relative",
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5C5BDB",
  },
  segmentBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  activeBadgePill: {
    backgroundColor: Colors.cta,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  recentOrdersSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  recentOrdersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentOrdersTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3C3489",
  },
  viewAllOrdersText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  recentOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  recentOrderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentOrderNum: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  recentOrderDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  recentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  recentOrderItems: {
    marginBottom: 10,
  },
  recentItemsSummary: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  recentOrderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  recentOrderPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3C3489",
  },
  recentOrderTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recentOrderTrackText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  activeBannerPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E1B4B",
  },
  activeBannerSub: {
    fontSize: 11,
    color: "#4338CA",
    marginTop: 1,
  },
});
