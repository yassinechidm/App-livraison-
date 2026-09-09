import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order.types";
import { useRouter } from "expo-router";
import {
    MapPin,
    PackageSearch,
    ShoppingBag,
    User
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function CourierOrdersFeedScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = orderService.subscribe(() => {
      loadData();
    });
    const interval = setInterval(() => {
      loadData();
    }, 3000);

    authService.getSession().then((session: any) => {
      if (session?.user) setUser(session.user);
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  async function loadData() {
    try {
      const all = await orderService.getAllOrdersAdmin();
      // Available pool: READY, PREPARING, CONFIRMED, PENDING that are not assigned yet
      const availablePool = all.filter(
        (o) =>
          (o.status === "READY" ||
            o.status === "PREPARING" ||
            o.status === "CONFIRMED" ||
            o.status === "PENDING") &&
          !o.driver_name,
      );
      setOrders(availablePool);
    } catch {
      setOrders([]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleClaimOrder(order: Order) {
    setIsClaimingId(order.id);
    try {
      const courierName = user?.email?.split("@")[0] || "Livreur Oujda";
      const courierPhone = "+212 6 XX XX XX XX";
      await orderService.assignCourier(
        order.id,
        user?.id || "courier-1",
        courierName,
        courierPhone,
      );
      await loadData();
      Alert.alert(
        "Commande Prise en Charge",
        `Vous avez accepté la commande ${order.order_number}.\nRendez-vous dans "En Cours" pour suivre la livraison.`,
      );
      router.push("/(app)/(delivery)/(tabs)/active" as any);
    } catch {
      Alert.alert("Erreur", "Impossible d'accepter cette commande.");
    } finally {
      setIsClaimingId(null);
    }
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.countHeader}>
          {orders.length}{" "}
          {orders.length > 1 ? "commandes disponibles" : "commande disponible"}
        </Text>

        {orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <PackageSearch
              size={40}
              color={Colors.textMuted}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>Aucune commande en attente</Text>
            <Text style={styles.emptySub}>
              Les nouvelles commandes de snacks et restaurants à Oujda
              apparaîtront automatiquement ici.
            </Text>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNum}>{order.order_number}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <User size={14} color={Colors.textSecondary} />
                    <Text style={styles.restoBadge}>
                      {order.customer_name} • {order.customer_phone}
                    </Text>
                  </View>
                </View>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>
                    {order.total.toFixed(2)} DH
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <MapPin size={12} color={Colors.textMuted} />
                <Text style={styles.addressLabel}>ADRESSE DE LIVRAISON</Text>
              </View>
              <Text style={styles.addressText}>
                {order.delivery_address_text}
              </Text>

              <View style={styles.itemsSummary}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  <ShoppingBag size={14} color={Colors.textPrimary} />
                  <Text style={styles.itemsTitle}>
                    {order.items?.length || 1} article(s)
                  </Text>
                </View>
                {order.items?.map((item, idx) => (
                  <Text key={idx} style={styles.itemLine}>
                    • {item.quantity}x {item.product_name}
                  </Text>
                ))}
              </View>

              {order.notes ? (
                <Text style={styles.notesText}>Notes : {order.notes}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.paymentInfo}>
                  {order.payment_method === "TRANSFER"
                    ? "Virement bancaire"
                    : order.payment_method === "CARD"
                      ? "Payé par Carte"
                      : "Paiement Cash à la livraison"}
                </Text>

                <Button
                  title="Accepter la livraison"
                  onPress={() => handleClaimOrder(order)}
                  isLoading={isClaimingId === order.id}
                  style={styles.claimBtn}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  onlineBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#059669",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  countHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNum: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.primary,
  },
  restoBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: "#EBF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "900",
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
    marginBottom: 8,
  },
  itemsSummary: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemLine: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  notesText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  paymentInfo: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  claimBtn: {
    marginTop: 4,
  },
});
