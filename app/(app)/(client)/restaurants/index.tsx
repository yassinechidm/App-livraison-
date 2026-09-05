import CartFloatingButton from '@/components/ui/CartFloatingButton';
import RestaurantCard from '@/components/ui/RestaurantCard';
import Colors from '@/constants/Colors';
import { favoritesService } from '@/services/favorites.service';
import { RESTAURANT_FILTERS, restaurantService } from '@/services/restaurant.service';
import { Restaurant } from '@/types/restaurant.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function RestaurantsListScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(favoritesService.getFavorites());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function refreshRestos() {
      restaurantService.getRestaurants(selectedFilter, searchQuery).then(setRestaurants);
    }
    refreshRestos();
    const unsubscribeFav = favoritesService.subscribe(setFavoriteIds);
    const unsubscribeResto = restaurantService.subscribe(refreshRestos);
    return () => {
      unsubscribeFav();
      unsubscribeResto();
    };
  }, [selectedFilter, searchQuery]);

  const allFilters = [
    { id: 'all', name: 'Tous', emoji: '🌟' },
    { id: 'favorites', name: `Favoris (${favoriteIds.length})`, emoji: '❤️' },
    { id: 'promo', name: 'Offres & Promos', emoji: '🏷️' },
    { id: 'free-delivery', name: 'Livraison Offerte', emoji: '🛵' },
    { id: 'top-rated', name: 'Mieux notés (★ 4.5+)', emoji: '⭐' },
    { id: 'fast', name: 'Moins de 25 min', emoji: '⚡' },
    ...RESTAURANT_FILTERS.filter((f) => f.id !== 'all' && f.id !== 'promo'),
  ];


  const displayedRestaurants = restaurants.filter((r) => {
    if (selectedFilter === 'favorites') {
      return favoriteIds.includes(r.id);
    }
    if (selectedFilter === 'free-delivery') {
      return r.delivery_fee === 0 || r.delivery_fee_promo === 'Gratuit' || (r.free_delivery_threshold && r.free_delivery_threshold <= 100);
    }
    if (selectedFilter === 'fast') {
      return r.delivery_time.includes('15') || r.delivery_time.includes('20') || r.delivery_time.includes('25');
    }
    if (selectedFilter === 'promo') {
      return !!r.promo_badge;
    }
    if (selectedFilter === 'top-rated') {
      return r.rating_percent >= 92 || r.is_top_rated;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Recherche dans Restaurants..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sub-Filters Pills Scroll */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {allFilters.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                  f.id === 'favorites' && !isSelected && styles.favoriteFilterPill,
                ]}
                onPress={() => setSelectedFilter(f.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                    f.id === 'favorites' && !isSelected && styles.favoriteFilterPillText,
                  ]}
                >
                  {f.emoji} {f.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        {selectedFilter === 'favorites' ? (
          <View style={styles.headlineSection}>
            <Text style={styles.headlineTitle}>Vos Snacks & Restos Préférés ❤️</Text>
            <Text style={styles.headlineSub}>
              Retrouvez rapidement vos adresses favorites à Oujda
            </Text>
          </View>
        ) : (
          <View style={styles.headlineSection}>
            <Text style={styles.headlineTitle}>Meilleures chaînes, petit prix</Text>
            <Text style={styles.headlineSub}>
              La livraison rapide à Oujda et jusqu'à -40%
            </Text>
          </View>
        )}

        {/* Horizontal Popular Brands (only on all tab) */}
        {selectedFilter === 'all' && !searchQuery && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Text style={styles.popularTitle}>Marques populaires</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularBrandsScroll}
            >
              {restaurants.map((resto) => (
                <TouchableOpacity
                  key={resto.id}
                  style={styles.brandBubble}
                  onPress={() => router.push(`/(app)/(client)/restaurant/${resto.id}` as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.brandLogoCircle}>
                    <Image
                      source={{ uri: resto.cover_image }}
                      style={styles.brandLogoImg}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.brandName} numberOfLines={1}>
                    {resto.name}
                  </Text>
                  <View style={styles.brandPromoBadge}>
                    <Text style={styles.brandPromoText}>Gratuit</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Restaurants List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedFilter === 'favorites'
              ? `Mes Favoris (${displayedRestaurants.length})`
              : `Tous les Restaurants & Snacks (${displayedRestaurants.length})`}
          </Text>
        </View>

        {/* Empty state for favorites */}
        {selectedFilter === 'favorites' && displayedRestaurants.length === 0 && (
          <View style={styles.emptyFavoritesBox}>
            <Text style={styles.emptyFavEmoji}>🤍</Text>
            <Text style={styles.emptyFavTitle}>Aucun favori pour le moment</Text>
            <Text style={styles.emptyFavSub}>
              Cliquez sur le cœur ❤️ en haut à droite d'un restaurant pour l'ajouter à vos préférés !
            </Text>
            <TouchableOpacity
              style={styles.exploreAllBtn}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={styles.exploreAllBtnText}>Découvrir les restaurants</Text>
            </TouchableOpacity>
          </View>
        )}

        {displayedRestaurants.map((resto) => (
          <RestaurantCard
            key={resto.id}
            restaurant={resto}
            onPress={() => router.push(`/(app)/(client)/restaurant/${resto.id}` as any)}
          />
        ))}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: Colors.white,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  clearSearch: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: 4,
  },
  filterBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  favoriteFilterPill: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  favoriteFilterPillText: {
    color: '#E11D48',
    fontWeight: '800',
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
    paddingBottom: 100,
  },
  headlineSection: {
    marginBottom: 16,
  },
  headlineTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headlineSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  popularSection: {
    marginBottom: 20,
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  popularBrandsScroll: {
    gap: 12,
  },
  brandBubble: {
    alignItems: 'center',
    width: 80,
  },
  brandLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  brandPromoBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  brandPromoText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyFavoritesBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyFavEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyFavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyFavSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  exploreAllBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  exploreAllBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
