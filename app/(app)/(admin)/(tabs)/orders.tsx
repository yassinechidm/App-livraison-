import { NotificationBell } from "@/components/notifications/NotificationBell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { Courier, courierService } from "@/services/courier.service";
import { orderService } from "@/services/order.service";
import { PrescriptionImageViewerModal } from "@/src/components/PrescriptionImageViewerModal";
import { Order, ORDER_STATUS_CONFIG, OrderStatus } from "@/types/order.types";
import {
    Banknote,
    Bike,
    CheckCircle2,
    CreditCard,
    FileText,
    MapPin,
    Pill,
    Printer,
    ShoppingCart,
    Trash2,
    User,
    X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const STATUS_FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | "ALL">(
    "ALL",
  );
  const [selectedOrderForStatus, setSelectedOrderForStatus] =
    useState<Order | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [assignCourierOrder, setAssignCourierOrder] = useState<Order | null>(
    null,
  );
  const [previewPrescription, setPreviewPrescription] = useState<{
    url: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = orderService.subscribe(() => {
      loadData();
    });
    // Poll every 3 seconds to catch cross-tab / same-tab localStorage changes
    const interval = setInterval(() => {
      loadData();
    }, 3000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [selectedFilter]);

  async function loadData() {
    const [list, crs] = await Promise.all([
      orderService.getAllOrdersAdmin(selectedFilter),
      courierService.getCouriers(),
    ]);
    setOrders(list);
    setCouriers(crs);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleQuickAdvance(order: Order) {
    let nextStatus: OrderStatus | null = null;
    if (order.status === "PENDING" || order.status === "CONFIRMED") {
      nextStatus = "PREPARING";
    } else if (order.status === "PREPARING") {
      nextStatus = "READY";
    } else if (order.status === "READY") {
      setAssignCourierOrder(order);
      return;
    } else if (order.status === "OUT_FOR_DELIVERY") {
      nextStatus = "DELIVERED";
    }

    if (nextStatus) {
      await orderService.updateOrderStatus(order.id, nextStatus);
      await loadData();
    }
  }

  async function handleAssignCourier(courier: Courier) {
    if (!assignCourierOrder) return;
    try {
      await orderService.assignCourier(
        assignCourierOrder.id,
        courier.id,
        courier.name,
        courier.phone,
      );
      setAssignCourierOrder(null);
      await loadData();
      Alert.alert(
        "Coursier assigné ! 🛵",
        `La commande est maintenant confiée à ${courier.name}.`,
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'assigner le coursier.");
    }
  }

  async function handleUpdateStatus(newStatus: OrderStatus) {
    if (!selectedOrderForStatus) return;

    try {
      await orderService.updateOrderStatus(
        selectedOrderForStatus.id,
        newStatus,
      );
      setSelectedOrderForStatus(null);
      await loadData();
      Alert.alert(
        "Statut mis à jour",
        `La commande ${selectedOrderForStatus.order_number} est maintenant "${ORDER_STATUS_CONFIG[newStatus].label}".`,
      );
    } catch {
      Alert.alert("Erreur", "Impossible de modifier le statut.");
    }
  }

  async function handleDeleteOrder(order: Order) {
    Alert.alert(
      "Supprimer définitivement ?",
      `Voulez-vous supprimer définitivement la commande ${order.order_number} de la base de données ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await orderService.deleteOrder(order.id);
              setSelectedOrderForStatus(null);
              await loadData();
              Alert.alert(
                "Supprimée",
                "La commande a été supprimée avec succès.",
              );
            } catch {
              Alert.alert("Erreur", "Impossible de supprimer la commande.");
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* Horizontal Status Filter Bar */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((st) => {
            const isAll = st === "ALL";
            const label = isAll ? "Toutes" : ORDER_STATUS_CONFIG[st].label;
            const isSelected = selectedFilter === st;

            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setSelectedFilter(st)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer par statut: ${label}`}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={[styles.listHeader, { marginBottom: 0 }]}>
            {orders.length} {orders.length > 1 ? "commandes" : "commande"} •
            Gestion cuisine
          </Text>
          <NotificationBell />
        </View>

        {orders.map((order) => {
          const config = ORDER_STATUS_CONFIG[order.status];

          return (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 3,
                    }}
                  >
                    <User
                      size={13}
                      color={Colors.textSecondary}
                      strokeWidth={1.8}
                    />
                    <Text style={styles.customerName}>
                      {order.customer_name} • {order.customer_phone}
                    </Text>
                  </View>
                </View>

                {/* Status Changer Button */}
                <TouchableOpacity
                  style={[
                    styles.statusChangeBtn,
                    {
                      backgroundColor: config.bgColor,
                      borderColor: config.color + "40",
                    },
                  ]}
                  onPress={() => setSelectedOrderForStatus(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Changer le statut de la commande ${order.order_number}`}
                >
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label} ▾
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 8,
                  marginTop: 2,
                }}
              >
                <MapPin
                  size={13}
                  color={Colors.textSecondary}
                  strokeWidth={1.8}
                />
                <Text style={styles.addressText}>
                  {order.delivery_address_text}
                </Text>
              </View>

              {/* Items in order */}
              <View style={styles.itemsList}>
                {order.items?.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{item.quantity}x</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      {item.selected_customizations_text && (
                        <Text style={styles.customSub}>
                          {item.selected_customizations_text}
                        </Text>
                      )}
                      {item.special_instructions && (
                        <Text style={styles.customNote}>
                          Note Chef : "{item.special_instructions}"
                        </Text>
                      )}
                    </View>
                    <Text style={styles.itemPrice}>
                      {item.total_price.toFixed(2)} DH
                    </Text>
                  </View>
                ))}
              </View>

              {/* Prescription Image Preview for Admin */}
              {order.prescription_image_url ? (
                <View style={styles.prescriptionCardWrap}>
                  <View style={styles.prescriptionBadgeRow}>
                    <Pill size={14} color="#059669" strokeWidth={2.0} />
                    <Text style={styles.prescriptionBadgeText}>
                      Ordonnance Médicale
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
                    accessibilityRole="button"
                    accessibilityLabel="Agrandir l'ordonnance médicale"
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
                        strokeWidth={2.0}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.zoomOverlayText}>
                        Agrandir l'ordonnance
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Grocery Request Card for Admin */}
              {order.notes && order.notes.includes("[GROCERY") ? (
                <View style={styles.groceryCardWrap}>
                  <View style={styles.groceryBadgeRow}>
                    <ShoppingCart
                      size={14}
                      color={Colors.primary}
                      strokeWidth={2.0}
                    />
                    <Text style={styles.groceryBadgeText}>
                      Demande de Courses (Supermarché)
                    </Text>
                  </View>
                  <View style={styles.groceryContentBox}>
                    <Text style={styles.groceryListText}>
                      {order.notes.replace(/\[GROCERY[^\]]*\]\s*/i, "")}
                    </Text>
                  </View>
                </View>
              ) : null}

              {order.notes && !order.notes.includes("[GROCERY") ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <FileText
                    size={12}
                    color={Colors.textMuted}
                    strokeWidth={1.8}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.notesText}>
                    Instructions client : {order.notes}
                  </Text>
                </View>
              ) : null}

              {/* Courier info if assigned */}
              {order.driver_name && (
                <View style={styles.driverAssignedBox}>
                  <Bike size={14} color={Colors.primary} strokeWidth={2.0} />
                  <Text style={styles.driverAssignedText}>
                    Coursier :{" "}
                    <Text style={{ fontWeight: "800" }}>
                      {order.driver_name}
                    </Text>{" "}
                    ({order.driver_phone})
                  </Text>
                </View>
              )}

              <View style={styles.orderFooter}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  {order.payment_method === "CARD" ? (
                    <CreditCard
                      size={13}
                      color={Colors.textSecondary}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Banknote
                      size={13}
                      color={Colors.textSecondary}
                      strokeWidth={1.8}
                    />
                  )}
                  <Text style={styles.paymentMethod}>
                    {order.payment_method === "TRANSFER"
                      ? "Virement Bancaire"
                      : order.payment_method === "CARD"
                        ? "Carte Bancaire"
                        : "Paiement Cash"}
                  </Text>
                </View>
                <Text style={styles.bold}>
                  Total : {order.total.toFixed(2)} DH
                </Text>
              </View>

              {/* Quick 1-Click Action Buttons for Kitchen Pipeline */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.printTicketBtn}
                  onPress={() => setTicketOrder(order)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Imprimer bon de cuisine"
                >
                  <Printer
                    size={13}
                    color={Colors.textPrimary}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.printTicketText}>Bon Cuisine</Text>
                </TouchableOpacity>

                {order.status === "PENDING" && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: "#8B5CF6" }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Lancer en cuisine"
                  >
                    <Text style={styles.pipelineBtnText}>
                      Lancer en cuisine →
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === "PREPARING" && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: "#06B6D4" }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Marquer comme prête"
                  >
                    <Text style={styles.pipelineBtnText}>Marquer Prête →</Text>
                  </TouchableOpacity>
                )}

                {order.status === "READY" && (
                  <TouchableOpacity
                    style={[
                      styles.pipelineBtn,
                      { backgroundColor: Colors.secondary },
                    ]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Assigner coursier"
                  >
                    <Text style={styles.pipelineBtnText}>
                      Assigner Coursier →
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === "OUT_FOR_DELIVERY" && (
                  <TouchableOpacity
                    style={[
                      styles.pipelineBtn,
                      { backgroundColor: Colors.success },
                    ]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Marquer comme livrée"
                  >
                    <Text style={styles.pipelineBtnText}>Marquer Livrée →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        })}
      </ScrollView>

      {/* Ticket Cuisine Modal (Printable Slip) */}
      <Modal visible={!!ticketOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Printer
                  size={16}
                  color={Colors.textPrimary}
                  strokeWidth={2.0}
                />
                <Text style={styles.ticketTitle}>BON DE COMMANDE CUISINE</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTicketOrder(null)}
                accessibilityRole="button"
                accessibilityLabel="Fermer le bon de cuisine"
              >
                <X size={18} color={Colors.textMuted} strokeWidth={2.0} />
              </TouchableOpacity>
            </View>

            <View style={styles.ticketDivider} />

            <Text style={styles.ticketOrderNum}>
              Commande : {ticketOrder?.order_number}
            </Text>
            <Text style={styles.ticketDate}>
              Heure :{" "}
              {ticketOrder
                ? new Date(ticketOrder.created_at).toLocaleTimeString("fr-FR")
                : ""}
            </Text>
            <Text style={styles.ticketClient}>
              Client : {ticketOrder?.customer_name} (
              {ticketOrder?.customer_phone})
            </Text>
            <Text style={styles.ticketAddress}>
              Adresse : {ticketOrder?.delivery_address_text}
            </Text>

            <View style={styles.ticketDivider} />

            <Text style={styles.ticketItemsHeader}>DÉTAIL DES PLATS :</Text>
            {ticketOrder?.items?.map((item, idx) => (
              <View key={idx} style={styles.ticketItemRow}>
                <Text style={styles.ticketItemQty}>{item.quantity}x</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketItemName}>{item.product_name}</Text>
                  {item.selected_customizations_text && (
                    <Text style={styles.ticketItemOpt}>
                      • {item.selected_customizations_text}
                    </Text>
                  )}
                  {item.special_instructions && (
                    <Text style={styles.ticketItemNote}>
                      NOTE DU CHEF : "{item.special_instructions}"
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.ticketDivider} />

            <View style={styles.ticketTotalRow}>
              <Text style={styles.ticketTotalLabel}>TOTAL À ENCAISSER :</Text>
              <Text style={styles.ticketTotalValue}>
                {ticketOrder?.total.toFixed(2)} DH
              </Text>
            </View>

            <Button
              title="Imprimer le Bon de Cuisine"
              onPress={() => {
                Alert.alert(
                  "Impression",
                  "Bon envoyé à l'imprimante thermique de cuisine !",
                );
                setTicketOrder(null);
              }}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      {/* Courier Assign Modal */}
      <Modal visible={!!assignCourierOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.courierModalCard}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Bike size={18} color={Colors.primary} strokeWidth={2.0} />
                <Text style={styles.modalTitle}>
                  Assigner un coursier à Oujda
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAssignCourierOrder(null)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={18} color={Colors.textMuted} strokeWidth={2.0} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sélectionnez le livreur disponible pour{" "}
              {assignCourierOrder?.order_number} :
            </Text>

            {couriers.map((cour) => (
              <TouchableOpacity
                key={cour.id}
                style={styles.courierSelectOption}
                onPress={() => handleAssignCourier(cour)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Assigner à ${cour.name}`}
              >
                <Bike size={22} color={Colors.primary} strokeWidth={2.0} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.courierSelectName}>{cour.name}</Text>
                  <Text style={styles.courierSelectMeta}>
                    {cour.vehicle} • {cour.phone} • Note: {cour.rating}/5
                  </Text>
                </View>
                <View
                  style={[
                    styles.courierAvailBadge,
                    {
                      backgroundColor: cour.is_available
                        ? "#ECFDF5"
                        : "#FEF2F2",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.courierAvailText,
                      { color: cour.is_available ? "#059669" : "#DC2626" },
                    ]}
                  >
                    {cour.is_available ? "Disponible" : "En course"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        visible={!!selectedOrderForStatus}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Modifier le statut • {selectedOrderForStatus?.order_number}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedOrderForStatus(null)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={18} color={Colors.textMuted} strokeWidth={2.0} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sélectionnez le nouveau statut pour cette commande :
            </Text>

            {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map(
              (statusKey) => {
                const conf = ORDER_STATUS_CONFIG[statusKey];
                const isCurrent = selectedOrderForStatus?.status === statusKey;

                return (
                  <TouchableOpacity
                    key={statusKey}
                    style={[
                      styles.statusOption,
                      isCurrent && {
                        backgroundColor: conf.bgColor,
                        borderColor: conf.color,
                      },
                    ]}
                    onPress={() => handleUpdateStatus(statusKey)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Définir le statut à ${conf.label}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.statusOptionTitle,
                          { color: conf.color },
                        ]}
                      >
                        {conf.label}
                      </Text>
                      <Text style={styles.statusOptionDesc}>
                        {conf.description}
                      </Text>
                    </View>
                    {isCurrent && (
                      <CheckCircle2
                        size={16}
                        color={conf.color}
                        strokeWidth={2.2}
                      />
                    )}
                  </TouchableOpacity>
                );
              },
            )}

            {/* Permanent Delete Button for Admin */}
            {selectedOrderForStatus && (
              <TouchableOpacity
                style={styles.deleteOrderBtn}
                onPress={() => handleDeleteOrder(selectedOrderForStatus)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Supprimer définitivement la commande"
              >
                <Trash2
                  size={16}
                  color="#DC2626"
                  strokeWidth={2.0}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.deleteOrderBtnText}>
                  Supprimer définitivement de la base
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

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
    backgroundColor: Colors.background,
  },
  filterSection: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.mutedTint,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
  },
  listHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.primary,
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statusChangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemsList: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
    gap: 6,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primary,
    width: 22,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  customSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  customNote: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.warning,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  notesText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: "italic",
    flex: 1,
  },
  driverAssignedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.mutedTint,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  driverAssignedText: {
    fontSize: 11,
    color: Colors.primary,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 8,
    marginTop: 6,
  },
  paymentMethod: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  bold: {
    fontWeight: "900",
    color: Colors.textPrimary,
    fontSize: 14,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  printTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.mutedTint,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  printTicketText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  pipelineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pipelineBtnText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  ticketCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFDF5",
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FDE68A",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  },
  ticketDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginVertical: 10,
  },
  ticketOrderNum: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  ticketDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ticketClient: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 4,
  },
  ticketAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ticketItemsHeader: {
    fontSize: 12,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  ticketItemRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  ticketItemQty: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.primary,
  },
  ticketItemName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  ticketItemOpt: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ticketItemNote: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.warning,
    marginTop: 2,
  },
  ticketTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTotalLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  ticketTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.primary,
  },
  courierModalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  courierSelectOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    gap: 12,
  },
  courierSelectName: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  courierSelectMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  courierAvailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  courierAvailText: {
    fontSize: 10,
    fontWeight: "800",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
    gap: 12,
  },
  statusOptionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  statusOptionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  deleteOrderBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteOrderBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },
  prescriptionCardWrap: {
    marginTop: 8,
    marginBottom: 10,
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
    height: 120,
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
    fontWeight: "700",
    color: "#FFFFFF",
  },
  groceryCardWrap: {
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: Colors.mutedTint,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 12,
  },
  groceryBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  groceryBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  groceryContentBox: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  groceryListText: {
    fontSize: 14,
    color: Colors.darkText,
    lineHeight: 20,
  },
});
