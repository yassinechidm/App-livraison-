import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { liveLocationService } from "@/services/liveLocation.service";
import { orderService } from "@/services/order.service";
import { LiveTrackingMap } from "@/src/components/LiveTrackingMap";
import { PrescriptionImageViewerModal } from "@/src/components/PrescriptionImageViewerModal";
import { Order, ORDER_STATUS_CONFIG } from "@/types/order.types";
import {
    FileText,
    MapPin,
    Navigation,
    Phone,
    PhoneCall,
    Pill,
    ShoppingBag,
    User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function CourierActiveDeliveriesScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [previewPrescription, setPreviewPrescription] = useState<{
    url: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = orderService.subscribe(() => {
      loadData();
    });

    authService.getSession().then((session: any) => {
      if (session?.user) setUser(session.user);
    });

    return () => {
      unsubscribe();
      liveLocationService.stopCourierTracking();
    };
  }, []);

  useEffect(() => {
    const activeDelivering = orders.find(
      (o) => o.status === "OUT_FOR_DELIVERY",
    );
    if (activeDelivering) {
      liveLocationService.startCourierTracking(activeDelivering.id);
    } else {
      liveLocationService.stopCourierTracking();
    }
  }, [orders]);

  async function loadData() {
    try {
      const all = await orderService.getAllOrdersAdmin();
      let courierId: string | null = null;
      if (user?.id) {
        const { data: cData } = await (supabase as any)
          .from("couriers")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (cData) courierId = cData.id;
      }

      const myActive = all.filter((o) => {
        if (o.status !== "OUT_FOR_DELIVERY") return false;
        if (courierId && o.courier_id) {
          return o.courier_id === courierId;
        }
        return o.courier_id === user?.id;
      });
      setOrders(myActive);
    } catch {
      setOrders([]);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleMarkDelivered(order: Order) {
    setUpdatingId(order.id);
    try {
      await orderService.updateOrderStatus(order.id, "DELIVERED");
      await loadData();
      Alert.alert(
        "Livraison Terminée",
        `La commande ${order.order_number} a été marquée comme livrée.`,
      );
    } catch {
      Alert.alert("Erreur", "Impossible de valider la livraison.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCallCustomer(phone?: string) {
    if (!phone) {
      Alert.alert("Info", "Aucun numéro disponible");
      return;
    }
    Linking.openURL(`tel:${phone}`);
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
          {orders.length > 1 ? "courses actives" : "course active"}
        </Text>

        {orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Navigation
              size={40}
              color={Colors.textMuted}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>Aucune course en cours</Text>
            <Text style={styles.emptySub}>
              Consultez l'onglet "Disponibles" pour accepter une nouvelle
              commande.
            </Text>
          </Card>
        ) : (
          orders.map((order) => {
            const config = ORDER_STATUS_CONFIG[order.status];
            const isDelivered = order.status === "DELIVERED";

            return (
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
                      <Text style={styles.clientName}>
                        {order.customer_name}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: config.bgColor },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: config.color }]}>
                      {config.label}
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

                {/* Real-time Map & Navigation for Courier */}
                <View style={{ marginTop: 10, marginBottom: 10 }}>
                  <LiveTrackingMap
                    courierLocation={{
                      latitude: order.courier_lat || 34.688,
                      longitude: order.courier_lng || -1.913,
                    }}
                    deliveryLocation={{
                      latitude: order.delivery_lat || 34.6867,
                      longitude: order.delivery_lng || -1.9114,
                      addressText: order.delivery_address_text,
                    }}
                    restaurantLocation={{
                      latitude: order.restaurant_lat || 34.689,
                      longitude: order.restaurant_lng || -1.915,
                      name: "Restaurant / Snack",
                    }}
                    courierName="Ma position GPS (Livreur)"
                    orderStatus={order.status}
                    height={190}
                    showNavigationButton={true}
                  />
                </View>

                <View style={styles.phoneBox}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Phone size={14} color={Colors.primary} />
                    <Text style={styles.phoneText}>
                      Client: {order.customer_phone}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCallCustomer(order.customer_phone)}
                  >
                    <PhoneCall
                      size={12}
                      color={Colors.white}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.callBtnText}>Appeler</Text>
                  </TouchableOpacity>
                </View>

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
                      Contenu de la commande
                    </Text>
                  </View>
                  {order.items?.map((item, idx) => (
                    <Text key={idx} style={styles.itemLine}>
                      • {item.quantity}x {item.product_name} (
                      {item.unit_price.toFixed(2)} DH)
                    </Text>
                  ))}
                </View>

                {/* Prescription Preview for Courier */}
                {order.prescription_image_url ? (
                  <View style={styles.prescriptionCardWrap}>
                    <View style={styles.prescriptionBadgeRow}>
                      <Pill size={14} color="#059669" />
                      <Text style={styles.prescriptionBadgeText}>
                        Ordonnance Médicale du client
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.prescriptionThumbCard}
                      onPress={() =>
                        setPreviewPrescription({
                          url: order.prescription_image_url!,
                          orderNumber: order.order_number,
                          customerName: order.customer_name,
                          customerPhone: order.customer_phone,
                        })
                      }
                      activeOpacity={0.88}
                    >
                      <Image
                        source={{ uri: order.prescription_image_url }}
                        style={styles.prescriptionThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.zoomOverlay}>
                        <FileText
                          size={12}
                          color="#FFFFFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.zoomOverlayText}>
                          Voir l'ordonnance complète
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>
                    Montant total à encaisser (
                    {order.payment_method === "CASH"
                      ? "Paiement Cash"
                      : "Virement / Carte"}
                    ) :
                  </Text>
                  <Text style={styles.totalValue}>
                    {order.total.toFixed(2)} DH
                  </Text>
                </View>

                {!isDelivered && (
                  <Button
                    title="Valider la livraison"
                    onPress={() => handleMarkDelivered(order)}
                    isLoading={updatingId === order.id}
                    variant="success"
                    style={{ marginTop: 12 }}
                  />
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Prescription Fullscreen Modal */}
      <PrescriptionImageViewerModal
        visible={!!previewPrescription}
        imageUrl={previewPrescription?.url}
        orderNumber={previewPrescription?.orderNumber}
        customerName={previewPrescription?.customerName}
        customerPhone={previewPrescription?.customerPhone}
        onClose={() => setPreviewPrescription(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
  },
  header: {
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
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
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
    borderColor: "#CECBF6",
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
    borderColor: "#CECBF6",
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
  clientName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusIcon: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#F7F7FF",
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
  phoneBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F7FF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  callBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  callBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  itemsSummary: {
    backgroundColor: "#F7F7FF",
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
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
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#CECBF6",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    flex: 1,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.primary,
  },
  prescriptionCardWrap: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 10,
  },
  prescriptionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  prescriptionBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#059669",
  },
  prescriptionThumbCard: {
    width: "100%",
    height: 110,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1F2937",
  },
  prescriptionThumb: {
    width: "100%",
    height: "100%",
  },
  zoomOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomOverlayText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
