import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { Restaurant } from '@/types/restaurant.types';
import { favoritesService } from '@/services/favorites.service';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
}

export default function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const [isFavorite, setIsFavorite] = useState(favoritesService.isFavorite(restaurant.id));

  useEffect(() => {
    const unsubscribe = favoritesService.subscribe((favIds) => {
      setIsFavorite(favIds.includes(restaurant.id));
    });
    return unsubscribe;
  }, [restaurant.id]);

  function handleToggleFavorite(e: any) {
    e?.stopPropagation?.();
    favoritesService.toggleFavorite(restaurant.id);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Cover Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.cover_image }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Promo Badge Tag */}
        {restaurant.promo_badge ? (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>{restaurant.promo_badge}</Text>
          </View>
        ) : null}

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={handleToggleFavorite}
          activeOpacity={0.8}
        >
          <Text style={[styles.favoriteHeart, isFavorite && styles.favoriteHeartActive]}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {restaurant.name}
          </Text>
        </View>

        <Text style={styles.cuisineType} numberOfLines={1}>
          {restaurant.cuisine_type}
        </Text>

        <View style={styles.metaRow}>
          {/* Rating */}
          <View style={styles.ratingBox}>
            <Text style={styles.ratingIcon}>👍</Text>
            <Text style={styles.ratingText}>
              {restaurant.rating_percent}% ({restaurant.rating_count})
            </Text>
          </View>

          <Text style={styles.dot}>•</Text>

          {/* Delivery Promo Badge */}
          {restaurant.delivery_fee_promo ? (
            <View style={styles.deliveryPromoBadge}>
              <Text style={styles.deliveryPromoText}>
                {restaurant.delivery_fee_promo}
              </Text>
            </View>
          ) : null}

          {/* Time */}
          <Text style={styles.deliveryTime}>{restaurant.delivery_time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  promoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E11D48',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  promoBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonActive: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  favoriteHeart: {
    fontSize: 16,
  },
  favoriteHeartActive: {
    fontSize: 17,
  },
  infoSection: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
    flex: 1,
  },
  cuisineType: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingIcon: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  deliveryPromoBadge: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deliveryPromoText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  deliveryTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
