import Colors from '@/constants/Colors';
import { favoritesService } from '@/services/favorites.service';
import { Restaurant } from '@/types/restaurant.types';
import { Clock3, Heart, MapPin, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RestaurantCardProps { restaurant: Restaurant; onPress: () => void; }

export default function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const [isFavorite, setIsFavorite] = useState(favoritesService.isFavorite(restaurant.id));
  useEffect(() => favoritesService.subscribe((ids) => setIsFavorite(ids.includes(restaurant.id))), [restaurant.id]);
  const rating = restaurant.rating_percent ? (restaurant.rating_percent / 20).toFixed(1) : '4.7';
  const deliveryLabel = restaurant.delivery_fee === 0 ? 'Livraison offerte' : `Livraison ${Number(restaurant.delivery_fee).toFixed(0)} DH`;

  return <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.imageContainer}>
      <Image source={{ uri: restaurant.cover_image }} style={styles.coverImage} resizeMode="cover" />
      {(restaurant.promo_badge || restaurant.delivery_fee_promo) && <View style={[styles.promoBadge, !restaurant.promo_badge && styles.freeBadge]}><Text style={styles.promoBadgeText}>{restaurant.promo_badge || restaurant.delivery_fee_promo}</Text></View>}
      <View style={styles.deliveryTimePill}><Clock3 color={Colors.textPrimary} size={13} strokeWidth={2.5} /><Text style={styles.deliveryTimePillText}>{restaurant.delivery_time}</Text></View>
      <TouchableOpacity style={styles.favoriteButton} onPress={(event) => { event.stopPropagation(); favoritesService.toggleFavorite(restaurant.id); }} activeOpacity={0.8}>
        <Heart size={18} color={isFavorite ? Colors.secondary : Colors.textPrimary} fill={isFavorite ? Colors.secondary : 'transparent'} />
      </TouchableOpacity>
    </View>
    <View style={styles.infoSection}>
      <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
      <View style={styles.ratingRow}><Star color={Colors.primary} fill={Colors.primary} size={13} /><Text style={styles.starText}>{rating}</Text><Text style={styles.ratingCount}>({restaurant.rating_count})</Text><Text style={styles.metaDot}>•</Text><Text style={styles.cuisineText} numberOfLines={1}>{restaurant.cuisine_type}</Text></View>
      <View style={styles.deliveryRow}><Text style={styles.deliveryText}>{deliveryLabel}</Text><Text style={styles.metaDot}>•</Text><MapPin color={Colors.textMuted} size={12} /><Text style={styles.distanceText}>1,2 km</Text></View>
    </View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.backgroundWhite, borderRadius: 18, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight, shadowColor: Colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  imageContainer: { height: 172, backgroundColor: '#E8ECE8', position: 'relative' }, coverImage: { width: '100%', height: '100%' },
  promoBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: Colors.secondary, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }, freeBadge: { backgroundColor: Colors.primary }, promoBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800' },
  deliveryTimePill: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 4 }, deliveryTimePillText: { color: Colors.textPrimary, fontSize: 11, fontWeight: '800' },
  favoriteButton: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center' }, infoSection: { paddingHorizontal: 14, paddingVertical: 13 },
  restaurantName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 5, letterSpacing: -0.2 }, ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 4 }, starText: { fontSize: 13, fontWeight: '800', color: Colors.primaryDeep }, ratingCount: { fontSize: 12, color: Colors.textMuted }, metaDot: { fontSize: 12, color: Colors.textMuted, marginHorizontal: 3 }, cuisineText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', flexShrink: 1 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 3 }, deliveryText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' }, distanceText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
});
