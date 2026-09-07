import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Bike, Home, MapPin, Utensils } from 'lucide-react-native';
import { borderRadius, colors, spacing } from '@/src/theme';
import { DeliveryMapProps } from './types';

export const DeliveryMapWeb: React.FC<DeliveryMapProps> = ({
  courierLocation,
  deliveryLocation,
  restaurantLocation,
  style,
}) => {
  const lat = deliveryLocation.latitude || 34.6814;
  const lon = deliveryLocation.longitude || -1.9086;
  const delta = 0.02;
  const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <View style={[styles.container, style]}>
      {/* Web Map Embed */}
      <iframe
        title="Delivery Map"
        src={mapUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 0,
        }}
        loading="lazy"
      />

      {/* Floating Status Card Overlay */}
      <View style={styles.overlayHUD}>
        <View style={styles.hudRow}>
          <View style={styles.markerBadgeClient}>
            <Home size={14} color={colors.textInverse} />
            <Text style={styles.markerText}>Destination</Text>
          </View>

          {courierLocation && (
            <View style={styles.markerBadgeCourier}>
              <Bike size={14} color={colors.textInverse} />
              <Text style={styles.markerText}>Livreur en route</Text>
            </View>
          )}

          {restaurantLocation && (
            <View style={styles.markerBadgeRestaurant}>
              <Utensils size={14} color={colors.textInverse} />
              <Text style={styles.markerText}>Restaurant</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    backgroundColor: colors.surfaceVariant,
  },
  overlayHUD: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
  },
  hudRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  markerBadgeClient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  markerBadgeCourier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  markerBadgeRestaurant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  markerText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '800',
  },
});

export default DeliveryMapWeb;
