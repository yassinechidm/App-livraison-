import Colors from "@/constants/Colors";
import { OUJDA_NEIGHBORHOODS } from "@/constants/mockData";
import { locationService } from "@/services/location.service";
import Constants from "expo-constants";
import {
    AlertTriangle,
    Check,
    MapPin,
    Navigation,
    X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Safe import for react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch {}
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.88, 700);
const SNAP_EXPANDED = 0; // Fully expanded
const SNAP_HALF = SHEET_MAX_HEIGHT - 380; // Half open (~380px visible)
const SNAP_COLLAPSED = SHEET_MAX_HEIGHT - 80; // Collapsed peek (~80px visible)

const isExpoGo =
  Constants?.appOwnership === "expo" ||
  Constants?.executionEnvironment === "storeClient";

export interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAddress: string;
  onSelectAddress: (address: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  selectedAddress,
  onSelectAddress,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Default region centered on Oujda
  const [region, setRegion] = useState({
    latitude: 34.6867,
    longitude: -1.9114,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });

  // Animated Y position for bottom sheet
  const panY = useRef(new Animated.Value(SNAP_HALF)).current;

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      panY.setValue(SNAP_HALF);
    }
  }, [visible]);

  // PanResponder for mobile touch + desktop mouse dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: () => {
        panY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        panY.flattenOffset();
        const currentY = (panY as any)._value;
        const vy = gestureState.vy;

        let targetSnap = SNAP_HALF;

        if (vy > 0.4) {
          // Dragging down quickly
          targetSnap = currentY < SNAP_HALF ? SNAP_HALF : SNAP_COLLAPSED;
        } else if (vy < -0.4) {
          // Dragging up quickly
          targetSnap = currentY > SNAP_HALF ? SNAP_HALF : SNAP_EXPANDED;
        } else {
          // Snap to closest position
          const distExpanded = Math.abs(currentY - SNAP_EXPANDED);
          const distHalf = Math.abs(currentY - SNAP_HALF);
          const distCollapsed = Math.abs(currentY - SNAP_COLLAPSED);

          const minDist = Math.min(distExpanded, distHalf, distCollapsed);
          if (minDist === distExpanded) targetSnap = SNAP_EXPANDED;
          else if (minDist === distHalf) targetSnap = SNAP_HALF;
          else targetSnap = SNAP_COLLAPSED;
        }

        Animated.spring(panY, {
          toValue: targetSnap,
          useNativeDriver: false,
          bounciness: 5,
          speed: 14,
        }).start();
      },
    }),
  ).current;

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      const addrName = `Oujda — ${loc.neighborhood}`;
      setRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      onSelectAddress(addrName);
      onClose();
    } catch {
      onSelectAddress("Oujda — Centre-Ville");
      onClose();
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectNeighborhood = (item: string) => {
    const addrName = `Oujda — ${item.split(" (")[0]}`;
    onSelectAddress(addrName);
    onClose();
  };

  // Map Pan & Zoom states using refs to guarantee real-time reactivity without stale closures
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [mapZoom, setMapZoom] = useState(1.0);
  const [activeAreaName, setActiveAreaName] = useState("Oujda — Centre-Ville");
  const [isOutOfArea, setIsOutOfArea] = useState(false);

  const mapPanRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });
  const mapZoomRef = useRef(1.0);
  const initialPinchDist = useRef<number | null>(null);
  const initialZoomOnPinch = useRef<number>(1.0);
  const activeAreaRef = useRef("Oujda — Centre-Ville");
  const isOutOfAreaRef = useRef(false);

  // Reactively calculate neighborhood & out of area warning based on map offset
  const updateSelectedPoint = (x: number, y: number) => {
    const dist = Math.hypot(x, y);
    let areaName = "Oujda — Centre-Ville";
    let outOfArea = false;

    if (dist > 180) {
      outOfArea = true;
      areaName = "Zone Hors-Livraison (Oujda Est)";
    } else {
      outOfArea = false;
      if (Math.abs(x) < 40 && Math.abs(y) < 40) {
        areaName = "Oujda — Centre-Ville";
      } else if (x > 40) {
        areaName = "Oujda — Hay Al Qods";
      } else if (x < -40) {
        areaName = "Oujda — Lazaret";
      } else if (y > 40) {
        areaName = "Oujda — Technopole";
      } else {
        areaName = "Oujda — Boulevard Mohammed V";
      }
    }

    activeAreaRef.current = areaName;
    isOutOfAreaRef.current = outOfArea;
    setIsOutOfArea(outOfArea);
    setActiveAreaName(areaName);
    return { areaName, outOfArea };
  };

  // PanResponder for 1-finger drag panning + 2-finger pinch-to-zoom + tap-to-select
  const mapPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (evt) => {
        startPanRef.current = {
          x: mapPanRef.current.x,
          y: mapPanRef.current.y,
        };
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialPinchDist.current = Math.hypot(dx, dy);
          initialZoomOnPinch.current = mapZoomRef.current;
        } else {
          initialPinchDist.current = null;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length === 2) {
          // 2-Finger Pinch Zoom In / Out
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDist = Math.hypot(dx, dy);

          if (initialPinchDist.current && initialPinchDist.current > 0) {
            const scaleRatio = currentDist / initialPinchDist.current;
            const newZoom = Math.max(
              0.5,
              Math.min(3.0, initialZoomOnPinch.current * scaleRatio),
            );
            mapZoomRef.current = newZoom;
            setMapZoom(newZoom);
          }
        } else if (!initialPinchDist.current) {
          // 1-Finger Drag / Pan: Direct 1:1 displacement tracking
          const newX = startPanRef.current.x + gestureState.dx;
          const newY = startPanRef.current.y + gestureState.dy;
          mapPanRef.current = { x: newX, y: newY };
          setMapPan({ x: newX, y: newY });
          updateSelectedPoint(newX, newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        initialPinchDist.current = null;
        const distMoved = Math.hypot(gestureState.dx, gestureState.dy);

        // Tap to select / center point
        if (distMoved < 6) {
          const offsetX = (gestureState.x0 - 180) * 0.4;
          const offsetY = (gestureState.y0 - 200) * 0.4;
          const newX = startPanRef.current.x - offsetX;
          const newY = startPanRef.current.y - offsetY;
          mapPanRef.current = { x: newX, y: newY };
          setMapPan({ x: newX, y: newY });
          const { areaName, outOfArea } = updateSelectedPoint(newX, newY);
          if (!outOfArea) {
            onSelectAddress(areaName);
          }
          return;
        }

        // Drag release: commit current selected address
        if (!isOutOfAreaRef.current && activeAreaRef.current) {
          onSelectAddress(activeAreaRef.current);
        }
      },
    }),
  ).current;

  const handleRecenter = () => {
    mapPanRef.current = { x: 0, y: 0 };
    mapZoomRef.current = 1.0;
    setMapPan({ x: 0, y: 0 });
    setMapZoom(1.0);
    updateSelectedPoint(0, 0);
    onSelectAddress("Oujda — Centre-Ville");
  };

  // Reactive Parallax map scaling & opacity based on sheet position
  const mapOpacity = panY.interpolate({
    inputRange: [SNAP_EXPANDED, SNAP_HALF, SNAP_COLLAPSED],
    outputRange: [0.3, 0.85, 1.0],
    extrapolate: "clamp",
  });

  const mapScale = panY.interpolate({
    inputRange: [SNAP_EXPANDED, SNAP_HALF, SNAP_COLLAPSED],
    outputRange: [0.92, 0.98, 1.0],
    extrapolate: "clamp",
  });

  const isNativeMapSupported =
    Platform.OS !== "web" && !isExpoGo && MapView && Marker && !mapError;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Upper Interactive Map Section with Reactive Scale/Fade */}
        <Animated.View
          style={[
            styles.mapContainer,
            {
              opacity: mapOpacity,
              transform: [{ scale: mapScale }],
            },
          ]}
        >
          {isNativeMapSupported ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={region}
              onRegionChangeComplete={(newReg: any) => {
                setRegion(newReg);
                onSelectAddress(
                  `Oujda (${newReg.latitude.toFixed(4)}, ${newReg.longitude.toFixed(4)})`,
                );
              }}
            >
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
              >
                <View style={styles.customMapPin}>
                  <AlertTriangle size={20} color={Colors.white} />
                </View>
              </Marker>
            </MapView>
          ) : (
            <View {...mapPanResponder.panHandlers} style={styles.webMapSim}>
              {/* Reactive Oujda Road Network Grid */}
              <View
                style={[
                  styles.mapGridLayer,
                  {
                    transform: [
                      { translateX: mapPan.x },
                      { translateY: mapPan.y },
                      { scale: mapZoom },
                    ],
                  },
                ]}
              >
                <View style={styles.roadLineHoriz} />
                <View style={styles.roadLineVert} />
                <View style={styles.roadLineDiag1} />
                <View style={styles.roadLineDiag2} />

                {/* Interactive Neighborhood Badges */}
                <TouchableOpacity
                  style={[styles.mapCityBadge, { top: "25%", left: "20%" }]}
                  onPress={() => {
                    const nx = -60,
                      ny = -40;
                    mapPanRef.current = { x: nx, y: ny };
                    setMapPan({ x: nx, y: ny });
                    const { areaName } = updateSelectedPoint(nx, ny);
                    onSelectAddress(areaName);
                  }}
                >
                  <Text style={styles.mapCityText}>📍 Bd Mohammed V</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapCityBadge, { top: "45%", left: "65%" }]}
                  onPress={() => {
                    const nx = 80,
                      ny = 0;
                    mapPanRef.current = { x: nx, y: ny };
                    setMapPan({ x: nx, y: ny });
                    const { areaName } = updateSelectedPoint(nx, ny);
                    onSelectAddress(areaName);
                  }}
                >
                  <Text style={styles.mapCityText}>📍 Hay Al Qods</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapCityBadge, { top: "65%", left: "30%" }]}
                  onPress={() => {
                    const nx = 0,
                      ny = 80;
                    mapPanRef.current = { x: nx, y: ny };
                    setMapPan({ x: nx, y: ny });
                    const { areaName } = updateSelectedPoint(nx, ny);
                    onSelectAddress(areaName);
                  }}
                >
                  <Text style={styles.mapCityText}>📍 Technopole</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mapCityBadge, { top: "35%", left: "10%" }]}
                  onPress={() => {
                    const nx = -80,
                      ny = 0;
                    mapPanRef.current = { x: nx, y: ny };
                    setMapPan({ x: nx, y: ny });
                    const { areaName } = updateSelectedPoint(nx, ny);
                    onSelectAddress(areaName);
                  }}
                >
                  <Text style={styles.mapCityText}>📍 Lazaret</Text>
                </TouchableOpacity>
              </View>

              {/* Fixed Center Pin Marker with Active Selection Tooltip */}
              <View style={styles.centerPinWrapper} pointerEvents="none">
                {isOutOfArea ? (
                  <View style={styles.tooltipBadgeWarning}>
                    <Text style={styles.tooltipTextWarning}>
                      Zone Hors-Livraison ⚠️
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tooltipBadgeActive}>
                    <Text style={styles.tooltipTextActive}>
                      📍 {activeAreaName}
                    </Text>
                  </View>
                )}
                <View style={styles.pinCircleWarning}>
                  <AlertTriangle size={24} color="#1F2937" />
                </View>
                <View style={styles.pinShadow} />
              </View>
            </View>
          )}

          {/* Floating Bottom Right Re-center Compass Button */}
          <TouchableOpacity
            style={styles.recenterButtonCircle}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Navigation
              size={22}
              color="#1F2937"
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Floating Top Left Close Button (X) - Always visible & functional */}
        <SafeAreaView style={styles.topBarOverlay}>
          <TouchableOpacity
            style={styles.closeButtonCircle}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X size={22} color="#1F2937" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Lower Draggable White Bottom Sheet Panel */}
        <Animated.View
          style={[
            styles.bottomSheetCard,
            {
              height: SHEET_MAX_HEIGHT,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Top Sheet Drag Handle Bar Area */}
          <View {...panResponder.panHandlers} style={styles.handleBarWrapper}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              Où souhaitez-vous être livré ?
            </Text>
          </View>

          {/* Option 1: Use Current Location */}
          <TouchableOpacity
            style={styles.currentLocationRow}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.8}
            disabled={isLocating}
          >
            <View style={styles.compassIconWrapper}>
              <Navigation
                size={22}
                color="#1F2937"
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            </View>
            <View style={styles.currentLocationTextCol}>
              <Text style={styles.currentLocationTitle}>
                {isLocating
                  ? "Localisation GPS..."
                  : "Utiliser ma position actuelle"}
              </Text>
              <Text style={styles.currentLocationSub}>Recommandé</Text>
            </View>
          </TouchableOpacity>

          {/* Add a New Address Button */}
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => {
              Alert.prompt(
                "Nouvelle adresse",
                "Entrez votre adresse exacte à Oujda :",
                (text: string | null) => {
                  if (text && text.trim()) {
                    onSelectAddress(`Oujda — ${text.trim()}`);
                    onClose();
                  }
                },
              );
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.addAddressButtonText}>
              Ajouter une nouvelle adresse
            </Text>
          </TouchableOpacity>

          {/* Saved / Oujda Delivery Neighborhoods List */}
          <Text style={styles.neighborhoodsHeader}>
            QUARTIERS DE LIVRAISON (OUJDA)
          </Text>

          <ScrollView
            style={styles.neighborhoodList}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {OUJDA_NEIGHBORHOODS.map((item) => {
              const neighborhoodName = `Oujda — ${item.split(" (")[0]}`;
              const isSelected = selectedAddress === neighborhoodName;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.neighborhoodRow,
                    isSelected && styles.neighborhoodRowSelected,
                  ]}
                  onPress={() => handleSelectNeighborhood(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.neighborhoodRowLeft}>
                    <MapPin
                      size={18}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.neighborhoodName,
                        isSelected && styles.neighborhoodNameSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </View>
                  {isSelected && <Check size={18} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#EBF3F5",
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  webMapSim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mapGridLayer: {
    ...StyleSheet.absoluteFill,
    width: "200%",
    height: "200%",
    left: "-50%",
    top: "-50%",
    backgroundColor: "#E2ECE9",
  },
  roadLineHoriz: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#FFFFFF",
  },
  roadLineVert: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: "#FFFFFF",
  },
  roadLineDiag1: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "25deg" }],
  },
  roadLineDiag2: {
    position: "absolute",
    top: "70%",
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-25deg" }],
  },
  mapCityBadge: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0066FF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  mapCityText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0066FF",
  },
  centerPinWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  tooltipBadgeActive: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tooltipTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  tooltipBadgeWarning: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 6,
  },
  tooltipTextWarning: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: 4,
  },
  tooltipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  pinCircleWarning: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1F2937",
    elevation: 6,
  },
  customMapPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 16,
    left: 16,
    zIndex: 9999,
    elevation: 10,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recenterButtonCircle: {
    position: "absolute",
    bottom: 400,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomSheetCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    zIndex: 100,
  },
  handleBarWrapper: {
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    marginVertical: 4,
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
  },
  compassIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  currentLocationTextCol: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  currentLocationSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  addAddressButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  neighborhoodsHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  neighborhoodList: {
    flex: 1,
  },
  neighborhoodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  neighborhoodRowSelected: {
    backgroundColor: Colors.primaryLight + "30",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  neighborhoodRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  neighborhoodName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  neighborhoodNameSelected: {
    fontWeight: "800",
    color: Colors.primary,
  },
});
