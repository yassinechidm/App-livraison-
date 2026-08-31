import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { Order } from '@/types/order.types';

interface LiveMapPreviewProps {
  order: Order;
  onOpenFullMap: () => void;
}

export default function LiveMapPreview({ order, onOpenFullMap }: LiveMapPreviewProps) {
  const driverName = order.driver_name || 'Mehdi (Coursier QuickLivraison)';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onOpenFullMap}
      activeOpacity={0.9}
    >
      {/* Map Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <View style={styles.liveDot} />
          <Text style={styles.badgeText}>SUIVI GPS EN DIRECT</Text>
        </View>
        <Text style={styles.openMapText}>Ouvrir la Carte ↗</Text>
      </View>

      {/* Stylized Visual Map Route Canvas */}
      <View style={styles.mapCanvas}>
        {/* Restaurant Point */}
        <View style={styles.pointWrapper}>
          <View style={[styles.pinCircle, { backgroundColor: '#E11D48' }]}>
            <Text style={{ fontSize: 13 }}>🏬</Text>
          </View>
          <Text style={styles.pointLabel} numberOfLines={1}>Restaurant</Text>
        </View>

        {/* Animated Connecting Polyline Route */}
        <View style={styles.routeLineContainer}>
          <View style={styles.routeLine} />
          {/* Moving Courier Icon in between */}
          <View style={styles.courierOnRoad}>
            <View style={styles.radarWave} />
            <View style={styles.courierPin}>
              <Text style={{ fontSize: 14 }}>🛵</Text>
            </View>
          </View>
        </View>

        {/* Client Destination Point */}
        <View style={styles.pointWrapper}>
          <View style={[styles.pinCircle, { backgroundColor: '#00B602' }]}>
            <Text style={{ fontSize: 13 }}>🏠</Text>
          </View>
          <Text style={styles.pointLabel} numberOfLines={1}>Votre porte</Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTitle}>
            🛵 {driverName} est en route
          </Text>
          <Text style={styles.etaText}>
            Arrivée estimée dans <Text style={styles.boldEta}>~{order.estimated_delivery_minutes || 15} min</Text> • Oujda
          </Text>
        </View>

        <View style={styles.mapBtn}>
          <Text style={styles.mapBtnText}>🗺️ Carte</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F7FF',
    borderRadius: 18,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0077FF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0077FF',
    letterSpacing: 0.5,
  },
  openMapText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  mapCanvas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  pointWrapper: {
    alignItems: 'center',
    gap: 4,
    width: 65,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  routeLineContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  routeLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#0077FF',
    borderRadius: 2,
  },
  courierOnRoad: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarWave: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 119, 255, 0.2)',
  },
  courierPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0077FF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  etaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  boldEta: {
    fontWeight: '900',
    color: Colors.primary,
  },
  mapBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mapBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
});
