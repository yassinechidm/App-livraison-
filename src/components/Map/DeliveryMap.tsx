import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Home, Utensils } from 'lucide-react-native';
import { borderRadius, colors } from '@/src/theme';
import CourierMarker from './CourierMarker';
import { DeliveryMapProps } from './types';

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  courierLocation,
  deliveryLocation,
  restaurantLocation,
  style,
  interactive = true,
}) => {
  const initialRegion = {
    latitude: deliveryLocation.latitude,
    longitude: deliveryLocation.longitude,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
      >
        {/* Delivery Location Marker */}
        <Marker coordinate={deliveryLocation} title="Votre adresse">
          <View style={styles.clientMarker}>
            <Home size={16} color={colors.textInverse} />
          </View>
        </Marker>

        {/* Restaurant Location Marker */}
        {restaurantLocation && (
          <Marker coordinate={restaurantLocation} title="Restaurant">
            <View style={styles.restaurantMarker}>
              <Utensils size={16} color={colors.textInverse} />
            </View>
          </Marker>
        )}

        {/* Courier Marker */}
        {courierLocation && <CourierMarker coordinate={courierLocation} />}

        {/* Polyline Route */}
        {courierLocation && (
          <Polyline
            coordinates={[courierLocation, deliveryLocation]}
            strokeColor={colors.primary}
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
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
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  clientMarker: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  restaurantMarker: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});

export default DeliveryMap;
