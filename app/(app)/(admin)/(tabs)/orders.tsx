import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { orderService } from '@/services/order.service';
import { courierService, Courier } from '@/services/courier.service';
import { Order, OrderStatus, ORDER_STATUS_CONFIG } from '@/types/order.types';

const STATUS_FILTERS: (OrderStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<Order | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [assignCourierOrder, setAssignCourierOrder] = useState<Order | null>(null);
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
    if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
      nextStatus = 'PREPARING';
    } else if (order.status === 'PREPARING') {
      nextStatus = 'READY';
    } else if (order.status === 'READY') {
      setAssignCourierOrder(order);
      return;
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      nextStatus = 'DELIVERED';
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
        courier.phone
      );
      setAssignCourierOrder(null);
      await loadData();
      Alert.alert('Coursier assigné ! 🛵', `La commande est maintenant confiée à ${courier.name}.`);
    } catch {
      Alert.alert('Erreur', "Impossible d'assigner le coursier.");
    }
  }

  async function handleUpdateStatus(newStatus: OrderStatus) {
    if (!selectedOrderForStatus) return;

    try {
      await orderService.updateOrderStatus(selectedOrderForStatus.id, newStatus);
      setSelectedOrderForStatus(null);
      await loadData();
      Alert.alert(
        'Statut mis à jour',
        `La commande ${selectedOrderForStatus.order_number} est maintenant "${ORDER_STATUS_CONFIG[newStatus].label}".`
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut.');
    }
  }

  async function handleDeleteOrder(order: Order) {
    Alert.alert(
      'Supprimer définitivement ?',
      `Voulez-vous supprimer définitivement la commande ${order.order_number} de la base de données ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.deleteOrder(order.id);
              setSelectedOrderForStatus(null);
              await loadData();
              Alert.alert('Supprimée', 'La commande a été supprimée avec succès.');
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer la commande.');
            }
          },
        },
      ]
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
            const isAll = st === 'ALL';
            const label = isAll ? 'Toutes' : ORDER_STATUS_CONFIG[st].label;
            const icon = isAll ? '📋' : ORDER_STATUS_CONFIG[st].icon;
            const isSelected = selectedFilter === st;

            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setSelectedFilter(st)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {icon} {label}
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
        <Text style={styles.listHeader}>
          {orders.length} {orders.length > 1 ? 'commandes' : 'commande'} • Gestion de cuisine & dispatch
        </Text>

        {orders.map((order) => {
          const config = ORDER_STATUS_CONFIG[order.status];

          return (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.customerName}>
                    👤 {order.customer_name} • {order.customer_phone}
                  </Text>
                </View>

                {/* Status Changer Button */}
                <TouchableOpacity
                  style={[
                    styles.statusChangeBtn,
                    { backgroundColor: config.bgColor, borderColor: config.color + '40' },
                  ]}
                  onPress={() => setSelectedOrderForStatus(order)}
                >
                  <Text style={styles.statusIcon}>{config.icon}</Text>
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label} ▾
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.addressText}>📍 {order.delivery_address_text}</Text>

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

              {order.notes ? (
                <Text style={styles.notesText}>📝 Instructions client : {order.notes}</Text>
              ) : null}

              {/* Courier info if assigned */}
              {order.driver_name && (
                <View style={styles.driverAssignedBox}>
                  <Text style={styles.driverAssignedText}>
                    🛵 Coursier : <Text style={{ fontWeight: '800' }}>{order.driver_name}</Text> ({order.driver_phone})
                  </Text>
                </View>
              )}

              <View style={styles.orderFooter}>
                <Text style={styles.paymentMethod}>
                  {order.payment_method === 'TRANSFER'
                    ? '🏦 Virement Bancaire'
                    : order.payment_method === 'CARD'
                    ? '💳 Carte'
                    : '💵 Cash'} • Total :{' '}
                  <Text style={styles.bold}>{order.total.toFixed(2)} DH</Text>
                </Text>
              </View>

              {/* Quick 1-Click Action Buttons for Kitchen Pipeline */}
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.printTicketBtn}
                  onPress={() => setTicketOrder(order)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.printTicketText}>🧾 Bon Cuisine</Text>
                </TouchableOpacity>

                {order.status === 'PENDING' && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: '#8B5CF6' }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pipelineBtnText}>🍳 Lancer en cuisine →</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'PREPARING' && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: '#06B6D4' }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pipelineBtnText}>🛍️ Marquer Prête →</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'READY' && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: '#FF6B00' }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pipelineBtnText}>🛵 Assigner Coursier →</Text>
                  </TouchableOpacity>
                )}

                {order.status === 'OUT_FOR_DELIVERY' && (
                  <TouchableOpacity
                    style={[styles.pipelineBtn, { backgroundColor: '#00B602' }]}
                    onPress={() => handleQuickAdvance(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pipelineBtnText}>✅ Marquer Livrée →</Text>
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
              <Text style={styles.ticketTitle}>🧾 BON DE COMMANDE CUISINE</Text>
              <TouchableOpacity onPress={() => setTicketOrder(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticketDivider} />

            <Text style={styles.ticketOrderNum}>
              Commande : {ticketOrder?.order_number}
            </Text>
            <Text style={styles.ticketDate}>
              Heure : {ticketOrder ? new Date(ticketOrder.created_at).toLocaleTimeString('fr-FR') : ''}
            </Text>
            <Text style={styles.ticketClient}>
              Client : {ticketOrder?.customer_name} ({ticketOrder?.customer_phone})
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
                      ⚠️ NOTE DU CHEF : "{item.special_instructions}"
                    </Text>
                  )}
                </View>
              </View>
            ))}

            <View style={styles.ticketDivider} />

            <View style={styles.ticketTotalRow}>
              <Text style={styles.ticketTotalLabel}>TOTAL À ENCAISSER :</Text>
              <Text style={styles.ticketTotalValue}>{ticketOrder?.total.toFixed(2)} DH</Text>
            </View>

            <Button
              title="🖨️ Imprimer le Bon de Cuisine"
              onPress={() => {
                Alert.alert('Impression', 'Bon envoyé à l\'imprimante thermique de cuisine !');
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
              <Text style={styles.modalTitle}>🛵 Assigner un coursier à Oujda</Text>
              <TouchableOpacity onPress={() => setAssignCourierOrder(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sélectionnez le livreur disponible pour {assignCourierOrder?.order_number} :
            </Text>

            {couriers.map((cour) => (
              <TouchableOpacity
                key={cour.id}
                style={styles.courierSelectOption}
                onPress={() => handleAssignCourier(cour)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 24 }}>🛵</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courierSelectName}>{cour.name}</Text>
                  <Text style={styles.courierSelectMeta}>
                    {cour.vehicle} • 📞 {cour.phone} • ⭐ {cour.rating}/5
                  </Text>
                </View>
                <View
                  style={[
                    styles.courierAvailBadge,
                    { backgroundColor: cour.is_available ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.courierAvailText,
                      { color: cour.is_available ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {cour.is_available ? 'Disponible' : 'En course'}
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
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sélectionnez le nouveau statut pour cette commande :
            </Text>

            {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((statusKey) => {
              const conf = ORDER_STATUS_CONFIG[statusKey];
              const isCurrent = selectedOrderForStatus?.status === statusKey;

              return (
                <TouchableOpacity
                  key={statusKey}
                  style={[
                    styles.statusOption,
                    isCurrent && { backgroundColor: conf.bgColor, borderColor: conf.color },
                  ]}
                  onPress={() => handleUpdateStatus(statusKey)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.statusOptionIcon}>{conf.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statusOptionTitle, { color: conf.color }]}>
                      {conf.label}
                    </Text>
                    <Text style={styles.statusOptionDesc}>
                      {conf.description}
                    </Text>
                  </View>
                  {isCurrent && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Permanent Delete Button for Admin */}
            {selectedOrderForStatus && (
              <TouchableOpacity
                style={styles.deleteOrderBtn}
                onPress={() => handleDeleteOrder(selectedOrderForStatus)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteOrderBtnText}>🗑️ Supprimer définitivement de la base</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterSection: {
    backgroundColor: Colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  listHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  customerName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  statusIcon: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  itemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
    gap: 6,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    width: 22,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  customNote: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notesText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  driverAssignedBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  driverAssignedText: {
    fontSize: 11,
    color: Colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 6,
  },
  paymentMethod: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '900',
    color: Colors.textPrimary,
    fontSize: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  printTicketBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
  },
  printTicketText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pipelineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFDF5',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  },
  ticketDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 10,
  },
  ticketOrderNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ticketDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ticketClient: {
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  ticketItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  ticketItemQty: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  ticketItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ticketItemOpt: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ticketItemNote: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D97706',
    marginTop: 2,
  },
  ticketTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  ticketTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  courierModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  courierSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  courierSelectName: {
    fontSize: 13,
    fontWeight: '800',
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
    fontWeight: '800',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  statusOptionIcon: {
    fontSize: 18,
  },
  statusOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusOptionDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  deleteOrderBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteOrderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});
