import Colors from "@/constants/Colors";
import { OUJDA_NEIGHBORHOODS } from "@/constants/mockData";
import { locationService } from "@/services/location.service";
import { useLanguage } from "@/src/context/LanguageContext";
import {
    ArrowLeft,
    Edit2,
    Home,
    MapPin,
    Navigation,
    Search,
    X
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

let WebViewComponent: any = null;
if (Platform.OS !== "web") {
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch (err) {
    console.warn("[LocationPickerModal] WebView load notice:", err);
  }
}

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "Centre-Ville (وسط المدينة)": { lat: 34.6867, lng: -1.9114 },
  "Boulevard Mohammed V": { lat: 34.689, lng: -1.9135 },
  "Quartier Lazaret (لازاريت)": { lat: 34.675, lng: -1.905 },
  "Hay Al Qods (حي القدس)": { lat: 34.671, lng: -1.932 },
  "Hay Salam (حي السلام)": { lat: 34.664, lng: -1.895 },
  "Hay Al Hikma (حي الحكمة)": { lat: 34.668, lng: -1.918 },
  "Sidi Yahya (سيدي يحيى)": { lat: 34.652, lng: -1.901 },
  "Hay Andalous (حي الأندلس)": { lat: 34.682, lng: -1.925 },
  "Hay Al Wahda (حي الوحدة)": { lat: 34.695, lng: -1.92 },
  "Mir Ali (مير علي)": { lat: 34.678, lng: -1.899 },
  "Village Touba (قرية طوبة)": { lat: 34.672, lng: -1.888 },
  "Hay Ennasr (حي النصر)": { lat: 34.701, lng: -1.915 },
  "Hay Riad (حي الرياض)": { lat: 34.685, lng: -1.938 },
  "Hay Al Farah (حي الفرح)": { lat: 34.691, lng: -1.898 },
  "Isly / Campus Universitaire (إسلي)": { lat: 34.651, lng: -1.898 },
  "Boulevard Derfoufi (شارع الدرفوفي)": { lat: 34.6845, lng: -1.916 },
  "Hay Zaitoun (حي الزيتون)": { lat: 34.679, lng: -1.942 },
  "Boulevard Allal Ben Abdellah": { lat: 34.6875, lng: -1.91 },
  "Hay Smara (حي السمارة)": { lat: 34.693, lng: -1.931 },
  "Hay Al Bassatine (حي البساتين)": { lat: 34.704, lng: -1.908 },
  "Zone Industrielle Oujda": { lat: 34.712, lng: -1.935 },
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAddress: string;
  onSelectAddress: (address: string) => void;
}

