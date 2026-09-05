import Colors from '@/constants/Colors';
import { favoritesService } from '@/services/favorites.service';
import { Restaurant } from '@/types/restaurant.types';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  // Convert percentage (e.g. 96%) to 5-star rating (e.g. 4.8)
  const starRating = (restaurant.rating_percent ? (restaurant.rating_percent / 20).toFixed(1) : '4.7');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Cover Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.cover_image }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Deliveroo Promo Badge */}
        {restaurant.promo_badge ? (
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>{restaurant.promo_badge}</Text>
          </View>
        ) : restaurant.delivery_fee_promo ? (
          <View style={[styles.promoBadge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.promoBadgeText}>{restaurant.delivery_fee_promo}</Text>
          </View>
        ) : null}

        {/* Delivery Time Pill on Image */}
        <View style={styles.deliveryTimePill}>
          <Text style={styles.deliveryTimePillText}>⏱ {restaurant.delivery_time}</Text>
        </View>

        {/* Favorite Heart Button */}
        <TouchableOpacity
          style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
          onPress={handleToggleFavorite}
          activeOpacity={0.8}
        >
          <Text style={styles.favoriteHeart}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Section Deliveroo Style */}
      <View style={styles.infoSection}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {restaurant.name}
        </Text>

        {/* Rating and Cuisine */}
        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.starText}>{starRating}</Text>
          <Text style={styles.ratingCount}>({restaurant.rating_count})</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.cuisineText} numberOfLines={1}>{restaurant.cuisine_type}</Text>
        </View>

        {/* Distance and Delivery Fee */}
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryText}>
            {restaurant.delivery_fee === 0 ? 'Livraison offerte' : `Livraison ${Number(restaurant.delivery_fee).toFixed(0)} DH`}
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.distanceText}>À 1,2 km</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 165,
    backgroundColor: '#EFEFEA',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  deliveryTimePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveryTimePillText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: Colors.white,
  },
  favoriteHeart: {
    fontSize: 15,
  },
  infoSection: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: {
    color: '#007E7A',
    fontSize: 13,
    marginRight: 3,
  },
  starText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007E7A',
    marginRight: 3,
  },
  ratingCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  cuisineText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});

