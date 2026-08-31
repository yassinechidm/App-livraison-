import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import CartFloatingButton from '@/components/ui/CartFloatingButton';
import Colors from '@/constants/Colors';
import { orderService } from '@/services/order.service';
import { locationService } from '@/services/location.service';
import { OUJDA_NEIGHBORHOODS } from '@/constants/mockData';
import { Order } from '@/types/order.types';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCity, setSelectedCity] = useState('Oujda — Hay Al Qods');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const orders = await orderService.getClientOrders();
    const inProgress = orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );
    setActiveOrder(inProgress || null);
  }

  async function handleGetLiveLocation() {
    setIsLocating(true);
    try {
      const res = await locationService.getCurrentLocation();
      setSelectedCity(`Oujda — ${res.neighborhood}`);
      setShowLocationPicker(false);
    } catch {
      setSelectedCity('Oujda — Centre-Ville');
    } finally {
      setIsLocating(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
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
        {/* Top Header Location Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setShowLocationPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationHomeIcon}>🏠</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {selectedCity}
            </Text>
            <Text style={styles.locationChevron}>⌄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleGetLiveLocation}
            disabled={isLocating}
          >
            <Text style={styles.gpsIcon}>{isLocating ? '⏳' : '🎯'}</Text>
          </TouchableOpacity>
        </View>

        {/* Live Active Order Tracking Banner */}
        {activeOrder && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(app)/(client)/(tabs)/orders' as any)}
          >
            <View style={styles.liveOrderCard}>
              <View style={styles.liveOrderHeader}>
                <View style={styles.liveOrderBadge}>
                  <View style={styles.liveOrderDot} />
                  <Text style={styles.liveOrderBadgeText}>COMMANDE EN COURS</Text>
                </View>
                <Text style={styles.liveOrderEta}>~ {activeOrder.estimated_delivery_minutes} min</Text>
              </View>

              <Text style={styles.liveOrderNumber}>{activeOrder.order_number}</Text>
              <Text style={styles.liveOrderAddress}>📍 {activeOrder.delivery_address_text}</Text>

              <View style={styles.liveOrderFooter}>
                <Text style={styles.liveOrderTotal}>
                  Total : <Text style={styles.bold}>{activeOrder.total.toFixed(2)} DH</Text>
                </Text>
                <Text style={styles.liveOrderAction}>Suivre en direct →</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 4 Large Glovo Hub Bubbles (Exact Screenshot 1 Layout) */}
        <View style={styles.glovoBubblesContainer}>
          <View style={styles.bubblesRow}>
            {/* 1. Restaurants & Snacks */}
            <TouchableOpacity
              style={styles.bubbleCard}
              onPress={() => router.push('/(app)/(client)/restaurants' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.bubbleCircle, { backgroundColor: '#FFF0E5', borderColor: '#FFB87A' }]}>
                <Text style={styles.bubbleEmoji}>🍔</Text>
              </View>
              <View style={styles.bubbleLabelPill}>
                <Text style={styles.bubbleLabelText}>Restaurants</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Courses / Supermarché */}
            <TouchableOpacity
              style={styles.bubbleCard}
              onPress={() => router.push('/(app)/(client)/(tabs)/catalog' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.bubbleCircle, { backgroundColor: '#E6F8E6', borderColor: '#8CE38C' }]}>
                <Text style={styles.bubbleEmoji}>🛒</Text>
              </View>
              <View style={styles.bubbleLabelPill}>
                <Text style={styles.bubbleLabelText}>Courses</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bubblesRow}>
            {/* 3. Boutiques */}
            <TouchableOpacity
              style={styles.bubbleCard}
              onPress={() => router.push('/(app)/(client)/(tabs)/catalog' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.bubbleCircle, { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }]}>
                <Text style={styles.bubbleEmoji}>🛍️</Text>
              </View>
              <View style={styles.bubbleLabelPill}>
                <Text style={styles.bubbleLabelText}>Boutiques</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Service Coursier */}
            <TouchableOpacity
              style={styles.bubbleCard}
              onPress={() => router.push('/(app)/(client)/(tabs)/catalog' as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.bubbleCircle, { backgroundColor: '#EBF2FF', borderColor: '#93C5FD' }]}>
                <Text style={styles.bubbleEmoji}>🛵</Text>
              </View>
              <View style={styles.bubbleLabelPill}>
                <Text style={styles.bubbleLabelText}>Service Coursier</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <CartFloatingButton />

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Quartier de livraison (Oujda)</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.gpsModalBtn}
              onPress={handleGetLiveLocation}
              disabled={isLocating}
            >
              <Text style={styles.gpsModalIcon}>{isLocating ? '⏳' : '🎯'}</Text>
              <Text style={styles.gpsModalText}>
                {isLocating ? 'Recherche GPS en cours...' : 'Position GPS automatique'}
              </Text>
            </TouchableOpacity>

            <FlatList
              data={OUJDA_NEIGHBORHOODS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedCity.includes(item.split(' ')[0]) && styles.cityItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCity(`Oujda — ${item}`);
                    setShowLocationPicker(false);
                  }}
                >
                  <Text style={styles.cityIcon}>📍</Text>
                  <Text style={styles.cityText}>{item}</Text>
                </TouchableOpacity>
              )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationHomeIcon: {
    fontSize: 18,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  locationChevron: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  gpsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsIcon: {
    fontSize: 22,
  },
  liveOrderCard: {
    backgroundColor: '#FFF0E5',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD4B2',
  },
  liveOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveOrderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveOrderBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
  },
  liveOrderEta: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.primary,
  },
  liveOrderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveOrderAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  liveOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFDFBF',
    paddingTop: 8,
  },
  liveOrderTotal: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  bold: {
    fontWeight: '900',
  },
  liveOrderAction: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.primary,
  },
  glovoBubblesContainer: {
    marginVertical: 10,
    gap: 20,
  },
  bubblesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  bubbleCard: {
    alignItems: 'center',
  },
  bubbleCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  bubbleEmoji: {
    fontSize: 56,
  },
  bubbleLabelPill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    marginTop: -16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleLabelText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
  gpsModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 14,
  },
  gpsModalIcon: {
    fontSize: 18,
  },
  gpsModalText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  cityItemActive: {
    backgroundColor: '#F8FAFF',
  },
  cityIcon: {
    fontSize: 14,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