interface SavedAddressItem {
  id: string;
  title: string;
  subtitle: string;
  coords: { lat: number; lng: number };
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  selectedAddress,
  onSelectAddress,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(
    selectedAddress || "Rue Ziri Ibn Atia, 35",
  );
  const [coords, setCoords] = useState({
    latitude: 34.6867,
    longitude: -1.9114,
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([
    {
      id: "1",
      title: "Rue Ziri Ibn Atia, 35",
      subtitle: "Appt 4, Hay Al Qods, Oujda",
      coords: { lat: 34.671, lng: -1.932 },
    },
    {
      id: "2",
      title: "Boulevard Mohammed V",
      subtitle: "Bureau 12, Centre-Ville, Oujda",
      coords: { lat: 34.689, lng: -1.9135 },
    },
  ]);

  const webViewRef = useRef<any>(null);
  const geocodeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setCurrentAddress(selectedAddress || "Rue Ziri Ibn Atia, 35");
      setViewMode("list");
      setIsSearchActive(false);
    }
  }, [visible, selectedAddress]);

  const handleCoordinatesChanged = (latitude: number, longitude: number) => {
    setCoords({ latitude, longitude });

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    geocodeTimeoutRef.current = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const exactStreet = await locationService.reverseGeocode(
          latitude,
          longitude,
        );
        if (exactStreet) {
          setCurrentAddress(exactStreet);
          if (webViewRef.current?.injectJavaScript) {
            const safe = exactStreet.replace(/'/g, "\\'").replace(/"/g, '\\"');
            webViewRef.current.injectJavaScript(
              `window.updateTooltip('${safe}'); true;`,
            );
          }
        }
      } catch (err) {
        console.warn("[LocationPicker] Geocoding error:", err);
      } finally {
        setIsGeocoding(false);
      }
    }, 250);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === "LOCATION_CHANGED") {
        handleCoordinatesChanged(data.latitude, data.longitude);
      }
    } catch (e) {
      console.warn("WebView message parse notice:", e);
    }
  };

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const onMessage = (event: MessageEvent) => {
        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          if (data?.type === "LOCATION_CHANGED") {
            handleCoordinatesChanged(data.latitude, data.longitude);
          }
        } catch {}
      };
      window.addEventListener("message", onMessage);
      return () => window.removeEventListener("message", onMessage);
    }
  }, []);

  const handleSelectNeighborhood = async (item: string) => {
    const coordsPreset = NEIGHBORHOOD_COORDS[item] || {
      lat: 34.6867,
      lng: -1.9114,
    };
    const addrName = `Oujda — ${item.split(" (")[0]}`;
    setCurrentAddress(addrName);
    setCoords({ latitude: coordsPreset.lat, longitude: coordsPreset.lng });
    setIsSearchActive(false);

    if (webViewRef.current?.injectJavaScript) {
      webViewRef.current.injectJavaScript(
        `window.flyToLocation(${coordsPreset.lat}, ${coordsPreset.lng}); true;`,
      );
    }

    try {
      const exact = await locationService.reverseGeocode(
        coordsPreset.lat,
        coordsPreset.lng,
      );
      if (exact) {
        setCurrentAddress(exact);
      }
    } catch {}
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc && loc.latitude && loc.longitude) {
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });

        if (webViewRef.current?.injectJavaScript) {
          webViewRef.current.injectJavaScript(
            `window.flyToLocation(${loc.latitude}, ${loc.longitude}); true;`,
          );
        }

        const exact = await locationService.reverseGeocode(
          loc.latitude,
          loc.longitude,
        );
        const resolved = exact || loc.address || "Position GPS";
        setCurrentAddress(resolved);
        onSelectAddress(resolved);
        onClose();
      }
    } catch {
      Alert.alert("Position GPS", "Impossible de récupérer votre position.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectSavedAddress = (item: SavedAddressItem) => {
    setCurrentAddress(item.title);
    onSelectAddress(item.title);
    onClose();
  };

  const handleConfirmLocation = () => {
    onSelectAddress(currentAddress);
    onClose();
  };

  const filteredNeighborhoods = useMemo(() => {
    if (!searchQuery.trim()) return OUJDA_NEIGHBORHOODS;
    const q = searchQuery.toLowerCase();
    return OUJDA_NEIGHBORHOODS.filter((n) => n.toLowerCase().includes(q));
  }, [searchQuery]);

  // Real Google Maps interactive HTML template with house marker
  const mapHtml = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #E5E3DF;
      overflow: hidden;
      touch-action: none;
    }
    .center-pin-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      z-index: 1000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .pin-tooltip {
      background: #3C3489;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      white-space: nowrap;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 6px;
      position: relative;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .pin-tooltip:after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px 5px 0;
      border-style: solid;
      border-color: #3C3489 transparent;
      display: block;
      width: 0;
    }
    .pin-marker {
      width: 52px;
      height: 52px;
      background: #5C5BDB;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3.5px solid #FFFFFF;
      box-shadow: 0 8px 20px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .pin-marker svg {
      transform: rotate(45deg);
    }
    .pin-shadow {
      width: 20px;
      height: 7px;
      background: rgba(0,0,0,0.28);
      border-radius: 50%;
      margin-top: 2px;
    }
    .pin-moving .pin-marker {
      transform: translateY(-12px) rotate(-45deg) scale(1.08);
    }
    .pin-moving .pin-tooltip {
      transform: translateY(-8px);
    }
  </style>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <div id="map"></div>
  <div id="center-pin" class="center-pin-container">
    <div id="tooltip" class="pin-tooltip">Rue Ziri Ibn Atia, 35</div>
    <div class="pin-marker">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>
    <div class="pin-shadow"></div>
  </div>
  <script>
    var map = L.map('map', {
      center: [${coords.latitude}, ${coords.longitude}],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    var pin = document.getElementById('center-pin');

    map.on('movestart', function() {
      pin.classList.add('pin-moving');
    });

    map.on('moveend', function() {
      pin.classList.remove('pin-moving');
      var center = map.getCenter();
      var msg = JSON.stringify({
        type: 'LOCATION_CHANGED',
        latitude: center.lat,
        longitude: center.lng
      });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent) {
        window.parent.postMessage(msg, '*');
      }
    });

    map.on('click', function(e) {
      map.flyTo(e.latlng, map.getZoom(), { duration: 0.5 });
    });

    window.flyToLocation = function(targetLat, targetLng) {
      map.flyTo([targetLat, targetLng], 16, { duration: 0.7 });
    };

    window.updateTooltip = function(text) {
      document.getElementById('tooltip').innerText = text;
    };
  </script>
</body>
</html>
`,
    [coords.latitude, coords.longitude],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Full-bleed Map Canvas */}
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <View style={StyleSheet.absoluteFill}>
              {/* @ts-ignore */}
              <iframe
                srcDoc={mapHtml}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            </View>
          ) : WebViewComponent ? (
            <WebViewComponent
              ref={webViewRef}
              source={{ html: mapHtml }}
              style={StyleSheet.absoluteFill}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              scalesPageToFit={false}
              scrollEnabled={false}
            />
          ) : null}

          {/* Top Bar (Glovo style) */}
          <SafeAreaView style={styles.topBar}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => {
                if (isSearchActive) {
                  setIsSearchActive(false);
                } else if (viewMode === "map") {
                  setViewMode("list");
                } else {
                  onClose();
                }
              }}
              activeOpacity={0.8}
            >
              {viewMode === "map" || isSearchActive ? (
                <ArrowLeft size={20} color="#3C3489" />
              ) : (
                <X size={20} color="#3C3489" />
              )}
            </TouchableOpacity>

            {/* Top Search Pill */}
            <TouchableOpacity
              style={styles.topSearchPill}
              onPress={() => setIsSearchActive(true)}
              activeOpacity={0.9}
            >
              <Search size={16} color="#7F77DD" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.topSearchInput}
                placeholder={t("nav.search", "Search")}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!isSearchActive) setIsSearchActive(true);
                }}
                onFocus={() => setIsSearchActive(true)}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={15} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </SafeAreaView>

          {/* Floating Recenter Button */}
          <TouchableOpacity
            style={styles.recenterFab}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.85}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Navigation
                size={20}
                color="#3C3489"
                style={{ transform: [{ rotate: "45deg" }] }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search Dropdown Modal/Overlay ── */}
        {isSearchActive && (
          <View style={styles.searchOverlay}>
            <View style={styles.searchOverlayHeader}>
              <Text style={styles.searchOverlayTitle}>
                Quartiers et rues d'Oujda
              </Text>
              <TouchableOpacity onPress={() => setIsSearchActive(false)}>
                <Text style={styles.searchOverlayCancel}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.searchOverlayList}
              keyboardShouldPersistTaps="handled"
            >
              {filteredNeighborhoods.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.searchOverlayItem}
                  onPress={() => handleSelectNeighborhood(item)}
                >
                  <MapPin
                    size={18}
                    color="#7F77DD"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.searchOverlayItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── MODE 1: "Where should we deliver?" Sheet (Screenshot #11, #14) ── */}
        {viewMode === "list" && !isSearchActive && (
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandleArea}>
              <View style={styles.sheetHandle} />
            </View>

            <Text style={styles.sheetTitle}>
              {t("location.where", "Where should we deliver?")}
            </Text>

            {/* Option 1: Use Current Location */}
            <TouchableOpacity
              style={styles.addressRow}
              onPress={handleUseCurrentLocation}
              activeOpacity={0.7}
            >
              <View style={styles.addressIconCircle}>
                <Navigation
                  size={18}
                  color="#3C3489"
                  style={{ transform: [{ rotate: "45deg" }] }}
                />
              </View>
              <View style={styles.addressTextCol}>
                <Text style={styles.addressTitle}>Use current location</Text>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>Recommended</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 2: Saved Addresses */}
            {savedAddresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={styles.addressRow}
                onPress={() => handleSelectSavedAddress(addr)}
                activeOpacity={0.7}
              >
                <View style={styles.addressIconCircle}>
                  <Home size={18} color="#3C3489" />
                </View>
                <View style={styles.addressTextCol}>
                  <Text style={styles.addressTitle}>{addr.title}</Text>
                  <Text style={styles.addressSubtitle}>{addr.subtitle}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editCircle}
                  onPress={() => {
                    setCurrentAddress(addr.title);
                    setCoords({
                      latitude: addr.coords.lat,
                      longitude: addr.coords.lng,
                    });
                    setViewMode("map");
                  }}
                >
                  <Edit2 size={16} color="#7F77DD" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* Add a new address button */}
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => setViewMode("map")}
              activeOpacity={0.85}
            >
              <Text style={styles.addAddressButtonText}>
                {t("location.addNew", "Add a new address")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── MODE 2: Pin Confirmation Card (Screenshot #15) ── */}
        {viewMode === "map" && !isSearchActive && (
          <View style={styles.mapPinBottomContainer}>
            <View style={styles.pinInstructionBox}>
              <Text style={styles.pinInstructionText}>
                Move the pin until you find your address
              </Text>
              {isGeocoding && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.confirmAddressButton}
              onPress={handleConfirmLocation}
              activeOpacity={0.9}
            >
              <Text style={styles.confirmAddressButtonText}>
                {t("location.confirm", "Confirm address")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "android" ? 36 : 10,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 200,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 10,
  },
  topSearchPill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topSearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#3C3489",
    padding: 0,
  },
  recenterFab: {
    position: "absolute",
    right: 18,
    bottom: 220,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },

  // Search overlay
  searchOverlay: {
    position: "absolute",
    top: Platform.OS === "android" ? 90 : 70,
    left: 16,
    right: 16,
    maxHeight: SCREEN_HEIGHT * 0.6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 300,
  },
  searchOverlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchOverlayTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
  },
  searchOverlayCancel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  searchOverlayList: {
    marginTop: 8,
  },
  searchOverlayItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  searchOverlayItemText: {
    fontSize: 14,
    color: "#7F77DD",
    fontWeight: "500",
  },

  // Where should we deliver sheet (Screenshot #11)
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandleArea: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CECBF6",
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3C3489",
    marginVertical: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  addressTextCol: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },
  addressSubtitle: {
    fontSize: 13,
    color: "#7F77DD",
    marginTop: 2,
  },
  recommendedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFD166",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  recommendedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3C3489",
  },
  editCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  addAddressButton: {
    marginTop: 18,
    backgroundColor: "#F3F4F6",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addAddressButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C3489",
  },

  // Pin Confirmation mode (Screenshot #15)
  mapPinBottomContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 20,
    left: 16,
    right: 16,
    zIndex: 150,
  },
  pinInstructionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pinInstructionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3C3489",
    textAlign: "center",
  },
  confirmAddressButton: {
    backgroundColor: Colors.cta, // Matches the Glovo confirmation green / primary
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmAddressButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
