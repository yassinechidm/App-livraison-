import Colors from "@/constants/Colors";
import { liveLocationService } from "@/services/liveLocation.service";
import { Bike, MapPin, Navigation, UtensilsCrossed } from "lucide-react-native";
import React, { useMemo } from "react";
import {
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Try importing react-native-maps safely for native devices
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (err) {
    console.warn("[LiveTrackingMap] react-native-maps load notice:", err);
  }
}

export interface LiveTrackingMapProps {
  courierLocation?: { latitude: number; longitude: number };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    addressText?: string;
  };
  restaurantLocation?: { latitude: number; longitude: number; name?: string };
  courierName?: string;
  orderStatus?: string;
  height?: number;
  showNavigationButton?: boolean;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  courierLocation = { latitude: 34.688, longitude: -1.913 },
  deliveryLocation = {
    latitude: 34.6867,
    longitude: -1.9114,
    addressText: "Oujda",
  },
  restaurantLocation = {
    latitude: 34.689,
    longitude: -1.915,
    name: "Snack & Resto",
  },
  courierName = "Livreur Quickly",
  orderStatus = "OUT_FOR_DELIVERY",
  height = 280,
  showNavigationButton = false,
}) => {
  // Calculate live distance & ETA between courier and delivery destination
  const distanceKm = useMemo(() => {
    return liveLocationService.calculateDistanceKm(
      courierLocation.latitude,
      courierLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
    );
  }, [courierLocation, deliveryLocation]);

  const etaMinutes = useMemo(() => {
    return liveLocationService.calculateEtaMinutes(distanceKm);
  }, [distanceKm]);

  // Handle opening Google Maps navigation for courier
  const openExternalNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.latitude},${deliveryLocation.longitude}`;
    Linking.openURL(url).catch(() => {
      console.warn("Impossible d'ouvrir la navigation");
    });
  };

  const [mapError, setMapError] = React.useState(false);

  // ── Native MapView rendering (iOS/Android) ──
  const isNativeMapSupported =
    Platform.OS !== "web" && MapView && Marker && !mapError;

  if (isNativeMapSupported) {
    const region = {
      latitude: (courierLocation.latitude + deliveryLocation.latitude) / 2,
      longitude: (courierLocation.longitude + deliveryLocation.longitude) / 2,
      latitudeDelta:
        Math.abs(courierLocation.latitude - deliveryLocation.latitude) * 2.5 ||
        0.03,
      longitudeDelta:
        Math.abs(courierLocation.longitude - deliveryLocation.longitude) *
          2.5 || 0.03,
    };

    return (
      <View style={[styles.container, { height }]}>
        <MapView style={styles.map} initialRegion={region}>
          {/* Restaurant Marker */}
          {restaurantLocation && (
            <Marker
              coordinate={{
                latitude: restaurantLocation.latitude,
                longitude: restaurantLocation.longitude,
              }}
              title={restaurantLocation.name || "Restaurant"}
              description="Lieu de préparation"
            >
              <View
                style={[
                  styles.markerPin,
                  { backgroundColor: Colors.secondary },
                ]}
              >
                <Text style={styles.markerEmoji}>🍳</Text>
              </View>
            </Marker>
          )}

          {/* Delivery Destination Marker */}
          <Marker
            coordinate={{
              latitude: deliveryLocation.latitude,
              longitude: deliveryLocation.longitude,
            }}
            title="Adresse de livraison"
            description={deliveryLocation.addressText || "Oujda"}
          >
            <View
              style={[styles.markerPin, { backgroundColor: Colors.success }]}
            >
              <Text style={styles.markerEmoji}>🏠</Text>
            </View>
          </Marker>

          {/* Live Courier Moving Marker */}
          <Marker
            coordinate={{
              latitude: courierLocation.latitude,
              longitude: courierLocation.longitude,
            }}
            title={courierName}
            description="Livreur en direct"
          >
            <View style={[styles.markerPin, styles.courierMarkerPin]}>
              <Text style={styles.markerEmoji}>🛵</Text>
            </View>
          </Marker>

          {/* Route Line */}
          {Polyline && (
            <Polyline
              coordinates={[
                {
                  latitude: restaurantLocation.latitude,
                  longitude: restaurantLocation.longitude,
                },
                {
                  latitude: courierLocation.latitude,
                  longitude: courierLocation.longitude,
                },
                {
                  latitude: deliveryLocation.latitude,
                  longitude: deliveryLocation.longitude,
                },
              ]}
              strokeColor={Colors.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Floating Glassmorphism ETA Overlay Banner */}
        <View style={styles.floatingEtaCard}>
          <View style={styles.etaLeft}>
            <View style={styles.pulseOuterRing}>
              <View style={styles.livePulseDot} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.etaTitle}>
                  {orderStatus === "DELIVERED"
                    ? "Commande livrée 🎉"
                    : `Arrivée dans ~${etaMinutes} min`}
                </Text>
                <View style={styles.liveTag}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTagText}>GPS LIVE</Text>
                </View>
              </View>
              <Text style={styles.etaSub} numberOfLines={1}>
                Distance : {distanceKm} km • {courierName}
              </Text>
            </View>
          </View>
          {showNavigationButton && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={openExternalNavigation}
              activeOpacity={0.8}
            >
              <Navigation size={14} color={Colors.white} />
              <Text style={styles.navButtonText}>GPS</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Universal Interactive Visual Map View (Web & Fallback) ──
  return (
    <View style={[styles.container, { height }]}>
      {/* Dynamic Simulated Map Canvas */}
      <View style={styles.webMapBackground}>
        {/* Map Road Patterns */}
        <View style={styles.streetGridHorizontal} />
        <View style={styles.streetGridVertical} />
        <View style={styles.routeLineVisual} />

        {/* Pins */}
        <View style={[styles.visualPin, styles.restaurantPinPos]}>
          <View
            style={[styles.markerPin, { backgroundColor: Colors.secondary }]}
          >
            <UtensilsCrossed size={16} color={Colors.white} />
          </View>
          <Text style={styles.pinLabel}>Resto</Text>
        </View>

        <View style={[styles.visualPin, styles.courierPinPos]}>
          <View style={[styles.markerPin, styles.courierMarkerPin]}>
            <Bike size={18} color={Colors.white} />
          </View>
          <View style={styles.courierPillBadge}>
            <Text style={styles.courierPillText}>{courierName} 🛵</Text>
          </View>
        </View>

        <View style={[styles.visualPin, styles.clientPinPos]}>
          <View style={[styles.markerPin, { backgroundColor: Colors.success }]}>
            <MapPin size={18} color={Colors.white} />
          </View>
          <Text style={styles.pinLabel}>Client (Oujda)</Text>
        </View>
      </View>

      {/* Floating Glassmorphism Information Banner */}
      <View style={styles.floatingEtaCard}>
        <View style={styles.etaLeft}>
          <View style={styles.pulseOuterRing}>
            <View style={styles.livePulseDot} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.etaTitle}>
                {orderStatus === "DELIVERED"
                  ? "Commande livrée 🎉"
                  : `Position GPS (~${etaMinutes} min)`}
              </Text>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>GPS LIVE</Text>
              </View>
            </View>
            <Text style={styles.etaSub} numberOfLines={1}>
              Distance restante : {distanceKm} km • Suivi en direct
            </Text>
          </View>
        </View>
        {showNavigationButton && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={openExternalNavigation}
            activeOpacity={0.8}
          >
            <Navigation size={14} color={Colors.white} />
            <Text style={styles.navButtonText}>Ouvrir GPS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  markerPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  courierMarkerPin: {
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  markerEmoji: {
    fontSize: 18,
  },
  webMapBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  streetGridHorizontal: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "#E2E8F0",
  },
  streetGridVertical: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "#E2E8F0",
  },
  routeLineVisual: {
    position: "absolute",
    left: "22%",
    top: "44%",
    width: "56%",
    height: 5,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  visualPin: {
    position: "absolute",
    alignItems: "center",
  },
  restaurantPinPos: {
    left: "18%",
    top: "30%",
  },
  courierPinPos: {
    left: "48%",
    top: "34%",
  },
  clientPinPos: {
    left: "76%",
    top: "30%",
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courierPillBadge: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    elevation: 3,
  },
  courierPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.white,
  },
  floatingEtaCard: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  etaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pulseOuterRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  etaTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.white,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  etaSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  navButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 2,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
