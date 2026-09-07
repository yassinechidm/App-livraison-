import CartFloatingButton from '@/components/ui/CartFloatingButton';
import RestaurantCard from '@/components/ui/RestaurantCard';
import Colors from '@/constants/Colors';
import { OUJDA_NEIGHBORHOODS } from '@/constants/mockData';
import { locationService } from '@/services/location.service';
import { orderService } from '@/services/order.service';
import { restaurantService } from '@/services/restaurant.service';
import { Order } from '@/types/order.types';
import { Restaurant } from '@/types/restaurant.types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const DELIVEROO_CATEGORIES = [
  { id: 'promo', name: 'Offres', emoji: '🏷️', filter: 'promo' },
  { id: 'burgers', name: 'Burgers', emoji: '🍔', filter: 'burgers' },
  { id: 'pizzas', name: 'Pizzas', emoji: '🍕', filter: 'pizzas' },
  { id: 'shawarma', name: 'Tacos & Shawarma', emoji: '🌯', filter: 'shawarma' },
  { id: 'moroccan', name: 'Plats Marocains', emoji: '🍲', filter: 'moroccan' },
  { id: 'epicerie', name: 'Épicerie Hop', emoji: '🛒', filter: 'epicerie' },
  { id: 'desserts', name: 'Desserts', emoji: '🍰', filter: 'desserts' },
  { id: 'poulet', name: 'Poulet Frit', emoji: '🍗', filter: 'all' },
  { id: 'cafe', name: 'Café & Petit-déj', emoji: '☕', filter: 'all' },
];

