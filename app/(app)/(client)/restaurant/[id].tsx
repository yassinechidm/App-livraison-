import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MenuItemRow from '@/components/ui/MenuItemRow';
import CartFloatingButton from '@/components/ui/CartFloatingButton';
import Colors from '@/constants/Colors';
import { restaurantService } from '@/services/restaurant.service';
import { cartService } from '@/services/cart.service';
import { favoritesService } from '@/services/favorites.service';
import { Restaurant, MenuItem } from '@/types/restaurant.types';
import { CartState } from '@/types/cart.types';

const { width } = Dimensions.get('window');

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Top des ventes');
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [cartState, setCartState] = useState<CartState>(cartService.getState());
  const [isFavorite, setIsFavorite] = useState(id ? favoritesService.isFavorite(id) : false);
  const [fullCategoryView, setFullCategoryView] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isSearchingInCategory, setIsSearchingInCategory] = useState(false);

  useEffect(() => {
    function loadResto() {
      if (id) {
        restaurantService.getRestaurantById(id).then((r) => {
          if (r) {
            setRestaurant(r);
            if (r.categories.length > 0 && !selectedCategory) {
              setSelectedCategory(r.categories[0]);
            }
          }
        });
      }
    }

    loadResto();

    const unsubscribeCart = cartService.subscribe((state) => {
      setCartState(state);
    });

    const unsubscribeFav = favoritesService.subscribe((favIds) => {
      if (id) {
        setIsFavorite(favIds.includes(id));
      }
    });

    const unsubscribeResto = restaurantService.subscribe(() => {
      loadResto();
    });

    return () => {
      unsubscribeCart();
      unsubscribeFav();
      unsubscribeResto();
    };
  }, [id]);

  if (!restaurant) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement du restaurant...</Text>
      </View>
    );
  }

  const topSellingItems = restaurant.menu_items.filter((i) => i.is_popular);

  // -------------------------------------------------------------
  // FULL CATEGORY LIST VIEW (EXACT SCREENSHOT 5)
  // When user clicks on "Top des ventes →" or "Tous les produits"
  // -------------------------------------------------------------
  if (fullCategoryView) {
    const categoryItems = restaurant.menu_items.filter((item) => {
      const matchCat = fullCategoryView === 'Top des ventes' ? true : item.category === fullCategoryView;
      if (!matchCat) return false;
      if (categorySearchQuery.trim()) {
        const q = categorySearchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.categoryViewHeader}>
          <TouchableOpacity
            onPress={() => {
              setFullCategoryView(null);
              setIsSearchingInCategory(false);
              setCategorySearchQuery('');
            }}
            style={styles.categoryBackBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryBackIcon}>‹</Text>
          </TouchableOpacity>

          {isSearchingInCategory ? (
            <View style={styles.categorySearchInputWrapper}>
              <TextInput
                style={styles.categorySearchInput}
                placeholder={`Rechercher dans ${fullCategoryView}...`}
                placeholderTextColor={Colors.textMuted}
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => setIsSearchingInCategory(false)}>
                <Text style={styles.categorySearchClose}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsSearchingInCategory(true)}
              style={styles.categorySearchBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.categorySearchIcon}>🔍</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.categoryViewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Big Title (Screenshot 5) */}
          <Text style={styles.categoryViewTitle}>{fullCategoryView}</Text>

          {/* List of Dishes */}
          <View style={styles.categoryItemsList}>
            {categoryItems.map((dish) => {
              const qty = cartService.getItemQuantity(dish.id);
              return (
                <MenuItemRow
                  key={dish.id}
                  item={dish}
                  quantityInCart={qty}
                  onAddToCart={() => cartService.addItem(dish as any, 1)}
                  onIncrement={() => cartService.setQuantity(dish.id, qty + 1)}
                  onDecrement={() => cartService.setQuantity(dish.id, qty - 1)}
                  onPress={() => router.push(`/product/${dish.id}` as any)}
                />
              );
            })}
          </View>

          {/* Free Delivery Banner (Screenshot 5) */}
          <View style={styles.freeDeliveryBanner}>
            <Text style={styles.freeDeliveryIcon}>🏷️</Text>
            <Text style={styles.freeDeliveryText}>
              Atteignez <Text style={styles.boldText}>100,00 MAD</Text> pour bénéficier de la livraison gratuite
            </Text>
          </View>

          {/* Fee Information Note */}
          <TouchableOpacity style={styles.feeInfoRow} activeOpacity={0.7}>
            <Text style={styles.feeInfoText}>Informations sur les frais ⓘ</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Floating Cart Button */}
        <CartFloatingButton />
      </View>
    );
  }

  // -------------------------------------------------------------
  // RESTAURANT MAIN OVERVIEW (SCREENSHOT 4)
  // -------------------------------------------------------------
  const currentCategoryItems = restaurant.menu_items.filter((i) => {
    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    return selectedCategory === 'Top des ventes' ? true : i.category === selectedCategory;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Cover Image & Floating Actions */}
        <View style={styles.coverWrapper}>
          <Image
            source={{ uri: restaurant.cover_image }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          <View style={styles.coverHeaderBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerCircleBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.headerBtnIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerActionsRight}>
              <TouchableOpacity
                onPress={() => setFullCategoryView('Top des ventes')}
                style={styles.headerCircleBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.headerBtnIconSmall}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => restaurant && favoritesService.toggleFavorite(restaurant.id)}
                style={styles.headerCircleBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.headerBtnIconSmall}>
                  {isFavorite ? '❤️' : '🤍'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Restaurant Logo Badge */}
          <View style={styles.logoBadge}>
            <Image
              source={{ uri: restaurant.logo_url }}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* 2. Restaurant Info Card */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.cuisineText}>{restaurant.cuisine_type}</Text>

          {/* Delivery vs Pickup Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                deliveryMode === 'delivery' && styles.modeBtnActive,
              ]}
              onPress={() => setDeliveryMode('delivery')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeIcon}>🛵</Text>
              <Text
                style={[
                  styles.modeText,
                  deliveryMode === 'delivery' && styles.modeTextActive,
                ]}
              >
                Livraison
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                deliveryMode === 'pickup' && styles.modeBtnActive,
              ]}
              onPress={() => setDeliveryMode('pickup')}
              activeOpacity={0.8}
            >
              <Text style={styles.modeIcon}>🚶</Text>
              <Text
                style={[
                  styles.modeText,
                  deliveryMode === 'pickup' && styles.modeTextActive,
                ]}
              >
                Retrait
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rating, Time & Fees Strip */}
          <View style={styles.metaStrip}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👍</Text>
              <Text style={styles.metaTextBold}>
                {restaurant.rating_percent}%
              </Text>
              <Text style={styles.metaTextSub}>({restaurant.rating_count})</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕒</Text>
              <Text style={styles.metaTextBold}>{restaurant.delivery_time}</Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🛵</Text>
              <Text style={styles.metaTextBold}>15,00 MAD</Text>
              <View style={styles.gratuitBadge}>
                <Text style={styles.gratuitText}>Gratuit</Text>
              </View>
            </View>
          </View>

          {/* Status Badge & Opening Hours */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                gap: 4,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
            >
              <Text style={{ fontSize: 9 }}>🟢</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>
                Ouvert maintenant • {restaurant.opening_hours || 'Ferme à 02:00'}
              </Text>
            </View>
          </View>

          {/* In-Menu Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F1F5F9',
              borderRadius: 14,
              paddingHorizontal: 12,
              height: 40,
              marginTop: 12,
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' }}
              placeholder={`Rechercher dans ${restaurant.name}...`}
              placeholderTextColor={Colors.textMuted}
              value={categorySearchQuery}
              onChangeText={setCategorySearchQuery}
            />
            {categorySearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                <Text style={{ fontSize: 14, color: Colors.textMuted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Best Rated Badge */}
          {restaurant.is_top_rated && (
            <View style={styles.topRatedBadge}>
              <Text style={styles.topRatedText}>👑 Les mieux notés ›</Text>
            </View>
          )}
        </View>

        {/* 3. Category Horizontal Sticky Tabs */}
        <View style={styles.categoryTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsScroll}
          >
            {restaurant.categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryTab,
                    isSelected && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      isSelected && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Horizontal Top Selling Items (Screenshot 4) */}
        {selectedCategory === 'Top des ventes' && (
          <View style={styles.topSellersSection}>
            {/* Clickable Header with Arrow → */}
            <TouchableOpacity
              style={styles.sectionHeaderRow}
              onPress={() => setFullCategoryView('Top des ventes')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionHeading}>Top des ventes</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.sectionSeeAll}>→</Text>
              </View>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topSellersScroll}
            >
              {topSellingItems.map((item) => {
                const qty = cartService.getItemQuantity(item.id);
                const isAvailable = item.is_available !== false;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.topSellerCard, !isAvailable && { opacity: 0.75 }]}
                    onPress={() => router.push(`/product/${item.id}` as any)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.topSellerImgWrapper}>
                      <Image
                        source={{ uri: item.image_url }}
                        style={[styles.topSellerImg, !isAvailable && { opacity: 0.6 }]}
                        resizeMode="cover"
                      />

                      {!isAvailable ? (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontWeight: '900',
                              fontSize: 11,
                              backgroundColor: '#EF4444',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            ÉPUISÉ
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.topSellerAddBtn}
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            cartService.addItem(item as any, 1);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.topSellerAddIcon}>
                            {qty > 0 ? `${qty}` : '+'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.topSellerTitle,
                        !isAvailable && { color: Colors.textMuted },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.topSellerPrice,
                        !isAvailable && { color: Colors.textMuted, textDecorationLine: 'line-through' },
                      ]}
                    >
                      {item.price.toFixed(2)} MAD
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* "Tous les produits" card at the end of the scroll (as seen in Glovo Screenshot 4) */}
              <TouchableOpacity
                style={styles.seeAllProductsCard}
                onPress={() => setFullCategoryView('Top des ventes')}
                activeOpacity={0.8}
              >
                <Text style={styles.seeAllProductsText}>Tous les{'\n'}produits</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* 5. Free Delivery Progress Promo Banner */}
        <View style={styles.freeDeliveryBanner}>
          <Text style={styles.freeDeliveryIcon}>🏷️</Text>
          <Text style={styles.freeDeliveryText}>
            Atteignez <Text style={styles.boldText}>100,00 MAD</Text> pour bénéficier de la livraison gratuite
          </Text>
        </View>

        {/* 6. Vertical Detailed Menu List (Screenshot 5) */}
        <View style={styles.verticalMenuSection}>
          <TouchableOpacity
            style={styles.menuSectionHeader}
            onPress={() => setFullCategoryView(selectedCategory)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuSectionTitle}>{selectedCategory}</Text>
            <Text style={styles.sectionSeeAll}>→</Text>
          </TouchableOpacity>

          {currentCategoryItems.map((dish) => {
            const qty = cartService.getItemQuantity(dish.id);
            return (
              <MenuItemRow
                key={dish.id}
                item={dish}
                quantityInCart={qty}
                onAddToCart={() => cartService.addItem(dish as any, 1)}
                onIncrement={() => cartService.setQuantity(dish.id, qty + 1)}
                onDecrement={() => cartService.setQuantity(dish.id, qty - 1)}
                onPress={() => router.push(`/product/${dish.id}` as any)}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <CartFloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  coverWrapper: {
    height: 180,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverHeaderBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBtnIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: -3,
  },
  headerBtnIconSmall: {
    fontSize: 16,
  },
  headerActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  logoBadge: {
    position: 'absolute',
    bottom: -24,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.white,
    backgroundColor: '#E11D48',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  restaurantInfo: {
    backgroundColor: Colors.white,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cuisineText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeIcon: {
    fontSize: 14,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modeTextActive: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  metaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metaTextSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  gratuitBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  gratuitText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  topRatedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRatedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryTabsWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryTabsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryTab: {
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: Colors.textPrimary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  categoryTabTextActive: {
    color: Colors.textPrimary,
  },
  topSellersSection: {
    backgroundColor: Colors.white,
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  sectionSeeAll: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  topSellersScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  topSellerCard: {
    width: 140,
  },
  topSellerImgWrapper: {
    width: 140,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginBottom: 8,
  },
  topSellerImg: {
    width: '100%',
    height: '100%',
  },
  topSellerAddBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  topSellerAddIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  topSellerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
    lineHeight: 16,
  },
  topSellerPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  seeAllProductsCard: {
    width: 110,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  seeAllProductsText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  freeDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  freeDeliveryIcon: {
    fontSize: 18,
  },
  freeDeliveryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  verticalMenuSection: {
    backgroundColor: Colors.white,
    paddingTop: 12,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },

  // -------------------------------------------------------------
  // Full Category View Styles (Screenshot 5)
  // -------------------------------------------------------------
  categoryViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  categoryBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBackIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  categorySearchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categorySearchIcon: {
    fontSize: 16,
  },
  categorySearchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginLeft: 10,
    height: 40,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  categorySearchClose: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: 4,
  },
  categoryViewScrollContent: {
    paddingBottom: 110,
  },
  categoryViewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: Colors.white,
  },
  categoryItemsList: {
    backgroundColor: Colors.white,
  },
  feeInfoRow: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  feeInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
