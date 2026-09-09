import Card from "@/components/ui/Card";
import OrderTimeline from "@/components/ui/OrderTimeline";
import Colors from "@/constants/Colors";
import { liveLocationService } from "@/services/liveLocation.service";
import { orderService } from "@/services/order.service";
import { LiveTrackingMap } from "@/src/components/LiveTrackingMap";
import { useLanguage } from "@/src/context/LanguageContext";
import { Order, ORDER_STATUS_CONFIG } from "@/types/order.types";
import { useRouter } from "expo-router";
import {
    Bike,
    ChevronDown,
    ChevronUp,
    Package,
    Phone,
    RotateCcw,
    ShoppingBag,
    ShoppingCart,
    Star,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Linking,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClientOrdersScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [ratingCourierOrder, setRatingCourierOrder] = useState<Order | null>(
    null,
  );
  const [courierStars, setCourierStars] = useState(5);
  const [courierComment, setCourierComment] = useState("");
  const [courierSelectedTags, setCourierSelectedTags] = useState<string[]>([]);
  const [isSubmittingCourierRating, setIsSubmittingCourierRating] =
    useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"in_progress" | "history">(
    "in_progress",
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    loadOrders();
    const unsubscribe = orderService.subscribe(() => {
      loadOrders();
    });

    const unsubscribeLocation =
      liveLocationService.subscribeToAllActiveLocations((update) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === update.order_id
              ? {
                  ...o,
                  courier_lat: update.courier_lat,
                  courier_lng: update.courier_lng,
                }
              : o,
          ),
        );
      });

    return () => {
      unsubscribe();
      unsubscribeLocation();
    };
  }, []);

  async function loadOrders() {
    const list = await orderService.getClientOrders();
    setOrders(list);
    const active = list.find(
      (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
    );
    if (active) {
      setExpandedOrderId(active.id);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  async function handleReorder(order: Order) {
    await orderService.reorder(order);
    Alert.alert(
      "Panier mis à jour 🛒",
      "Tous les articles de cette commande ont été ajoutés à votre panier !",
      [
        {
          text: "Voir mon panier",
          onPress: () => router.push("/(app)/(client)/(tabs)/cart" as any),
        },
      ],
    );
  }

  function handleOpenCourierRating(order: Order) {
    setRatingCourierOrder(order);
    setCourierStars(order.courier_rating || 5);
    setCourierComment(order.courier_review_text || "");
    setCourierSelectedTags(order.courier_tags || []);
  }

  function toggleCourierTag(tag: string) {
    setCourierSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmitCourierRating() {
    if (!ratingCourierOrder) return;
    setIsSubmittingCourierRating(true);
    try {
      await orderService.rateCourier(
        ratingCourierOrder.id,
        courierStars,
        courierComment.trim() || undefined,
        courierSelectedTags.length > 0 ? courierSelectedTags : undefined,
      );
      Alert.alert(
        t("courierRating.thankYou", "Merci pour votre avis ! ⭐"),
        t(
          "courierRating.thankYouMsg",
          "Votre évaluation aide notre livreur partenaire à maintenir un service de qualité à Oujda.",
        ),
      );
      setRatingCourierOrder(null);
      await loadOrders();
    } catch {
      Alert.alert(
        t("common.error", "Erreur"),
        "Impossible d'enregistrer votre avis sur le livreur.",
      );
    } finally {
      setIsSubmittingCourierRating(false);
    }
  }

  function handleOpenRating(order: Order) {
    setRatingOrder(order);
    setSelectedStars(order.rating || 5);
    setReviewComment(order.review_text || "");
  }

  async function handleSubmitRating() {
    if (!ratingOrder) return;
    setIsSubmittingRating(true);
    try {
      await orderService.rateOrder(
        ratingOrder.id,
        selectedStars,
        reviewComment.trim() || undefined,
      );
      Alert.alert(
        "Merci pour votre avis ! ⭐",
        "Votre note a été enregistrée avec succès.",
      );
      setRatingOrder(null);
      await loadOrders();
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer votre avis.");
    } finally {
      setIsSubmittingRating(false);
    }
  }

  function handleCallDelivery(phone?: string) {
    if (!phone) {
      Alert.alert(
        "Téléphone",
        "Numéro du livreur non disponible pour l'instant.",
      );
      return;
    }
    Linking.openURL(`tel:${phone}`);
  }

  function handleCancelOrder(order: Order) {
    Alert.alert(
      "Annuler la commande",
      "Êtes-vous sûr de vouloir annuler cette commande ?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await orderService.cancelOrder(order.id);
              Alert.alert("Commande annulée", "Votre commande a été annulée.");
              await loadOrders();
            } catch {
              Alert.alert("Erreur", "Impossible d'annuler la commande.");
            }
          },
        },
      ],
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
  );
  const historyOrders = orders.filter((o) => o.status === "DELIVERED");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Screen Title (Screenshot #2 & #4) ── */}
      <View style={styles.headerTitleRow}>
        <Text style={styles.mainTitle}>{t("orders.title", "Orders")}</Text>
      </View>

      {/* ── Segmented Top Tabs: In progress | History (Screenshot #2 & #4) ── */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("in_progress")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "in_progress" && styles.tabButtonTextActive,
            ]}
          >
            In progress
          </Text>
          {activeTab === "in_progress" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "history" && styles.tabButtonTextActive,
            ]}
          >
            History
          </Text>
          {activeTab === "history" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ══════════ TAB 1: IN PROGRESS ══════════ */}
        {activeTab === "in_progress" && (
          <View style={styles.inProgressContainer}>
            {activeOrders.length === 0 ? (
              <>
                {/* Track your orders card (Screenshot #2) */}
                <View style={styles.glovoCard}>
                  <View style={styles.glovoCardIconCircle}>
                    <ShoppingBag size={28} color="#9CA3AF" />
                  </View>
                  <Text style={styles.glovoCardTitle}>Track your orders</Text>
                  <Text style={styles.glovoCardSubtitle}>
                    Your ongoing orders will be listed here
                  </Text>
                </View>

                {/* Continue your order section (Screenshot #2) */}
                <Text style={styles.sectionHeading}>Continue your order</Text>
                <View style={styles.glovoCard}>
                  <View style={styles.glovoCardIconCircle}>
                    <ShoppingCart size={28} color="#9CA3AF" />
                  </View>
                  <Text style={styles.glovoCardTitle}>No carts yet</Text>
                  <Text style={styles.glovoCardSubtitle}>
                    Add items from stores to create new carts
                  </Text>
                </View>
              </>
            ) : (
              activeOrders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status];
                const isExpanded = expandedOrderId === order.id;

                return (
                  <Card key={order.id} style={styles.orderCard}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNumber}>
                          Commande #{order.order_number}
                        </Text>
                        <Text style={styles.orderDate}>
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
                          styles.statusBadge,
                          { backgroundColor: statusConfig.bgColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusConfig.color },
                          ]}
                        >
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>

                    {/* Timeline */}
                    <OrderTimeline currentStatus={order.status} />

                    {/* Live Tracking Map */}
                    <LiveTrackingMap
                      orderStatus={order.status}
                      courierLocation={
                        order.courier_lat && order.courier_lng
                          ? {
                              latitude: order.courier_lat,
                              longitude: order.courier_lng,
                            }
                          : undefined
                      }
                      deliveryLocation={{
                        latitude: order.delivery_lat || 34.6867,
                        longitude: order.delivery_lng || -1.9114,
                        addressText: order.delivery_address_text,
                      }}
                      restaurantLocation={
                        order.restaurant_lat && order.restaurant_lng
                          ? {
                              latitude: order.restaurant_lat,
                              longitude: order.restaurant_lng,
                            }
                          : undefined
                      }
                    />

                    {/* Expand details toggle */}
                    <TouchableOpacity
                      style={styles.expandToggle}
                      onPress={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandText}>
                        {isExpanded
                          ? "Masquer les détails"
                          : `Voir les articles (${order.items?.length || 0})`}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color={Colors.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>

                    {/* Expanded Items */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <View style={styles.itemsList}>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemQty}>{item.quantity}x</Text>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {item.product_name}
                            </Text>
                            <Text style={styles.itemPrice}>
                              {(item.unit_price * item.quantity).toFixed(2)} DH
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Footer / Actions */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.totalLabel}>Total payé</Text>
                        <Text style={styles.totalAmount}>
                          {order.total.toFixed(2)} DH
                        </Text>
                      </View>

                      <View style={styles.actionButtonsRow}>
                        {order.driver_phone && (
                          <TouchableOpacity
                            style={styles.callCourierBtn}
                            onPress={() =>
                              handleCallDelivery(order.driver_phone)
                            }
                          >
                            <Phone size={15} color="#FFFFFF" />
                            <Text style={styles.callCourierText}>Appeler</Text>
                          </TouchableOpacity>
                        )}

                        {order.status === "PENDING" && (
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancelOrder(order)}
                          >
                            <X size={15} color={Colors.error} />
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* ══════════ TAB 2: HISTORY ══════════ */}
        {activeTab === "history" && (
          <View style={styles.historyContainer}>
            {historyOrders.length === 0 ? (
              /* Empty state matching Screenshot #4 */
              <View style={styles.emptyHistoryBox}>
                <View style={styles.emptyPackageCircle}>
                  <Package size={52} color="#9CA3AF" strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyHistoryTitle}>No orders yet</Text>
                <Text style={styles.emptyHistorySubtitle}>
                  You'll be able to review past orders and reorder directly from
                  here
                </Text>

                <TouchableOpacity
                  style={styles.startOrderBtn}
                  onPress={() => router.push("/(app)/(client)/(tabs)" as any)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.startOrderBtnText}>
                    Start your first order
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              historyOrders.map((order) => (
                <Card key={order.id} style={styles.orderCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNumber}>
                        Commande #{order.order_number}
                      </Text>
                      <Text style={styles.orderDate}>
                        Livrée le{" "}
                        {new Date(order.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: "#D1FAE5" },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: "#065F46" }]}>
                        Livrée ✓
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historySummaryRow}>
                    <Text style={styles.historyItemsCount}>
                      {order.items?.length || 0} article(s) • Total :{" "}
                      <Text style={{ fontWeight: "800", color: "#3C3489" }}>
                        {order.total.toFixed(2)} DH
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.historyActionsRow}>
                    <TouchableOpacity
                      style={styles.reorderPillBtn}
                      onPress={() => handleReorder(order)}
                    >
                      <RotateCcw size={15} color="#3C3489" />
                      <Text style={styles.reorderPillText}>
                        Commander à nouveau
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.ratePillBtn,
                        order.courier_rating
                          ? {
                              backgroundColor: "#FEF3C7",
                              borderColor: "#F59E0B",
                            }
                          : null,
                      ]}
                      onPress={() => handleOpenCourierRating(order)}
                      activeOpacity={0.8}
                    >
                      <Bike
                        size={15}
                        color={order.courier_rating ? "#D97706" : "#5C5BDB"}
                      />
                      <Text
                        style={[
                          styles.ratePillText,
                          order.courier_rating
                            ? { color: "#D97706", fontWeight: "800" }
                            : { color: "#5C5BDB" },
                        ]}
                      >
                        {order.courier_rating
                          ? `${order.driver_name ? order.driver_name.split(" ")[0] : "Livreur"}: ${order.courier_rating}/5 ⭐`
                          : `${t("orders.rateCourier", "Noter le livreur")}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Rating Modal ── */}
      <Modal
        visible={!!ratingOrder}
        animationType="fade"
        transparent
        onRequestClose={() => setRatingOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingModalTitle}>Noter la commande</Text>
            <Text style={styles.ratingModalSub}>
              Commande #{ratingOrder?.order_number}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedStars(star)}
                  style={{ padding: 6 }}
                >
                  <Star
                    size={32}
                    color={star <= selectedStars ? "#F59E0B" : "#CECBF6"}
                    fill={star <= selectedStars ? "#F59E0B" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Ajouter un commentaire (optionnel)..."
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRatingOrder(null)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitRating}
                disabled={isSubmittingRating}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmittingRating ? "Envoi..." : "Envoyer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ══════════ MODAL: RATE DELIVERY COURIER ══════════ */}
      <Modal
        visible={!!ratingCourierOrder}
        animationType="fade"
        transparent
        onRequestClose={() => setRatingCourierOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            {/* Courier Header with Bike Avatar */}
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                  backgroundColor: "rgba(92, 91, 219, 0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#CECBF6",
                  marginBottom: 8,
                }}
              >
                <Bike size={30} color="#5C5BDB" strokeWidth={2.2} />
              </View>
              <Text style={styles.ratingModalTitle}>
                {t("courierRating.title", "Noter votre livreur 🛵")}
              </Text>
              <Text style={styles.ratingModalSub}>
                {t(
                  "courierRating.sub",
                  "Comment s'est passée votre livraison avec",
                )}{" "}
                <Text style={{ fontWeight: "800", color: "#3C3489" }}>
                  {ratingCourierOrder?.driver_name || "Livreur Oujda Express"}
                </Text>
              </Text>
            </View>

            {/* 5 Interactive Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setCourierStars(star)}
                  style={{ padding: 6 }}
                  activeOpacity={0.75}
                >
                  <Star
                    size={34}
                    color={star <= courierStars ? "#FFD166" : "#CECBF6"}
                    fill={star <= courierStars ? "#FFD166" : "transparent"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Compliment Tags */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: "#7F77DD",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {t(
                "courierRating.tagsTitle",
                "Qu'avez-vous particulièrement apprécié ?",
              )}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              {[
                t("courierRating.tagFast", "⚡ Livraison ultra-rapide"),
                t("courierRating.tagPolite", "😊 Très poli & courtois"),
                t("courierRating.tagCareful", "🛵 Soin du colis"),
                t("courierRating.tagFoundEasy", "📍 Adresse trouvée vite"),
                t("courierRating.tagCommunicative", "📞 Bonne communication"),
              ].map((tag) => {
                const isSelected = courierSelectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleCourierTag(tag)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      backgroundColor: isSelected ? "#5C5BDB" : "#F7F7FF",
                      borderWidth: 1,
                      borderColor: isSelected ? "#5C5BDB" : "#CECBF6",
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: isSelected ? "#FFFFFF" : "#3C3489",
                      }}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Comment Input */}
            <TextInput
              style={[
                styles.ratingInput,
                { height: 60, textAlignVertical: "top" },
              ]}
              placeholder={t(
                "courierRating.commentPlaceholder",
                "Un mot d'encouragement ou une remarque (optionnel)...",
              )}
              placeholderTextColor="#7F77DD"
              value={courierComment}
              onChangeText={setCourierComment}
              multiline
              numberOfLines={2}
            />

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRatingCourierOrder(null)}
              >
                <Text style={styles.modalCancelText}>
                  {t("common.cancel", "Annuler")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: "#5C5BDB" }]}
                onPress={handleSubmitCourierRating}
                disabled={isSubmittingCourierRating}
              >
                <Text style={styles.modalSubmitText}>
                  {isSubmittingCourierRating
                    ? t("courierRating.submitting", "Envoi...")
                    : t("courierRating.submit", "Envoyer l'évaluation")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerTitleRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#3C3489",
  },

  // Tabs matching Screenshot #2 & #4
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CECBF6",
    marginTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  tabButtonTextActive: {
    color: "#3C3489",
    fontWeight: "800",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: Colors.primary,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  inProgressContainer: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3C3489",
    marginTop: 24,
    marginBottom: 12,
  },

  // Glovo style Cards (Screenshot #2)
  glovoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
    padding: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  glovoCardIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  glovoCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 4,
  },
  glovoCardSubtitle: {
    fontSize: 13,
    color: "#7F77DD",
    textAlign: "center",
  },

  orderCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  orderDate: {
    fontSize: 12,
    color: "#7F77DD",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 10,
  },
  expandText: {
    fontSize: 13,
    color: "#7F77DD",
    fontWeight: "600",
  },
  itemsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
    width: 28,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3C3489",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: "#7F77DD",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#3C3489",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  callCourierBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cta,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  callCourierText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },

  // History tab styles (Screenshot #4)
  historyContainer: {
    padding: 16,
  },
  emptyHistoryBox: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyPackageCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyHistoryTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyHistorySubtitle: {
    fontSize: 14,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  startOrderBtn: {
    backgroundColor: Colors.cta, // Glovo dark green CTA button
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  startOrderBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  historySummaryRow: {
    paddingVertical: 8,
  },
  historyItemsCount: {
    fontSize: 13,
    color: "#7F77DD",
  },
  historyActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  reorderPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  reorderPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3C3489",
  },
  ratePillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
  },
  ratePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  ratingModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3C3489",
  },
  ratingModalSub: {
    fontSize: 13,
    color: "#7F77DD",
    marginTop: 2,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  ratingInput: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CECBF6",
    padding: 12,
    fontSize: 13,
    color: "#3C3489",
    textAlignVertical: "top",
    minHeight: 70,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7F77DD",
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.cta,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