export default function ClientHomeScreen() {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCity, setSelectedCity] = useState('Oujda — Hay Al Qods');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    loadData();
    const unsubResto = restaurantService.subscribe(() => {
      loadData();
    });
    return unsubResto;
  }, []);

  async function loadData() {
    const [orders, restos] = await Promise.all([
      orderService.getClientOrders(),
      restaurantService.getRestaurants(),
    ]);
    const inProgress = orders.find(
      (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );
    setActiveOrder(inProgress || null);
    setRestaurants(restos);
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

  // Filter restaurants according to category filter
  const filteredRestaurants = restaurants.filter((r) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'promo') return !!r.promo_badge || !!r.delivery_fee_promo;
    return r.cuisine_type.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const featuredRestaurants = restaurants.slice(0, 4);
  const promoRestaurants = restaurants.filter((r) => !!r.promo_badge || !!r.delivery_fee_promo);

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
        {/* Deliveroo Top Header : Toggle Livraison / À emporter */}
        <View style={styles.topBar}>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                deliveryMode === 'delivery' && styles.segmentBtnActive,
              ]}
              onPress={() => setDeliveryMode('delivery')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  deliveryMode === 'delivery' && styles.segmentTextActive,
                ]}
              >
                Livraison
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                deliveryMode === 'pickup' && styles.segmentBtnActive,
              ]}
              onPress={() => setDeliveryMode('pickup')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  deliveryMode === 'pickup' && styles.segmentTextActive,
                ]}
              >
                À emporter
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Picker Row (Deliveroo style) */}
        <View style={styles.locationSection}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => setShowLocationPicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationPin}>📍</Text>
            <View style={styles.locationTextWrapper}>
              <Text style={styles.locationLabel}>À côté de</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {selectedCity}
              </Text>
            </View>
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

        {/* Deliveroo Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(app)/(client)/(tabs)/catalog' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Plats, courses, restaurants...</Text>
        </TouchableOpacity>

        {/* Deliveroo Active Order Live Tracker */}
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
              <Text style={styles.liveOrderAddress} numberOfLines={1}>
                📍 {activeOrder.delivery_address_text}
              </Text>

              <View style={styles.liveOrderFooter}>
                <Text style={styles.liveOrderTotal}>
                  Total : <Text style={styles.bold}>{activeOrder.total.toFixed(2)} DH</Text>
                </Text>
                <Text style={styles.liveOrderAction}>Suivre en direct →</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Deliveroo Categories Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {DELIVEROO_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.filter;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => {
                  if (cat.id === 'epicerie') {
                    router.push('/(app)/(client)/(tabs)/catalog' as any);
                  } else {
                    setSelectedCategory(isSelected ? 'all' : cat.filter);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryEmojiCircle, isSelected && styles.categoryEmojiCircleActive]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Deliveroo Hero Promo Banners Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannersScroll}
        >
          {/* Banner 1 - Deliveroo Teal Promo */}
          <TouchableOpacity
            style={[styles.promoBannerCard, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/(app)/(client)/restaurants' as any)}
            activeOpacity={0.9}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>NOUVEAU CLIENT</Text>
              </View>
              <Text style={styles.bannerTitle}>Frais de livraison offerts</Text>
              <Text style={styles.bannerSubtitle}>Dès 100 DH de commande sur vos restaurants favoris.</Text>
            </View>
            <Text style={styles.bannerEmoji}>🛵</Text>
          </TouchableOpacity>

          {/* Banner 2 - Deliveroo Coral Promo */}
          <TouchableOpacity
            style={[styles.promoBannerCard, { backgroundColor: Colors.secondary }]}
            onPress={() => {
              setSelectedCategory('promo');
            }}
            activeOpacity={0.9}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerTagCoral}>
                <Text style={styles.bannerTagText}>BONS PLANS</Text>
              </View>
              <Text style={styles.bannerTitle}>Formules jusqu'à -25%</Text>
              <Text style={styles.bannerSubtitle}>Pizzas, burgers & tacos à prix cassés à Oujda !</Text>
            </View>
            <Text style={styles.bannerEmoji}>🍔</Text>
          </TouchableOpacity>

          {/* Banner 3 - Deliveroo Plus */}
          <TouchableOpacity
            style={[styles.promoBannerCard, { backgroundColor: Colors.plusPurple }]}
            onPress={() => router.push('/(app)/(client)/restaurants' as any)}
            activeOpacity={0.9}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerTagPurple}>
                <Text style={styles.bannerTagText}>QUICKLY PLUS</Text>
              </View>
              <Text style={styles.bannerTitle}>Livraison gratuite illimitée</Text>
              <Text style={styles.bannerSubtitle}>Économisez sur chaque commande au quotidien.</Text>
            </View>
            <Text style={styles.bannerEmoji}>✨</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section: À la une sur Quickly */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À la une sur Quickly</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(client)/restaurants' as any)}>
            <Text style={styles.sectionLink}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalRestoScroll}
        >
          {featuredRestaurants.map((resto) => (
            <View key={resto.id} style={styles.featuredRestoWrapper}>
              <RestaurantCard
                restaurant={resto}
                onPress={() => router.push(`/(app)/(client)/restaurant/${resto.id}` as any)}
              />
            </View>
          ))}
        </ScrollView>

        {/* Section: Offres du moment */}
        {promoRestaurants.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.sectionTitle}>Offres & Réductions</Text>
                <View style={styles.badgeCoralSmall}>
                  <Text style={styles.badgeCoralSmallText}>PROMO</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedCategory('promo')}>
                <Text style={styles.sectionLink}>Voir plus</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRestoScroll}
            >
              {promoRestaurants.map((resto) => (
                <View key={resto.id} style={styles.featuredRestoWrapper}>
                  <RestaurantCard
                    restaurant={resto}
                    onPress={() => router.push(`/(app)/(client)/restaurant/${resto.id}` as any)}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Section: Tous les restaurants */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all'
              ? 'Tous les restaurants à proximité'
              : `Restaurants • ${selectedCategory}`}
          </Text>
          <Text style={styles.sectionCount}>({filteredRestaurants.length})</Text>
        </View>

        <View style={styles.restaurantsVerticalList}>
          {filteredRestaurants.map((resto) => (
            <RestaurantCard
              key={resto.id}
              restaurant={resto}
              onPress={() => router.push(`/(app)/(client)/restaurant/${resto.id}` as any)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <CartFloatingButton />

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Lieu de livraison (Oujda)</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.gpsModalBtn}
              onPress={handleGetLiveLocation}
              disabled={isLocating}
            >
              <Text style={styles.gpsModalIcon}>🎯</Text>
              <Text style={styles.gpsModalText}>
                {isLocating ? 'Détection en cours...' : 'Me localiser automatiquement (GPS)'}
              </Text>
            </TouchableOpacity>

            <FlatList
              data={OUJDA_NEIGHBORHOODS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isActive = selectedCity.includes(item.split(' (')[0]);
                return (
                  <TouchableOpacity
                    style={[styles.cityItem, isActive && styles.cityItemActive]}
                    onPress={() => {
                      setSelectedCity(`Oujda — ${item.split(' (')[0]}`);
                      setShowLocationPicker(false);
                    }}
                  >
                    <Text style={styles.cityIcon}>{isActive ? '✓' : '📍'}</Text>
                    <Text style={[styles.cityText, isActive && { color: Colors.primary, fontWeight: '800' }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.backgroundWhite,
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundInput,
    borderRadius: 999,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.white,
    fontWeight: '800',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.backgroundWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationPin: {
    fontSize: 16,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  locationChevron: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '800',
  },
  gpsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIcon: {
    fontSize: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundInput,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.7,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  liveOrderCard: {
    backgroundColor: Colors.backgroundWhite,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  liveOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
  },
  liveOrderDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveOrderBadgeText: {
    color: Colors.primaryDeep,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  liveOrderEta: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  liveOrderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  liveOrderAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  liveOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  liveOrderTotal: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  liveOrderAction: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryChip: {
    alignItems: 'center',
    width: 72,
  },
  categoryChipActive: {
    transform: [{ scale: 1.04 }],
  },
  categoryEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmojiCircleActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryNameActive: {
    color: Colors.primaryDeep,
    fontWeight: '800',
  },
  bannersScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  promoBannerCard: {
    width: 280,
    height: 120,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerContent: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerTagCoral: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerTagPurple: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 14,
  },
  bannerEmoji: {
    fontSize: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  badgeCoralSmall: {
    backgroundColor: Colors.secondaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCoralSmallText: {
    color: Colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  horizontalRestoScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  featuredRestoWrapper: {
    width: 260,
  },
  restaurantsVerticalList: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: '800',
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
    backgroundColor: Colors.primaryMuted,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  gpsModalIcon: {
    fontSize: 18,
  },
  gpsModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  cityItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  cityIcon: {
    fontSize: 14,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
