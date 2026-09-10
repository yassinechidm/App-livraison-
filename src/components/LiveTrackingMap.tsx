import Colors from "@/constants/Colors";
import { liveLocationService } from "@/services/liveLocation.service";
import { Compass, Maximize2, Minimize2 } from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let WebViewComponent: any = null;
if (Platform.OS !== "web") {
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch (err) {
    console.warn("[LiveTrackingMap] WebView load notice:", err);
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
  lastUpdated?: string | Date;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  courierLocation,
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
  lastUpdated,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webViewRef = useRef<any>(null);
  const fullscreenWebViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement | null>(null);

  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const currentCourierCoord = useMemo(() => {
    return courierLocation || { latitude: 34.688, longitude: -1.913 };
  }, [courierLocation]);

  useEffect(() => {
    if (!courierLocation) return;
    setLastPingTime(Date.now());
    setSecondsAgo(0);

    const jsCode = `if (window.updateCourierLocation) { window.updateCourierLocation(${courierLocation.latitude}, ${courierLocation.longitude}); } true;`;

    if (Platform.OS === "web") {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          (iframeRef.current.contentWindow as any).updateCourierLocation?.(
            courierLocation.latitude,
            courierLocation.longitude,
          );
        } catch {}
      }
      if (
        fullscreenIframeRef.current &&
        fullscreenIframeRef.current.contentWindow
      ) {
        try {
          (
            fullscreenIframeRef.current.contentWindow as any
          ).updateCourierLocation?.(
            courierLocation.latitude,
            courierLocation.longitude,
          );
        } catch {}
      }
    } else {
      if (webViewRef.current) {
        try {
          webViewRef.current.injectJavaScript(jsCode);
        } catch {}
      }
      if (fullscreenWebViewRef.current) {
        try {
          fullscreenWebViewRef.current.injectJavaScript(jsCode);
        } catch {}
      }
    }
  }, [courierLocation?.latitude, courierLocation?.longitude]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const baseTime = lastUpdated
        ? new Date(lastUpdated).getTime()
        : lastPingTime;
      const diffSec = Math.max(0, Math.floor((now - baseTime) / 1000));
      setSecondsAgo(diffSec);
    }, 3000);

    return () => clearInterval(interval);
  }, [lastUpdated, lastPingTime]);

  const distanceKm = useMemo(() => {
    return liveLocationService.calculateDistanceKm(
      currentCourierCoord.latitude,
      currentCourierCoord.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
    );
  }, [currentCourierCoord, deliveryLocation]);

  const etaMinutes = useMemo(() => {
    return liveLocationService.calculateEtaMinutes(distanceKm);
  }, [distanceKm]);

  const gpsStatus = useMemo(() => {
    if (!courierLocation) {
      return {
        label: "GPS en attente",
        color: "#64748B",
        bgColor: "#F1F5F9",
        isLive: false,
      };
    }
    if (secondsAgo <= 15) {
      return {
        label: "GPS LIVE",
        color: "#10B981",
        bgColor: "#D1FAE5",
        isLive: true,
      };
    }
    if (secondsAgo <= 45) {
      return {
        label: "Mise à jour...",
        color: "#F59E0B",
        bgColor: "#FEF3C7",
        isLive: true,
      };
    }
    return {
      label: "Signal faible",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      isLive: false,
    };
  }, [courierLocation, secondsAgo]);

  const fitMapBounds = useCallback((fullscreen = false) => {
    const jsCode = `if (window.recenterMap) { window.recenterMap(); } true;`;
    if (Platform.OS === "web") {
      const targetIframe = fullscreen
        ? fullscreenIframeRef.current
        : iframeRef.current;
      if (targetIframe && targetIframe.contentWindow) {
        try {
          (targetIframe.contentWindow as any).recenterMap?.();
        } catch {}
      }
    } else {
      const targetWeb = fullscreen
        ? fullscreenWebViewRef.current
        : webViewRef.current;
      if (targetWeb) {
        try {
          targetWeb.injectJavaScript(jsCode);
        } catch {}
      }
    }
  }, []);

  const leafletHtml = useMemo(() => {
    const courierLat = currentCourierCoord.latitude;
    const courierLng = currentCourierCoord.longitude;
    const deliveryLat = deliveryLocation.latitude;
    const deliveryLng = deliveryLocation.longitude;
    const restLat = restaurantLocation?.latitude || 34.689;
    const restLng = restaurantLocation?.longitude || -1.915;
    const hasRest = Boolean(restaurantLocation);
    const courierSafeName = JSON.stringify(courierName);
    const deliverySafeAddress = JSON.stringify(
      deliveryLocation.addressText || "Adresse de livraison",
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <style>
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background: #E5E3DF;
      overflow: hidden;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .custom-div-icon {
      background: transparent;
      border: none;
    }
    .marker-pin {
      width: 38px;
      height: 38px;
      border-radius: 19px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);
      border: 2.5px solid #FFFFFF;
      position: relative;
    }
    .courier-pin {
      background: #5C5BDB;
    }
    .courier-pulse {
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 27px;
      background: rgba(92, 91, 219, 0.35);
      animation: courierPulse 2s infinite ease-out;
      pointer-events: none;
      top: -8px;
      left: -8px;
      z-index: -1;
    }
    @keyframes courierPulse {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    .resto-pin {
      background: #F43F5E;
    }
    .client-pin {
      background: #10B981;
    }
    .pin-label {
      background: rgba(255, 255, 255, 0.96);
      color: #0F172A;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 8px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      white-space: nowrap;
      position: absolute;
      top: 40px;
      left: 50%;
      transform: translateX(-50%);
    }
    .courier-label {
      background: #5C5BDB;
      color: #FFFFFF;
      border-color: #5C5BDB;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${(courierLat + deliveryLat) / 2}, ${(courierLng + deliveryLng) / 2}], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    var courierCoord = [${courierLat}, ${courierLng}];
    var deliveryCoord = [${deliveryLat}, ${deliveryLng}];
    var hasRestaurant = ${hasRest};
    var restoCoord = [${restLat}, ${restLng}];

    function createIcon(htmlContent, size) {
      return L.divIcon({
        className: 'custom-div-icon',
        html: htmlContent,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });
    }

    var courierIconHtml = '<div class="courier-pulse"></div><div class="marker-pin courier-pin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg><div class="pin-label courier-label">' + ${courierSafeName} + '</div></div>';
    var courierMarker = L.marker(courierCoord, { icon: createIcon(courierIconHtml, 38), zIndexOffset: 1000 }).addTo(map);

    var clientIconHtml = '<div class="marker-pin client-pin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><div class="pin-label">' + ${deliverySafeAddress} + '</div></div>';
    var deliveryMarker = L.marker(deliveryCoord, { icon: createIcon(clientIconHtml, 38) }).addTo(map);

    var restoMarker = null;
    if (hasRestaurant) {
      var restoIconHtml = '<div class="marker-pin resto-pin"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8Z"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg><div class="pin-label">Restaurant</div></div>';
      restoMarker = L.marker(restoCoord, { icon: createIcon(restoIconHtml, 38) }).addTo(map);
    }

    var routePoints = [];
    if (hasRestaurant) routePoints.push(restoCoord);
    routePoints.push(courierCoord);
    routePoints.push(deliveryCoord);

    var routeLine = L.polyline(routePoints, {
      color: '#5C5BDB',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 8',
      lineCap: 'round'
    }).addTo(map);

    window.recenterMap = function() {
      var bounds = L.latLngBounds([courierMarker.getLatLng(), deliveryCoord]);
      if (hasRestaurant) bounds.extend(restoCoord);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      map.invalidateSize();
    };

    setTimeout(function() {
      window.recenterMap();
    }, 200);

    var currentCourierAnim = null;
    window.updateCourierLocation = function(toLat, toLng) {
      var startLat = courierMarker.getLatLng().lat;
      var startLng = courierMarker.getLatLng().lng;
      var startTime = performance.now();
      var duration = 1200;

      if (currentCourierAnim) cancelAnimationFrame(currentCourierAnim);

      function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var ease = 1 - Math.pow(1 - progress, 3);

        var curLat = startLat + (toLat - startLat) * ease;
        var curLng = startLng + (toLng - startLng) * ease;

        courierMarker.setLatLng([curLat, curLng]);

        var updatedRoute = [];
        if (hasRestaurant) updatedRoute.push(restoCoord);
        updatedRoute.push([curLat, curLng]);
        updatedRoute.push(deliveryCoord);
        routeLine.setLatLngs(updatedRoute);

        if (progress < 1) {
          currentCourierAnim = requestAnimationFrame(step);
        }
      }
      currentCourierAnim = requestAnimationFrame(step);
    };
  </script>
</body>
</html>`;
  }, [
    currentCourierCoord.latitude,
    currentCourierCoord.longitude,
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    deliveryLocation.addressText,
    restaurantLocation,
    courierName,
  ]);

  return (
    <View style={[styles.container, { height }]}>
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef as any}
            srcDoc={leafletHtml}
            style={
              {
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              } as any
            }
          />
        ) : WebViewComponent ? (
          <WebViewComponent
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: leafletHtml }}
            style={StyleSheet.absoluteFill}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.webMapBackground}>
            <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
              Carte en cours de chargement...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.floatingControlsRow}>
        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={() => fitMapBounds(false)}
          activeOpacity={0.8}
        >
          <Compass size={17} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={() => setIsFullscreen(true)}
          activeOpacity={0.8}
        >
          <Maximize2 size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.floatingEtaCard}>
        <View style={styles.etaLeft}>
          <View
            style={[
              styles.pulseOuterRing,
              { backgroundColor: gpsStatus.bgColor },
            ]}
          >
            <View
              style={[
                styles.livePulseDot,
                { backgroundColor: gpsStatus.color },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.etaTitle}>
                {orderStatus === "DELIVERED"
                  ? "Commande livrée"
                  : `Arrivée dans ~${etaMinutes} min`}
              </Text>
              <View
                style={[styles.liveTag, { backgroundColor: gpsStatus.bgColor }]}
              >
                <Text style={[styles.liveTagText, { color: gpsStatus.color }]}>
                  {gpsStatus.label}
                </Text>
              </View>
            </View>
            <Text style={styles.etaSub} numberOfLines={1}>
              Distance : {distanceKm} km •{" "}
              {secondsAgo > 0 ? `Il y a ${secondsAgo}s` : "En direct"}
            </Text>
          </View>
        </View>
      </View>

      <Modal
        visible={isFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <StatusBar barStyle="dark-content" />

          <View style={styles.fullscreenMapWrap}>
            {Platform.OS === "web" ? (
              <iframe
                ref={fullscreenIframeRef as any}
                srcDoc={leafletHtml}
                style={
                  {
                    width: "100%",
                    height: "100%",
                    border: "none",
                    display: "block",
                  } as any
                }
              />
            ) : WebViewComponent ? (
              <WebViewComponent
                ref={fullscreenWebViewRef}
                originWhitelist={["*"]}
                source={{ html: leafletHtml }}
                style={StyleSheet.absoluteFill}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.webMapBackground}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                  Carte interactive en plein écran
                </Text>
              </View>
            )}
          </View>

          <View style={styles.fullscreenHeaderOverlay}>
            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => setIsFullscreen(false)}
              activeOpacity={0.8}
            >
              <Minimize2 size={18} color={Colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.fullscreenHeaderCenter}>
              <Text style={styles.fullscreenHeaderTitle}>Suivi en direct</Text>
              <Text style={styles.fullscreenHeaderSub} numberOfLines={1}>
                {deliveryLocation.addressText || "Oujda"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.fullscreenCloseBtn}
              onPress={() => fitMapBounds(true)}
              activeOpacity={0.8}
            >
              <Compass size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fullscreenBottomCard}>
            <View style={styles.fullscreenEtaRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={styles.fullscreenEtaMain}>
                    {orderStatus === "DELIVERED"
                      ? "Commande livrée"
                      : `~${etaMinutes} min restante(s)`}
                  </Text>
                  <View
                    style={[
                      styles.liveTag,
                      { backgroundColor: gpsStatus.bgColor },
                    ]}
                  >
                    <Text
                      style={[styles.liveTagText, { color: gpsStatus.color }]}
                    >
                      {gpsStatus.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.fullscreenEtaSub}>
                  Distance estimée : {distanceKm} km • {courierName}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  floatingControlsRow: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  controlCircleBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  webMapBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#E5E3DF",
    justifyContent: "center",
    alignItems: "center",
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
    zIndex: 10,
  },
  etaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pulseOuterRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  etaTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: "900",
  },
  etaSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  navButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    elevation: 2,
  },
  navButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  fullscreenMapWrap: {
    flex: 1,
    position: "relative",
  },
  fullscreenHeaderOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 20,
  },
  fullscreenCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  fullscreenHeaderCenter: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    maxWidth: "60%",
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  fullscreenHeaderTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  fullscreenHeaderSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 1,
  },
  fullscreenBottomCard: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    zIndex: 20,
  },
  fullscreenEtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fullscreenEtaMain: {
    fontSize: 15,
    fontWeight: "900",
    color: Colors.textPrimary,
  },
  fullscreenEtaSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    fontWeight: "500",
  },
  fullscreenNavBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    elevation: 3,
  },
  fullscreenNavBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
});
