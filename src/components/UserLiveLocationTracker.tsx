import Constants from "expo-constants";
import * as Location from "expo-location";
import { MapPin, Navigation } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import type { Region } from "react-native-maps";

// Safe dynamic require for react-native-maps to prevent web runtime crash:
// "codegenNativeComponent is not a function" on react-native-web
let MapViewComponent: any = null;
let MarkerComponent: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapViewComponent = Maps.default;
    MarkerComponent = Maps.Marker;
  } catch (err) {
    console.warn("[UserLiveLocationTracker] Safe maps load notice:", err);
  }
}

export interface UserLiveLocationTrackerProps {
  /** Initial latitude delta for map zoom level (default: 0.005) */
  latitudeDelta?: number;
  /** Initial longitude delta for map zoom level (default: 0.005) */
  longitudeDelta?: number;
  /** Container style overrides */
  style?: ViewStyle;
  /** Callback fired whenever new GPS coordinates are received */
  onLocationUpdate?: (coords: Location.LocationObjectCoords) => void;
  /** Optional custom marker title */
  markerTitle?: string;
  /** Show accuracy indicator ring around marker */
  showAccuracyRing?: boolean;
}

/**
 * Modular Live Location Tracking Component (Cross-Platform Safe)
 *
 * Features:
 * - High-accuracy foreground location watcher via expo-location (2s / 5m intervals)
 * - Smooth camera re-centering on moving user using MapView animateToRegion
 * - Safe dynamic loading of react-native-maps to prevent web codegen native component crashes
 * - Clean fallbacks for web/Expo Go web preview environments
 * - Automatic subscription cleanup on unmount to prevent memory leaks
 */
export const UserLiveLocationTracker: React.FC<
  UserLiveLocationTrackerProps
> = ({
  latitudeDelta = 0.005,
  longitudeDelta = 0.005,
  style,
  onLocationUpdate,
  markerTitle = "Votre position",
  showAccuracyRing = true,
}) => {
  const mapRef = useRef<any | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const [userCoords, setUserCoords] =
    useState<Location.LocationObjectCoords | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const startLocationWatcher = async () => {
      try {
        setIsLoading(true);
        setPermissionError(null);

        // 1. Request foreground location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (isMounted) {
            setPermissionError("Permission d'accès à la localisation refusée");
            setIsLoading(false);
          }
          return;
        }

        // 2. Fetch initial position for immediate map display
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted && initialLocation?.coords) {
          const coords = initialLocation.coords;
          setUserCoords(coords);
          setIsLoading(false);

          if (mapRef.current?.animateToRegion) {
            mapRef.current.animateToRegion(
              {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta,
                longitudeDelta,
              },
              1000,
            );
          }

          if (onLocationUpdate) {
            onLocationUpdate(coords);
          }
        }

        // 3. Configure high-accuracy location watcher (2 seconds or 5 meters)
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (locationPayload: Location.LocationObject) => {
            if (!isMounted) return;

            const newCoords = locationPayload.coords;
            setUserCoords(newCoords);

            if (onLocationUpdate) {
              onLocationUpdate(newCoords);
            }

            // Smooth camera update
            if (mapRef.current?.animateToRegion) {
              const targetRegion: Region = {
                latitude: newCoords.latitude,
                longitude: newCoords.longitude,
                latitudeDelta,
                longitudeDelta,
              };
              mapRef.current.animateToRegion(targetRegion, 1000);
            }
          },
        );

        subscriptionRef.current = subscription;
      } catch (err: any) {
        if (isMounted) {
          console.error("[UserLiveLocationTracker] Watcher error:", err);
          setPermissionError("Erreur de suivi GPS en direct");
          setIsLoading(false);
        }
      }
    };

    startLocationWatcher();

    // 4. Cleanup subscription on component unmount
    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [latitudeDelta, longitudeDelta, onLocationUpdate]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, style]}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Initialisation du GPS...</Text>
      </View>
    );
  }

  if (permissionError || !userCoords) {
    return (
      <View style={[styles.centerContainer, style]}>
        <Text style={styles.errorText}>
          {permissionError || "Position indisponible"}
        </Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: userCoords.latitude,
    longitude: userCoords.longitude,
    latitudeDelta,
    longitudeDelta,
  };

  const isExpoGo =
    Constants?.appOwnership === "expo" ||
    Constants?.executionEnvironment === "storeClient";

  // Render native MapView on standalone native builds; fallback to vector map on Web & Expo Go
  const isNativeSupported =
    Platform.OS !== "web" && !isExpoGo && MapViewComponent && MarkerComponent;

  if (isNativeSupported) {
    return (
      <View style={[styles.container, style]}>
        <MapViewComponent
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsCompass={true}
          showsMyLocationButton={true}
        >
          <MarkerComponent
            coordinate={{
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
            }}
            title={markerTitle}
            description={`Précision: ~${Math.round(userCoords.accuracy ?? 0)}m`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerWrapper}>
              {showAccuracyRing && <View style={styles.pulseRing} />}
              <View style={styles.markerCircle}>
                <Navigation
                  size={16}
                  color="#FFFFFF"
                  style={styles.navigationIcon}
                />
              </View>
            </View>
          </MarkerComponent>
        </MapViewComponent>
      </View>
    );
  }

  // Web / Fallback Interactive Canvas representation
  return (
    <View style={[styles.container, styles.webCanvasContainer, style]}>
      <View style={styles.webGridOverlay} />

      <View style={styles.webHeaderBadge}>
        <MapPin size={14} color="#0066FF" />
        <Text style={styles.webHeaderText}>
          {markerTitle} (Suivi GPS Direct)
        </Text>
      </View>

      <View style={styles.markerWrapper}>
        {showAccuracyRing && <View style={styles.pulseRing} />}
        <View style={styles.markerCircle}>
          <Navigation size={16} color="#FFFFFF" style={styles.navigationIcon} />
        </View>
      </View>

      <View style={styles.coordsCard}>
        <Text style={styles.coordsText}>
          Lat: {userCoords.latitude.toFixed(5)} | Lng:{" "}
          {userCoords.longitude.toFixed(5)}
        </Text>
        <Text style={styles.accuracyText}>
          Précision GPS: ~{Math.round(userCoords.accuracy ?? 5)}m • 2s / 5m
          updates
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  centerContainer: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500",
    textAlign: "center",
  },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  pulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 102, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(0, 102, 255, 0.4)",
  },
  markerCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0066FF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  navigationIcon: {
    transform: [{ rotate: "45deg" }],
  },

  // Web fallback styling
  webCanvasContainer: {
    backgroundColor: "#EBF5FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  webGridOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.1,
    backgroundColor: "#0066FF",
  },
  webHeaderBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  webHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },
  coordsCard: {
    position: "absolute",
    bottom: 14,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  coordsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  accuracyText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
});
