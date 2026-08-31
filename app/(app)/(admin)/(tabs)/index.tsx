import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { adminService, AdminDashboardStats } from '@/services/admin.service';
import { orderService } from '@/services/order.service';
import { courierService, Courier } from '@/services/courier.service';
import { promoService, PromoCode } from '@/services/promo.service';
import { Order, ORDER_STATUS_CONFIG } from '@/types/order.types';

// Top selling dishes computed dynamically from real orders
function computeTopSellingDishes(allOrders: Order[]) {
  const dishMap: Record<string, { name: string; orders: number; revenue: number }> = {};
  for (const order of allOrders) {
    if (!order.items) continue;
    for (const item of order.items) {
      const key = item.product_name || item.product_id;
      if (!dishMap[key]) {
        dishMap[key] = { name: item.product_name || key, orders: 0, revenue: 0 };
      }
      dishMap[key].orders += item.quantity;
      dishMap[key].revenue += item.total_price || item.unit_price * item.quantity;
    }
  }
  const sorted = Object.values(dishMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxOrders = sorted.length > 0 ? sorted[0].orders : 1;
  const EMOJIS = ['🥇', '🥈', '🥉', '🍽️', '🍽️'];
  return sorted.map((d, i) => ({
    name: d.name,
    orders: d.orders,
    revenue: d.revenue,
    percent: Math.round((d.orders / maxOrders) * 100),
    emoji: EMOJIS[i] || '🍽️',
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
    const interval = setInterval(() => {
      loadDashboard();
    }, 3000);
    return () => {
      unsubscribe();
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
  const avgRating = ratedOrders.length > 0
    ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
    : '—';

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
          <Text style={styles.greetingTitle}>Bonjour Administrateur 👋</Text>
          <Text style={styles.greetingSub}>
            Supervision des snacks, commandes & coursiers à Oujda
          </Text>
        </View>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>👑 ADMIN</Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Turnover KPI */}
        <Card style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <Text style={styles.kpiEmoji}>💰</Text>
          <Text style={styles.kpiValue}>
            {totalTurnover.toFixed(2)}{' '}
            <Text style={styles.kpiUnit}>MAD</Text>
          </Text>
          <Text style={styles.kpiLabel}>Chiffre d'affaires cumulé</Text>
        </Card>

        {/* Average Basket */}
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>🛒</Text>
          <Text style={[styles.kpiValue, { color: Colors.primary }]}>
            {averageBasket.toFixed(2)}{' '}
            <Text style={styles.kpiUnit}>MAD</Text>
          </Text>
          <Text style={styles.kpiLabel}>Panier Moyen Client</Text>
        </Card>

        {/* Pending Orders KPI */}
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>🍳</Text>
          <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
            {orders.filter((o) => o.status === 'PREPARING' || o.status === 'PENDING').length}
          </Text>
          <Text style={styles.kpiLabel}>En Cuisine / Attente</Text>
        </Card>

        {/* Out for Delivery KPI */}
        <Card style={styles.kpiCard}>
          <Text style={styles.kpiEmoji}>🛵</Text>
          <Text style={[styles.kpiValue, { color: '#FF6B00' }]}>
            {orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length}
          </Text>
          <Text style={styles.kpiLabel}>Livreurs en Course</Text>
        </Card>
      </View>

      {/* Secondary Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>🛵 {couriers.filter((c) => c.is_available).length}/{couriers.length}</Text>
          <Text style={styles.metricLbl}>Livreurs dispo</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>⭐ {avgRating}{ratedOrders.length > 0 ? '/5' : ''}</Text>
          <Text style={styles.metricLbl}>Satisfaction ({ratedOrders.length} avis)</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>✅ {orders.filter((o) => o.status === 'DELIVERED').length}</Text>
          <Text style={styles.metricLbl}>Livrées à Oujda</Text>
        </View>
      </View>

      {/* Quick Admin Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Actions Rapides</Text>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#EBF2FF' }]}
          onPress={() => router.push('/(app)/(admin)/(tabs)/orders' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>🍳</Text>
          <Text style={[styles.actionText, { color: Colors.primary }]}>
            Vue Cuisine Kanban
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}
          onPress={() => router.push('/(app)/(admin)/(tabs)/products' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>🍔</Text>
          <Text style={[styles.actionText, { color: Colors.secondary }]}>
            Gérer Menus & Plats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFFBEB' }]}
          onPress={() => router.push('/(app)/(admin)/(tabs)/categories' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>🏷️</Text>
          <Text style={[styles.actionText, { color: '#B45309' }]}>
            Codes Promo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Top Selling Dishes — Dynamic from orders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Top des Plats les plus vendus</Text>
      </View>

      <Card style={styles.topSellingCard}>
        {topSellingDishes.length === 0 ? (
          <Text style={{ textAlign: 'center', color: Colors.textMuted, padding: 16 }}>
            Aucune donnée — les statistiques apparaîtront après les premières commandes.
          </Text>
        ) : (
          topSellingDishes.map((dish, index) => (
            <View key={index} style={styles.topSellingRow}>
              <View style={styles.topSellingHeaderRow}>
                <Text style={styles.topSellingDishName}>
                  {dish.emoji} {dish.name}
                </Text>
                <Text style={styles.topSellingDishRevenue}>
                  {dish.revenue.toLocaleString()} MAD ({dish.orders}x)
                </Text>
              </View>

              <View style={styles.topSellingProgressBg}>
                <View
                  style={[
                    styles.topSellingProgressFill,
                    { width: `${dish.percent}%`, backgroundColor: index === 0 ? Colors.primary : Colors.secondary },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Couriers Fleet Status */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🛵 Flotte de Coursiers (Oujda Express)</Text>
      </View>

      <Card style={styles.couriersCard}>
        {couriers.map((courier) => (
          <View key={courier.id} style={styles.courierRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.courierName}>{courier.name}</Text>
                <View
                  style={[
                    styles.courierStatusPill,
                    { backgroundColor: courier.is_available ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.courierStatusText,
                      { color: courier.is_available ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {courier.is_available ? '● Disponible' : '● En course'}
                  </Text>
                </View>
              </View>
              <Text style={styles.courierMeta}>
                {courier.vehicle} • 📞 {courier.phone} • ⭐ {courier.rating}/5
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Recent Reviews & Ratings from Clients */}
      {ratedOrders.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Derniers Avis Clients</Text>
          </View>

          {ratedOrders.map((order) => (
            <Card key={order.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewCustomer}>👤 {order.customer_name}</Text>
                <Text style={styles.reviewStars}>
                  {'⭐'.repeat(order.rating || 5)}
                </Text>
              </View>
              <Text style={styles.reviewComment}>
                "{order.review_text || 'Superbe service de livraison !'}"
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
          onPress={() => router.push('/(app)/(admin)/(tabs)/orders' as any)}
        >
          <Text style={styles.seeAll}>Vue Kanban →</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.map((order) => {
        const config = ORDER_STATUS_CONFIG[order.status];
        return (
          <TouchableOpacity
            key={order.id}
            onPress={() => router.push('/(app)/(admin)/(tabs)/orders' as any)}
            activeOpacity={0.85}
          >
            <Card style={styles.orderPreviewCard}>
              <View style={styles.orderPreviewHeader}>
                <View>
                  <Text style={styles.orderPreviewNumber}>{order.order_number}</Text>
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
                  {order.items?.length || 1} article(s) •{' '}
                  {order.payment_method === 'CARD' ? '💳 Carte' : '💵 Cash'}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  greetingSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiCardHighlight: {
    backgroundColor: '#F8FAFF',
    borderColor: Colors.primary + '40',
  },
  kpiEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLbl: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  topSellingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  topSellingRow: {
    gap: 4,
  },
  topSellingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSellingDishName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  topSellingDishRevenue: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  topSellingProgressBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  topSellingProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  couriersCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  courierRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  courierName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  courierStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courierStatusText: {
    fontSize: 10,
    fontWeight: '800',
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
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewCustomer: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reviewStars: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
    borderColor: '#E2E8F0',
  },
  orderPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  orderPreviewNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  orderPreviewCustomer: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
  },
  orderPreviewAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  orderPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  orderPreviewItems: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderPreviewTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
});
