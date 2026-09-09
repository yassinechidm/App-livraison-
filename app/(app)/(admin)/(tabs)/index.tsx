import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { AdminDashboardStats, adminService } from "@/services/admin.service";
import { Courier, courierService } from "@/services/courier.service";
import { liveLocationService } from "@/services/liveLocation.service";
import { orderService } from "@/services/order.service";
import { PromoCode, promoService } from "@/services/promo.service";
import { LiveTrackingMap } from "@/src/components/LiveTrackingMap";
import { Order, ORDER_STATUS_CONFIG } from "@/types/order.types";
import { useRouter } from "expo-router";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Flame,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  User,
  UtensilsCrossed,
  Wallet
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Top selling dishes computed dynamically from real orders
function computeTopSellingDishes(allOrders: Order[]) {
  const dishMap: Record<
    string,
    { name: string; orders: number; revenue: number }
  > = {};
  for (const order of allOrders) {
    if (!order.items) continue;
    for (const item of order.items) {
      const key = item.product_name || item.product_id;
      if (!dishMap[key]) {
        dishMap[key] = {
          name: item.product_name || key,
          orders: 0,
          revenue: 0,
        };
      }
      dishMap[key].orders += item.quantity;
      dishMap[key].revenue +=
        item.total_price || item.unit_price * item.quantity;
    }
  }
  const sorted = Object.values(dishMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxOrders = sorted.length > 0 ? sorted[0].orders : 1;
  return sorted.map((d, i) => ({
    name: d.name,
    orders: d.orders,
    revenue: d.revenue,
    percent: Math.round((d.orders / maxOrders) * 100),
    rank: i + 1,
  }));
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    const unsubscribe = orderService.subscribe(() => {
      loadDashboard();
    });

    const unsubscribeLocation = liveLocationService.subscribeToAllActiveLocations((update) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === update.order_id
            ? { ...o, courier_lat: update.courier_lat, courier_lng: update.courier_lng }
            : o
        )
      );
    });

    const interval = setInterval(() => {
      loadDashboard();
    }, 3000);

    return () => {
      unsubscribe();
      unsubscribeLocation();
      clearInterval(interval);
    };
  }, []);

  async function loadDashboard() {
    const [s, allOrders, crs, pms] = await Promise.all([
      adminService.getDashboardStats(),
      orderService.getAllOrdersAdmin(),
      courierService.getCouriers(),
      promoService.getPromoCodes(),
    ]);
    setStats(s);
    setOrders(allOrders);
    setCouriers(crs);
    setPromoCodes(pms);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  const totalTurnover = orders.reduce((sum, o) => sum + o.total, 0);
  const averageBasket = orders.length > 0 ? totalTurnover / orders.length : 0;
  const recentOrders = orders.slice(0, 3);
  const ratedOrders = orders.filter((o) => o.rating && o.rating > 0);
  const topSellingDishes = computeTopSellingDishes(orders);
  const avgRating =
    ratedOrders.length > 0
      ? (
          ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) /
          ratedOrders.length
        ).toFixed(1)
      : "—";

  return (
    <ScrollView
      style={styles.container}
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
      {/* Header Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingTitle}>Espace Administration</Text>
          <Text style={styles.greetingSub}>
            Supervision globale des opérations à Oujda
          </Text>
        </View>
        <View style={styles.adminBadge}>
          <ShieldCheck
            size={14}
            color={Colors.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Turnover KPI */}
        <Card style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <View style={styles.kpiHeaderRow}>
            <Wallet size={20} color={Colors.primary} />
            <TrendingUp size={16} color={Colors.success} />
          </View>
          <Text style={styles.kpiValue}>
            {totalTurnover.toFixed(2)} <Text style={styles.kpiUnit}>MAD</Text>
          </Text>
          <Text style={styles.kpiLabel}>Chiffre d'affaires cumulé</Text>
        </Card>

        {/* Average Basket */}
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <ShoppingBag size={20} color={Colors.primary} />
          </View>
          <Text style={[styles.kpiValue, { color: Colors.primary }]}>
            {averageBasket.toFixed(2)} <Text style={styles.kpiUnit}>MAD</Text>
          </Text>
          <Text style={styles.kpiLabel}>Panier Moyen Client</Text>
        </Card>

        {/* Pending Orders KPI */}
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <ChefHat size={20} color="#F59E0B" />
          </View>
          <Text style={[styles.kpiValue, { color: "#F59E0B" }]}>
            {
              orders.filter(
                (o) => o.status === "PREPARING" || o.status === "PENDING",
              ).length
            }
          </Text>
          <Text style={styles.kpiLabel}>En Cuisine / Attente</Text>
        </Card>

        {/* Out for Delivery KPI */}
        <Card style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Bike size={20} color="#FF6B00" />
          </View>
          <Text style={[styles.kpiValue, { color: "#FF6B00" }]}>
            {orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length}
          </Text>
          <Text style={styles.kpiLabel}>Livreurs en Course</Text>
        </Card>
      </View>

      {/* Secondary Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Bike size={16} color={Colors.primary} style={{ marginBottom: 4 }} />
          <Text style={styles.metricVal}>
            {couriers.filter((c) => c.is_available).length}/{couriers.length}
          </Text>
          <Text style={styles.metricLbl}>Livreurs dispo</Text>
        </View>
        <View style={styles.metricBox}>
          <Star size={16} color="#F59E0B" style={{ marginBottom: 4 }} />
          <Text style={styles.metricVal}>
            {avgRating}
            {ratedOrders.length > 0 ? "/5" : ""}
          </Text>
          <Text style={styles.metricLbl}>
            Satisfaction ({ratedOrders.length} avis)
          </Text>
        </View>
        <View style={styles.metricBox}>
          <CheckCircle2
            size={16}
            color={Colors.success}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.metricVal}>
            {orders.filter((o) => o.status === "DELIVERED").length}
          </Text>
          <Text style={styles.metricLbl}>Livrées à Oujda</Text>
        </View>
      </View>

      {/* Quick Admin Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#EBF2FF" }]}
          onPress={() => router.push("/(app)/(admin)/(tabs)/orders" as any)}
          activeOpacity={0.8}
        >
          <ChefHat
            size={20}
            color={Colors.primary}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.actionText, { color: Colors.primary }]}>
            Vue Cuisine Kanban
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#F0FDF4" }]}
          onPress={() => router.push("/(app)/(admin)/(tabs)/products" as any)}
          activeOpacity={0.8}
        >
          <UtensilsCrossed
            size={20}
            color={Colors.secondary}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.actionText, { color: Colors.secondary }]}>
            Gérer Menus & Plats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#FFFBEB" }]}
          onPress={() => router.push("/(app)/(admin)/(tabs)/categories" as any)}
          activeOpacity={0.8}
        >
          <Tag size={20} color="#B45309" style={{ marginBottom: 4 }} />
          <Text style={[styles.actionText, { color: "#B45309" }]}>
            Codes Promo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Fleet & Active Deliveries Map */}
      <View style={styles.sectionHeader}>
        <Bike size={18} color={Colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>Suivi Flotte & Commandes en Direct (Oujda)</Text>
      </View>

      <Card style={{ padding: 12, marginBottom: 20 }}>
        {(() => {
          const activeDelivery = orders.find((o) => o.status === "OUT_FOR_DELIVERY" || o.status === "READY") || orders[0];
          return (
            <LiveTrackingMap
              courierLocation={{
                latitude: activeDelivery?.courier_lat || 34.6880,
                longitude: activeDelivery?.courier_lng || -1.9130,
              }}
              deliveryLocation={{
                latitude: activeDelivery?.delivery_lat || 34.6867,
                longitude: activeDelivery?.delivery_lng || -1.9114,
                addressText: activeDelivery?.delivery_address_text || "Centre-Ville Oujda",
              }}
              restaurantLocation={{
                latitude: activeDelivery?.restaurant_lat || 34.6890,
                longitude: activeDelivery?.restaurant_lng || -1.9150,
                name: "Hub Oujda",
              }}
              courierName={activeDelivery?.driver_name || "Livreur En Course"}
              orderStatus={activeDelivery?.status || "OUT_FOR_DELIVERY"}
              height={230}
            />
          );
        })()}
      </Card>

      {/* Top Selling Dishes — Dynamic from orders */}
      <View style={styles.sectionHeader}>
        <Flame size={18} color={Colors.secondary} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>Top Plats Populaires</Text>
      </View>

      <Card style={styles.topSellingCard}>
        {topSellingDishes.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: Colors.textMuted,
              padding: 16,
            }}
          >
            Aucune donnée — les statistiques apparaîtront après les premières
            commandes.
          </Text>
        ) : (
          topSellingDishes.map((dish, index) => (
            <View key={index} style={styles.topSellingRow}>
              <View style={styles.topSellingHeaderRow}>
                <Text style={styles.topSellingDishName}>
                  #{dish.rank} {dish.name}
                </Text>
                <Text style={styles.topSellingDishRevenue}>
                  {dish.revenue.toLocaleString()} MAD ({dish.orders}x)
                </Text>
              </View>

              <View style={styles.topSellingProgressBg}>
                <View
                  style={[
                    styles.topSellingProgressFill,
                    {
                      width: `${dish.percent}%`,
                      backgroundColor:
                        index === 0 ? Colors.primary : Colors.secondary,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Couriers Fleet Status */}
      <View style={styles.sectionHeader}>
        <Bike size={18} color={Colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>Flotte de Coursiers</Text>
      </View>

      <Card style={styles.couriersCard}>
        {couriers.map((courier) => (
          <View key={courier.id} style={styles.courierRow}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.courierName}>{courier.name}</Text>
                <View
                  style={[
                    styles.courierStatusPill,
                    {
                      backgroundColor: courier.is_available
                        ? "#ECFDF5"
                        : "#FEF2F2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.courierStatusText,
                      { color: courier.is_available ? "#059669" : "#DC2626" },
                    ]}
                  >
                    {courier.is_available ? "Disponible" : "En course"}
                  </Text>
                </View>
              </View>
              <Text style={styles.courierMeta}>
                {courier.vehicle} • {courier.phone} • Note: {courier.rating}/5
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Recent Reviews & Ratings from Clients */}
      {ratedOrders.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Star size={18} color="#F59E0B" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Derniers Avis Clients</Text>
          </View>

          {ratedOrders.map((order) => (
            <Card key={order.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <User size={14} color={Colors.textSecondary} />
                  <Text style={styles.reviewCustomer}>
                    {order.customer_name}
                  </Text>
                </View>
                <Text style={styles.reviewStars}>⭐ {order.rating}/5</Text>
              </View>
              <Text style={styles.reviewComment}>
                "{order.review_text || "Superbe service de livraison !"}"
              </Text>
              <Text style={styles.reviewOrderSub}>
                Commande {order.order_number} • {order.items?.[0]?.product_name}
              </Text>
            </Card>
          ))}
        </>
      )}

      {/* Recent Orders Preview */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Commandes Récentes</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/(admin)/(tabs)/orders" as any)}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text style={styles.seeAll}>Vue Kanban</Text>
          <ChevronRight size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {recentOrders.map((order) => {
        const config = ORDER_STATUS_CONFIG[order.status];
        return (
          <TouchableOpacity
            key={order.id}
            onPress={() => router.push("/(app)/(admin)/(tabs)/orders" as any)}
            activeOpacity={0.85}
          >
            <Card style={styles.orderPreviewCard}>
              <View style={styles.orderPreviewHeader}>
                <View>
                  <Text style={styles.orderPreviewNumber}>
                    {order.order_number}
                  </Text>
                  <Text style={styles.orderPreviewCustomer}>
                    👤 {order.customer_name} ({order.customer_phone})
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: config.bgColor },
                  ]}
                >
                  <Text style={styles.statusIcon}>{config.icon}</Text>
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.orderPreviewAddress}>
                📍 {order.delivery_address_text}
              </Text>

              <View style={styles.orderPreviewFooter}>
                <Text style={styles.orderPreviewItems}>
                  {order.items?.length || 1} article(s) •{" "}
                  {order.payment_method === "CARD" ? "💳 Carte" : "💵 Cash"}
                </Text>
                <Text style={styles.orderPreviewTotal}>
                  {order.total.toFixed(2)} MAD
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  greetingSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: "rgba(92, 91, 219, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.primary,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  kpiCardHighlight: {
    backgroundColor: "#F8FAFF",
    borderColor: Colors.primary + "40",
  },
  kpiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kpiEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  metricBox: {
    alignItems: "center",
    flex: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  topSellingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
    gap: 12,
  },
  topSellingRow: {
    gap: 4,
  },
  topSellingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topSellingDishName: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textPrimary,
    flex: 1,
  },
  topSellingDishRevenue: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  topSellingProgressBg: {
    height: 6,
    backgroundColor: "#F7F7FF",
    borderRadius: 3,
    overflow: "hidden",
  },
  topSellingProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  couriersCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
    gap: 10,
  },
  courierRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  courierName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  courierStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courierStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  courierMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewCustomer: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  reviewStars: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 16,
  },
  reviewOrderSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  orderPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  orderPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  orderPreviewNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.primary,
  },
  orderPreviewCustomer: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  orderPreviewAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  orderPreviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  orderPreviewItems: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderPreviewTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
});
