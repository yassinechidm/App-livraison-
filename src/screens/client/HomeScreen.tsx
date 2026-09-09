import { useRouter } from "expo-router";
import {
    ArrowRight,
    Bell,
    Bike,
    ChevronDown,
    Clock,
    MapPin,
    Search,
    SlidersHorizontal,
    Tag,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Chip, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import { cartService } from "@/services/cart.service";
import { orderService } from "@/services/order.service";
import { restaurantService } from "@/services/restaurant.service";
import {
    AppButton,
    CategoryCard,
    EmptyState,
    LoadingState,
    LocationPickerModal,
    RestaurantCard,
} from "@/src/components";
import { borderRadius, colors, spacing } from "@/src/theme";
import { Order } from "@/src/types/order.types";
import { CategoryItem, Restaurant } from "@/src/types/restaurant.types";

const CATEGORIES: CategoryItem[] = [
  { id: "all", name: "Tous", iconName: "UtensilsCrossed" },
  { id: "popular", name: "Populaires", iconName: "Flame" },
  { id: "burgers", name: "Burgers", iconName: "UtensilsCrossed" },
  { id: "pizzas", name: "Pizzas", iconName: "Pizza" },
  { id: "shawarma", name: "Tacos", iconName: "UtensilsCrossed" },
  { id: "moroccan", name: "Marocain", iconName: "UtensilsCrossed" },
  { id: "cafe", name: "Café & Doux", iconName: "Coffee" },
  { id: "healthy", name: "Salades", iconName: "Salad" },
  { id: "grocery", name: "Courses", iconName: "ShoppingBag" },
];

export const HomeScreen: React.FC = () => {
  const router = useRouter();

  // States
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [selectedCity, setSelectedCity] = useState("Oujda — Hay Al Qods");
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "free_delivery" | "top_rated" | "fast"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartState, setCartState] = useState(cartService.getState());

  useEffect(() => {
    loadData();
    const unsubRestos = restaurantService.subscribe(loadData);
    const unsubCart = cartService.subscribe(setCartState);
    return () => {
      unsubRestos();
      unsubCart();
    };
  }, []);

  async function loadData() {
    try {
      const [orders, restos] = await Promise.all([
        orderService.getClientOrders(),
        restaurantService.getRestaurants(),
      ]);
      const ongoingOrder = orders.find(
        (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
      );
      setActiveOrder(ongoingOrder || null);
      setRestaurants(restos);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Filter logic
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = restaurant.name.toLowerCase().includes(query);
        const matchesCuisine = restaurant.cuisine_type
          .toLowerCase()
          .includes(query);
        if (!matchesName && !matchesCuisine) return false;
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "popular") {
          if (!restaurant.is_top_rated && restaurant.rating_percent < 90)
            return false;
        } else {
          const cuisineLower = restaurant.cuisine_type.toLowerCase();
          if (!cuisineLower.includes(selectedCategory)) return false;
        }
      }

      // Secondary pill filter
      if (activeFilter === "free_delivery" && restaurant.delivery_fee !== 0)
        return false;
      if (activeFilter === "top_rated" && restaurant.rating_percent < 95)
        return false;
      if (
        activeFilter === "fast" &&
        !restaurant.delivery_time.includes("15") &&
        !restaurant.delivery_time.includes("20")
      )
        return false;

      return true;
    });
  }, [restaurants, searchQuery, selectedCategory, activeFilter]);

  const popularRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => r.is_top_rated || r.rating_percent >= 90)
      .slice(0, 5);
  }, [restaurants]);

  const promoRestaurants = useMemo(() => {
    return restaurants.filter((r) => !!r.promo_badge || r.delivery_fee === 0);
  }, [restaurants]);

  const openRestaurant = (restaurant: Restaurant) => {
    router.push(`/(app)/(client)/restaurant/${restaurant.id}` as any);
  };

  if (isLoading) {
    return <LoadingState fullScreen message="Chargement des restaurants..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ── Top Header (Dribbble Style) ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => setIsLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.locationIconPill}>
            <MapPin size={16} color={colors.primary} />
          </View>
          <View style={styles.locationTexts}>
            <Text variant="labelSmall" style={styles.locationEyebrow}>
              LIVRER À
            </Text>
            <View style={styles.locationRow}>
              <Text
                variant="titleSmall"
                style={styles.locationTitle}
                numberOfLines={1}
              >
                {selectedCity}
              </Text>
              <ChevronDown size={14} color={colors.text} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/(app)/(client)/(tabs)/orders" as any)}
            activeOpacity={0.7}
          >
            <Bell size={20} color={colors.text} />
            {activeOrder && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={18} color={colors.textSecondary} />
            <Text
              style={styles.searchPlaceholder}
              onPress={() =>
                router.push("/(app)/(client)/(tabs)/catalog" as any)
              }
            >
              Plats, restos, burgers, sushis...
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push("/(app)/(client)/(tabs)/catalog" as any)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* ── Active Live Order Tracker Banner ── */}
        {activeOrder && (
          <Surface elevation={1} style={styles.activeOrderCard}>
            <View style={styles.activeOrderIconCircle}>
              <Bike size={20} color={colors.textInverse} />
            </View>
            <View style={styles.activeOrderInfo}>
              <Text style={styles.activeOrderEyebrow}>COMMANDE EN ROUTE</Text>
              <Text style={styles.activeOrderTitle}>
                Arrivée estimée : {activeOrder.estimated_delivery_minutes} min
              </Text>
              <Text style={styles.activeOrderRef}>
                #{activeOrder.order_number}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.trackActionBtn}
              onPress={() =>
                router.push("/(app)/(client)/(tabs)/orders" as any)
              }
            >
              <ArrowRight size={18} color={colors.primary} />
            </TouchableOpacity>
          </Surface>
        )}

        {/* ── Dribbble Hero Promo Banners ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bannersScroll}
          decelerationRate="fast"
          snapToInterval={310}
        >
          {/* Banner 1: Free Delivery */}
          <Surface style={[styles.bannerCard, styles.bannerBlue]} elevation={0}>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>OFFRE SPÉCIALE</Text>
            </View>
            <Text style={styles.bannerHeading}>Livraison 100% offerte</Text>
            <Text style={styles.bannerSub}>
              Sur votre première commande avec le code QUICKLY
            </Text>
            <AppButton
              title="En profiter"
              size="sm"
              variant="secondary"
              style={styles.bannerCta}
              onPress={() => router.push("/(app)/(client)/restaurants" as any)}
            />
          </Surface>

          {/* Banner 2: Mega Deals */}
          <Surface style={[styles.bannerCard, styles.bannerWarm]} elevation={0}>
            <View style={[styles.bannerBadge, styles.bannerBadgeWarm]}>
              <Tag size={10} color={colors.textInverse} />
              <Text style={styles.bannerBadgeText}>PROMOS FLASH</Text>
            </View>
            <Text style={[styles.bannerHeading, styles.bannerHeadingDark]}>
              Jusqu'à -30%
            </Text>
            <Text style={[styles.bannerSub, styles.bannerSubDark]}>
              Sur les meilleurs burgers et tacos d'Oujda
            </Text>
            <AppButton
              title="Voir les offres"
              size="sm"
              variant="primary"
              style={styles.bannerCta}
              onPress={() => setActiveFilter("free_delivery")}
            />
          </Surface>
        </ScrollView>

        {/* ── Category Chips / Carousel ── */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Que voulez-vous manger ?
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategory === cat.id}
              onPress={(c) => {
                if (c.id === "grocery") {
                  router.push("/(app)/(client)/(tabs)/catalog" as any);
                } else {
                  setSelectedCategory(selectedCategory === c.id ? "all" : c.id);
                }
              }}
            />
          ))}
        </ScrollView>

        {/* ── Popular Horizontal Rail ── */}
        {popularRestaurants.length > 0 && selectedCategory === "all" && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Populaires à proximité 🔥
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  Les adresses favorites de la communauté
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(app)/(client)/restaurants" as any)
                }
              >
                <Text style={styles.seeAllLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRailScroll}
            >
              {popularRestaurants.map((resto) => (
                <View key={resto.id} style={styles.compactCardWrapper}>
                  <RestaurantCard
                    restaurant={resto}
                    variant="compact"
                    onPress={openRestaurant}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Promo Rail ── */}
        {promoRestaurants.length > 0 && selectedCategory === "all" && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Bons plans & Offres 🏷️
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  Livraison gratuite ou réductions du jour
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveFilter("free_delivery")}
              >
                <Text style={styles.seeAllLink}>Filtrer</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRailScroll}
            >
              {promoRestaurants.map((resto) => (
                <View key={resto.id} style={styles.compactCardWrapper}>
                  <RestaurantCard
                    restaurant={resto}
                    variant="compact"
                    onPress={openRestaurant}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Filter Pills for Main List ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tous les restaurants
            </Text>
            <Text variant="bodySmall" style={styles.sectionSubtitle}>
              {filteredRestaurants.length} adresses ouvertes à Oujda
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <Chip
            selected={activeFilter === "all"}
            onPress={() => setActiveFilter("all")}
            style={styles.filterChip}
            textStyle={
              activeFilter === "all"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
          >
            Tous
          </Chip>
          <Chip
            selected={activeFilter === "free_delivery"}
            onPress={() =>
              setActiveFilter(
                activeFilter === "free_delivery" ? "all" : "free_delivery",
              )
            }
            style={styles.filterChip}
            textStyle={
              activeFilter === "free_delivery"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
            icon={() => (
              <Bike
                size={14}
                color={
                  activeFilter === "free_delivery"
                    ? colors.primaryDark
                    : colors.textSecondary
                }
              />
            )}
          >
            Livraison offerte
          </Chip>
          <Chip
            selected={activeFilter === "top_rated"}
            onPress={() =>
              setActiveFilter(
                activeFilter === "top_rated" ? "all" : "top_rated",
              )
            }
            style={styles.filterChip}
            textStyle={
              activeFilter === "top_rated"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
          >
            ★ 4.5+
          </Chip>
          <Chip
            selected={activeFilter === "fast"}
            onPress={() =>
              setActiveFilter(activeFilter === "fast" ? "all" : "fast")
            }
            style={styles.filterChip}
            textStyle={
              activeFilter === "fast"
                ? styles.filterChipTextActive
                : styles.filterChipText
            }
            icon={() => (
              <Clock
                size={14}
                color={
                  activeFilter === "fast"
                    ? colors.primaryDark
                    : colors.textSecondary
                }
              />
            )}
          >
            Moins de 30 min
          </Chip>
        </ScrollView>

        {/* ── Main Restaurants Feed ── */}
        <View style={styles.mainFeedContainer}>
          {filteredRestaurants.length === 0 ? (
            <EmptyState
              title="Aucun restaurant trouvé"
              description="Essayez de modifier vos filtres ou de changer de catégorie."
              actionLabel="Réinitialiser les filtres"
              onAction={() => {
                setSelectedCategory("all");
                setActiveFilter("all");
                setSearchQuery("");
              }}
            />
          ) : (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={openRestaurant}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Cart Bar (Dribbble Pattern) ── */}
      {cartState.itemCount > 0 && (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => router.push("/(app)/(client)/(tabs)/cart" as any)}
            activeOpacity={0.9}
          >
            <View style={styles.cartCountPill}>
              <Text style={styles.cartCountText}>{cartState.itemCount}</Text>
            </View>
            <View style={styles.cartBarCenter}>
              <Text style={styles.cartBarTitle}>Voir le panier</Text>
            </View>
            <Text style={styles.cartBarTotal}>
              {cartState.total.toFixed(2)} DH
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Interactive Location Picker Map Modal ── */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        selectedAddress={selectedCity}
        onSelectAddress={setSelectedCity}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationIconPill: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  locationTexts: {
    flex: 1,
  },
  locationEyebrow: {
    color: colors.textSecondary,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  locationTitle: {
    fontWeight: "900",
    color: colors.text,
    maxWidth: 220,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.textInverse,
    fontWeight: "800",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  activeOrderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  activeOrderIconCircle: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  activeOrderInfo: {
    flex: 1,
  },
  activeOrderEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    color: colors.primaryDark,
    letterSpacing: 0.6,
  },
  activeOrderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginTop: 2,
  },
  activeOrderRef: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  trackActionBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bannersScroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  bannerCard: {
    width: 290,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  bannerBlue: {
    backgroundColor: colors.primary,
  },
  bannerWarm: {
    backgroundColor: "#FFF1EE",
    borderWidth: 1,
    borderColor: "#FFD6CC",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  bannerBadgeWarm: {
    backgroundColor: colors.secondary,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bannerBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerHeading: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.textInverse,
    letterSpacing: -0.4,
  },
  bannerHeadingDark: {
    color: colors.text,
  },
  bannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  bannerSubDark: {
    color: colors.textSecondary,
  },
  bannerCta: {
    alignSelf: "flex-start",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  horizontalRailScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  compactCardWrapper: {
    width: 260,
  },
  filterPillsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
    fontSize: 12,
  },
  mainFeedContainer: {
    paddingHorizontal: spacing.md,
  },
  floatingCartContainer: {
    position: "absolute",
    bottom: 20,
    left: spacing.md,
    right: spacing.md,
  },
  floatingCartBar: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  cartCountPill: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  cartCountText: {
    color: colors.textInverse,
    fontWeight: "900",
    fontSize: 13,
  },
  cartBarCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cartBarTitle: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: "800",
  },
  cartBarTotal: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "900",
  },
  bottomSheetContent: {
    padding: spacing.md,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  gpsTextWrapper: {
    flex: 1,
  },
  gpsTitle: {
    fontWeight: "800",
    color: colors.primaryDark,
  },
  gpsSub: {
    color: colors.textSecondary,
  },
  sheetSectionTitle: {
    color: colors.textSecondary,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  neighborhoodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  neighborhoodItemSelected: {
    backgroundColor: colors.primaryLight + "20",
  },
  neighborhoodText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  neighborhoodTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
});

export default HomeScreen;
