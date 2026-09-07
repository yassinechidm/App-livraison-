import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { Bike, Clock, Star } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { RestaurantCardProps } from './types';

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
  style,
  variant = 'standard',
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card
      mode="outlined"
      style={[styles.card, isCompact && styles.cardCompact, style]}
      onPress={() => onPress(restaurant)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: restaurant.cover_image }}
          style={[styles.image, isCompact && styles.imageCompact]}
          contentFit="cover"
          transition={250}
        />
        {restaurant.promo_badge && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>{restaurant.promo_badge}</Text>
          </View>
        )}
        <View style={styles.timeBadge}>
          <Clock size={12} color={colors.text} />
          <Text style={styles.timeText}>{restaurant.delivery_time}</Text>
        </View>
      </View>

      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={styles.ratingText}>
              {restaurant.rating_percent ? `${restaurant.rating_percent}%` : '4.8'}
            </Text>
            <Text style={styles.ratingCount}>({restaurant.rating_count || '100+'})</Text>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.cuisine} numberOfLines={1}>
          {restaurant.cuisine_type}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.feeRow}>
            <Bike size={14} color={colors.textSecondary} />
            <Text style={styles.feeText}>
              {restaurant.delivery_fee === 0
                ? 'Livraison offerte'
                : `${restaurant.delivery_fee} DH de livraison`}
            </Text>
          </View>
          {restaurant.free_delivery_threshold && (
            <Text style={styles.freeThreshold}>
              Offert dès {restaurant.free_delivery_threshold} DH
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardCompact: {
    width: 260,
    marginRight: spacing.md,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  image: {
    width: '100%',
    height: 150,
  },
  imageCompact: {
    height: 120,
  },
  promoBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  promoText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  timeBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  ratingCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cuisine: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  feeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  freeThreshold: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
  },
});

export default RestaurantCard;
