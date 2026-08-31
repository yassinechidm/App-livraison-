import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import OrderTimeline from '@/components/ui/OrderTimeline';
import Colors from '@/constants/Colors';
import { orderService } from '@/services/order.service';
import { Order, ORDER_STATUS_CONFIG } from '@/types/order.types';

export default function ClientOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    loadOrders();
    const unsubscribe = orderService.subscribe(() => {
      loadOrders();
    });
    return unsubscribe;
  }, []);

  async function loadOrders() {
    const list = await orderService.getClientOrders();
    setOrders(list);
    // Auto expand the first active order
    const active = list.find((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
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
      'Panier mis à jour 🛒',
      'Tous les articles de cette commande ont été ajoutés à votre panier !',
      [
        {
          text: 'Voir mon panier',
          onPress: () => router.push('/(app)/(client)/(tabs)/cart' as any),
        },
      ]
    );
  }

  function handleOpenRating(order: Order) {
    setRatingOrder(order);
    setSelectedStars(order.rating || 5);
    setReviewComment(order.review_text || '');
  }

  async function handleSaveRating() {
    if (!ratingOrder) return;
    setIsSubmittingRating(true);
    try {
      await orderService.rateOrder(ratingOrder.id, selectedStars, reviewComment.trim() || undefined);
      setRatingOrder(null);
      await loadOrders();
      Alert.alert('Merci ! ⭐', 'Votre avis a été enregistré avec succès !');
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer votre avis.");
    } finally {
      setIsSubmittingRating(false);
    }
  }

  async function handleCancelOrder(order: Order) {
    Alert.alert(
      'Annuler la commande ?',
      `Êtes-vous sûr de vouloir annuler la commande ${order.order_number} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderService.cancelOrder(order.id, 'Annulée par le client');
              await loadOrders();
              Alert.alert('Commande annulée', 'Votre commande a été annulée avec succès.');
            } catch {
              Alert.alert('Erreur', "Impossible d'annuler la commande.");
            }
          },
        },
      ]
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
    if (selectedFilter === 'delivered') return o.status === 'DELIVERED';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'all' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            Toutes ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'active' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.filterText, selectedFilter === 'active' && styles.filterTextActive]}>
            En cours
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, selectedFilter === 'delivered' && styles.filterBtnActive]}
          onPress={() => setSelectedFilter('delivered')}
        >
          <Text style={[styles.filterText, selectedFilter === 'delivered' && styles.filterTextActive]}>
            Livrées
          </Text>
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
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune commande trouvée</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore passé de commande dans cette catégorie.
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status];
            const isExpanded = expandedOrderId === order.id;
            const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

            return (
              <Card key={order.id} style={styles.orderCard}>
                {/* Order Header */}
                <TouchableOpacity
                  onPress={() =>
                    setExpandedOrderId(isExpanded ? null : order.id)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderNumber}>{order.order_number}</Text>
                      <Text style={styles.orderDate}>
                        📅 {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusConfig.bgColor },
                      ]}
                    >
                      <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                      <Text
                        style={[styles.statusLabel, { color: statusConfig.color }]}
                      >
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.addressText}>
                    📍 {order.delivery_address_text}
                  </Text>
                </TouchableOpacity>

                {/* Live Countdown & Courier Box for Active Orders */}
                {isActive && (
                  <View style={styles.activeCourierBox}>
                    <View style={styles.courierHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.countdownTitle}>
                          ⚡ Livraison estimée : ~{order.estimated_delivery_minutes || 15} min
                        </Text>
                        <Text style={styles.courierName}>
                          🛵 {order.driver_name || 'Mehdi (Coursier QuickLivraison Oujda)'}
                        </Text>
                      </View>

                      {/* Direct Call & WhatsApp Buttons */}
                      <View style={styles.contactButtonsRow}>
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => Linking.openURL(`tel:${order.driver_phone || '+212661223344'}`)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.contactBtnText}>📞 Appeler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.whatsappBtn}
                          onPress={() => {
                            const cleanPhone = (order.driver_phone || '212661223344').replace(/[^0-9]/g, '');
                            Linking.openURL(
                              `https://wa.me/${cleanPhone}?text=Bonjour,%20je%20suis%20le%20client%20de%20la%20commande%20${order.order_number}`
                            );
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Live Timeline for order status */}
                <View style={styles.timelineWrapper}>
                  <OrderTimeline currentStatus={order.status} />
                </View>

                {/* Items Summary (Expandable) */}
                {isExpanded && order.items && order.items.length > 0 && (
                  <View style={styles.itemsSection}>
                    <Text style={styles.itemsSectionTitle}>Articles commandés :</Text>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
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
                              Note : "{item.special_instructions}"
                            </Text>
                          )}
                        </View>
                        <Text style={styles.itemPrice}>
                          {item.total_price.toFixed(2)} DH
                        </Text>
                      </View>
                    ))}
                    {order.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>📝 Note : {order.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Rating Display if already rated */}
                {order.status === 'DELIVERED' && order.rating && (
                  <View style={styles.ratedReviewBox}>
                    <Text style={styles.ratedStars}>
                      {'⭐'.repeat(order.rating)} ({order.rating}/5)
                    </Text>
                    {order.review_text ? (
                      <Text style={styles.ratedText}>"{order.review_text}"</Text>
                    ) : null}
                  </View>
                )}

                {/* Order Footer & Actions */}
                <View style={styles.cardFooter}>
                  <View style={styles.paymentMethodBox}>
                    <Text style={styles.paymentMethodText}>
                      {order.payment_method === 'TRANSFER'
                        ? '🏦 Virement'
                        : order.payment_method === 'CARD'
                        ? '💳 Carte'
                        : '💵 Cash'}
                    </Text>
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total : </Text>
                    <Text style={styles.totalValue}>{order.total.toFixed(2)} DH</Text>
                  </View>
                </View>

                {/* Action Buttons: Reorder, Cancel & Rate Order */}
                <View style={styles.bottomActionsRow}>
                  {['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status) && (
                    <TouchableOpacity
                      style={styles.cancelOrderBtn}
                      onPress={() => handleCancelOrder(order)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelOrderBtnText}>✕ Annuler</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => handleReorder(order)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reorderBtnText}>🔁 Commander à nouveau</Text>
                  </TouchableOpacity>

                  {order.status === 'DELIVERED' && (
                    <TouchableOpacity
                      style={styles.rateOrderBtn}
                      onPress={() => handleOpenRating(order)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.rateOrderBtnText}>
                        {order.rating ? '✏️ Modifier avis' : '⭐ Laisser un avis'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* 5-Star Rating Modal */}
      <Modal visible={!!ratingOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Noter votre repas</Text>
              <TouchableOpacity onPress={() => setRatingOrder(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Commande {ratingOrder?.order_number}
            </Text>

            {/* Stars Selector */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedStars(star)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.starEmoji, star <= selectedStars && styles.starSelected]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingHint}>
              {selectedStars === 5
                ? 'Excellent ! Délicieux et ultra-rapide 🌟'
                : selectedStars === 4
                ? 'Très bon repas 👍'
                : selectedStars === 3
                ? 'Correct 😐'
                : 'Peut être amélioré 👎'}
            </Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Écrivez un commentaire pour le restaurant (ex: Plats délicieux, livraison au top...)"
              placeholderTextColor={Colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Envoyer mon avis ⭐"
              onPress={handleSaveRating}
              isLoading={isSubmittingRating}
              style={{ marginTop: 14 }}
            />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusIcon: {
    fontSize: 11,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  addressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  activeCourierBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  courierHeader: {
    gap: 8,
  },
  countdownTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  courierName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  callBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  timelineWrapper: {
    marginVertical: 4,
  },
  itemsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    width: 24,
  },
  itemName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  customSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  customNote: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Colors.primary,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notesBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  notesText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  ratedReviewBox: {
    backgroundColor: '#FEFCE8',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  ratedStars: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CA8A04',
  },
  ratedText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paymentMethodBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reorderBtn: {
    flex: 1,
    backgroundColor: '#EBF2FF',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  cancelOrderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  rateOrderBtn: {
    flex: 1,
    backgroundColor: '#FEFCE8',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  rateOrderBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textMuted,
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starEmoji: {
    fontSize: 38,
    color: '#D1D5DB',
  },
  starSelected: {
    color: '#EAB308',
  },
  ratingHint: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 70,
  },
});
