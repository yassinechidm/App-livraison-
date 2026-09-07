import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Image } from 'expo-image';
import { ArrowLeft, Bike, Clock, Heart, Star } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { RestaurantHeaderProps } from './types';

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurant,
  onBackPress,
  onFavoritePress,
  isFavorite = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: restaurant.cover_image }}
          style={styles.coverImage}
          contentFit="cover"
        />
        <View style={styles.topActions}>
          {onBackPress && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onBackPress}
              activeOpacity={0.8}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          {onFavoritePress && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onFavoritePress}
              activeOpacity={0.8}
            >
              <Heart
                size={20}
                color={isFavorite ? colors.error : colors.text}
                fill={isFavorite ? colors.error : colors.transparent}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Surface elevation={1} style={styles.infoCard}>
        <Text variant="headlineSmall" style={styles.name}>
          {restaurant.name}
        </Text>
        <Text variant="bodyMedium" style={styles.cuisine}>
          {restaurant.cuisine_type}
        </Text>

        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={styles.pillTextBold}>
              {restaurant.rating_percent ? `${restaurant.rating_percent}%` : '4.8'}
            </Text>
            <Text style={styles.pillTextMuted}>({restaurant.rating_count || '500+'})</Text>
          </View>

          <View style={styles.pill}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.pillTextBold}>{restaurant.delivery_time}</Text>
          </View>

          <View style={styles.pill}>
            <Bike size={14} color={colors.textSecondary} />
            <Text style={styles.pillTextBold}>
              {restaurant.delivery_fee === 0 ? 'Gratuit' : `${restaurant.delivery_fee} DH`}
            </Text>
          </View>
        </View>

        {restaurant.promo_badge && (
          <View style={styles.promoBanner}>
            <Text style={styles.promoText}>🎉 {restaurant.promo_badge}</Text>
          </View>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  imageWrapper: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  topActions: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  infoCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: -spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontWeight: '900',
    color: colors.text,
    marginBottom: 2,
  },
  cuisine: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pillTextBold: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  pillTextMuted: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  promoBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  promoText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.error,
  },
});

export default RestaurantHeader;
