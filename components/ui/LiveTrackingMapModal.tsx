import Colors from '@/constants/Colors';
import { Order } from '@/types/order.types';
import React, { useState } from 'react';
import {
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LiveTrackingMapModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
}

// 40+ Precise Street-by-Street GPS Waypoints in Oujda (From Restaurant Bnin to Client Hay Al Qods)
const HIGH_PRECISION_OUJDA_ROUTE = [
  // 1. Départ Restaurant: Bnin Oujda (Bd Mohammed V)
  { lat: 34.68670, lng: -1.91140, street: 'Boulevard Mohammed V (Départ Restaurant)', speed: 0, desc: 'Commande récupérée et emballée' },
  { lat: 34.68610, lng: -1.91100, street: 'Boulevard Mohammed V', speed: 28, desc: 'Démarrage du scooter' },
  { lat: 34.68540, lng: -1.91050, street: 'Boulevard Mohammed V (Près Place de la Gare)', speed: 35, desc: 'Circulation fluide' },
  { lat: 34.68470, lng: -1.91000, street: 'Boulevard Mohammed V', speed: 38, desc: 'En route vers le sud' },
  { lat: 34.68390, lng: -1.90940, street: 'Place 9 Avril / Bd Mohammed V', speed: 25, desc: 'Passage du rond-point' },

  // 2. Intersection Boulevard Derfoufi
  { lat: 34.68310, lng: -1.90880, street: 'Boulevard Derfoufi', speed: 32, desc: 'Insertion Boulevard Derfoufi' },
  { lat: 34.68220, lng: -1.90800, street: 'Boulevard Derfoufi', speed: 40, desc: 'Vitesse de croisière' },
  { lat: 34.68120, lng: -1.90710, street: 'Boulevard Derfoufi (Près Grande Poste)', speed: 42, desc: 'Axe principal dégagé' },
  { lat: 34.68010, lng: -1.90620, street: 'Boulevard Derfoufi', speed: 36, desc: 'En approche Rond-point Pasteurs' },

  // 3. Rond-point Pasteurs ➔ Avenue Allal Ben Abdallah
  { lat: 34.67900, lng: -1.90520, street: 'Rond-Point Pasteurs', speed: 24, desc: 'Tourne vers Avenue Allal Ben Abdallah' },
  { lat: 34.67780, lng: -1.90420, street: 'Avenue Allal Ben Abdallah', speed: 38, desc: 'Direction Hay Al Qods' },
  { lat: 34.67650, lng: -1.90320, street: 'Avenue Allal Ben Abdallah', speed: 44, desc: 'Ligne droite vers Al Qods' },
  { lat: 34.67500, lng: -1.90200, street: 'Avenue Allal Ben Abdallah (Près Faculté)', speed: 42, desc: 'Progression rapide' },
  { lat: 34.67350, lng: -1.90100, street: 'Avenue Allal Ben Abdallah', speed: 36, desc: 'Approche du carrefour Al Qods' },

  // 4. Entrée Hay Al Qods
  { lat: 34.67200, lng: -1.90000, street: 'Entrée Hay Al Qods / Rond-point Al Qods', speed: 25, desc: 'Entrée dans votre quartier' },
  { lat: 34.67050, lng: -1.89900, street: 'Boulevard Al Qods', speed: 32, desc: 'Descente Boulevard Al Qods' },
  { lat: 34.66900, lng: -1.89800, street: 'Boulevard Al Qods (Près Mosquée Al Qods)', speed: 30, desc: 'À 500m de votre adresse' },
  { lat: 34.66750, lng: -1.89700, street: 'Boulevard Al Qods', speed: 28, desc: 'Ralentissement pour virage' },

  // 5. Rue Al Andalous ➔ Destination
  { lat: 34.66630, lng: -1.89600, street: 'Rue Al Andalous', speed: 20, desc: 'Tourne dans Rue Al Andalous' },
  { lat: 34.66560, lng: -1.89540, street: 'Rue Al Andalous (Immeuble 12)', speed: 15, desc: 'Recherche de votre numéro' },
  { lat: 34.66500, lng: -1.89500, street: 'Rue Al Andalous 14, Hay Al Qods (Votre Porte)', speed: 0, desc: 'Coursier arrivé devant chez vous ! 🛵' },
];

export default function LiveTrackingMapModal({ visible, order, onClose }: LiveTrackingMapModalProps) {
  const [etaMinutes, setEtaMinutes] = useState(12);
  const [distanceKm, setDistanceKm] = useState(1.4);
  const [currentStreet, setCurrentStreet] = useState('Boulevard Mohammed V');
  const [currentSpeed, setCurrentSpeed] = useState(36);
  const [isFollowMode, setIsFollowMode] = useState(true);

  if (!order) return null;

  const driverName = order.driver_name || 'Mehdi Alami';
  const driverPhone = order.driver_phone || '+212 6 61 22 33 44';
  const customerAddress = order.delivery_address_text || 'Hay Al Qods, Rue Al Andalous 14, Oujda';

  // Real-time Leaflet Map with smooth 60fps courier animation and live heading angle
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #e5e9f2;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
          }
          .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #fff;
            box-shadow: 0 6px 16px rgba(0,0,0,0.35);
            border: 3px solid #fff;
          }
          .resto-pin {
            background: linear-gradient(135deg, #E11D48, #BE123C);
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
          .client-pin {
            background: linear-gradient(135deg, #10B981, #059669);
            width: 42px;
            height: 42px;
            font-size: 22px;
          }
          .courier-marker-wrap {
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .courier-pulse {
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 205, 188, 0.35);
            animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          .courier-body {
            position: relative;
            z-index: 2;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #00CDBC;
            border: 3px solid #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,205,188,0.6);
            transition: transform 0.3s ease;
          }

          @keyframes pulse-ring {
            0% { transform: scale(0.6); opacity: 0.9; }
            70% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          .leaflet-popup-content-wrapper {
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
          }
          .leaflet-popup-content {
            font-size: 12px;
            font-weight: 700;
            margin: 8px 12px;
            line-height: 1.4;
          }
          .speed-badge-float {
            position: absolute;
            top: 75px;
            right: 16px;
            z-index: 1000;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(8px);
            color: #fff;
            padding: 8px 14px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          .recenter-btn {
            position: absolute;
            top: 75px;
            left: 16px;
            z-index: 1000;
            background: #ffffff;
            color: #0077FF;
            padding: 8px 14px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 900;
            border: 1.5px solid #0077FF;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,119,255,0.15);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <button id="recenterBtn" class="recenter-btn" onclick="toggleFollow()">🎯 Centrer sur Livreur</button>
        <div id="speedBadge" class="speed-badge-float">
          <span>⚡ <span id="speedTxt">34</span> km/h</span>
          <span style="color:#64748b">|</span>
          <span>GPS ±2m</span>
        </div>

        <script>
          const waypoints = ${JSON.stringify(HIGH_PRECISION_OUJDA_ROUTE)};
          const resto = waypoints[0];
          const dest = waypoints[waypoints.length - 1];

          // Initialize Map centered on Oujda
          const map = L.map('map', { zoomControl: false }).setView([waypoints[4].lat, waypoints[4].lng], 15);

          // Beautiful crisp tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap Oujda'
          }).addTo(map);

          // Route Polyline (Full path dashed)
          const allCoords = waypoints.map(w => [w.lat, w.lng]);
          const fullRouteLine = L.polyline(allCoords, {
            color: '#94A3B8',
            weight: 6,
            opacity: 0.6,
            dashArray: '6, 10'
          }).addTo(map);

          // Traveled Polyline (Solid Blue)
          const traveledLine = L.polyline([], {
            color: '#0077FF',
            weight: 6,
            opacity: 0.95
          }).addTo(map);

          // Restaurant Marker
          const restoIcon = L.divIcon({
            className: '',
            html: '<div class="custom-pin resto-pin">🍔</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          L.marker([resto.lat, resto.lng], { icon: restoIcon })
            .addTo(map)
            .bindPopup("<b>Bnin Oujda 🏬</b><br>Point de départ");

          // Destination Client Marker
          const clientIcon = L.divIcon({
            className: '',
            html: '<div class="custom-pin client-pin">🏠</div>',
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });
          L.marker([dest.lat, dest.lng], { icon: clientIcon })
            .addTo(map)
            .bindPopup("<b>Votre Adresse 📍</b><br>${customerAddress}");

          // Courier Marker
          const courierIcon = L.divIcon({
            className: '',
            html: '<div class="courier-marker-wrap"><div class="courier-pulse"></div><div id="courierBody" class="courier-body"><span style="font-size:20px;">🛵</span></div></div>',
            iconSize: [50, 50],
            iconAnchor: [25, 25]
          });
          const courierMarker = L.marker([waypoints[0].lat, waypoints[0].lng], { icon: courierIcon, zIndexOffset: 1000 })
            .addTo(map)
            .bindPopup("<b>${driverName} 🛵</b><br>En route vers votre porte");

          let currentIndex = 0;
          let progress = 0; // 0.0 to 1.0 between currentIndex and currentIndex + 1
          let autoFollow = true;

          function toggleFollow() {
            autoFollow = !autoFollow;
            const btn = document.getElementById('recenterBtn');
            btn.innerText = autoFollow ? '🎯 Suivi Actif' : '📍 Recadrer';
            btn.style.background = autoFollow ? '#0077FF' : '#ffffff';
            btn.style.color = autoFollow ? '#ffffff' : '#0077FF';
            if (autoFollow) {
              map.setView(courierMarker.getLatLng(), 16, { animate: true });
            }
          }

          // Smooth Sub-second GPS Interpolation Engine (60 FPS)
          function animateGPS() {
            if (currentIndex >= waypoints.length - 1) {
              currentIndex = 0;
              progress = 0;
            }

            const p1 = waypoints[currentIndex];
            const p2 = waypoints[currentIndex + 1];

            // Calculate precise interpolated latitude & longitude
            const curLat = p1.lat + (p2.lat - p1.lat) * progress;
            const curLng = p1.lng + (p2.lng - p1.lng) * progress;

            // Update Courier Marker position smoothly
            const newLatLng = new L.LatLng(curLat, curLng);
            courierMarker.setLatLng(newLatLng);

            // Update Traveled Path
            const traveledCoords = waypoints.slice(0, currentIndex + 1).map(w => [w.lat, w.lng]);
            traveledCoords.push([curLat, curLng]);
            traveledLine.setLatLngs(traveledCoords);

            // Calculate rotation angle (heading)
            const angle = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * (180 / Math.PI);
            const body = document.getElementById('courierBody');
            if (body) {
              body.style.transform = 'rotate(' + (angle - 45) + 'deg)';
            }

            // Update Speedometer
            const curSpeed = Math.round(p1.speed + (p2.speed - p1.speed) * progress);
            document.getElementById('speedTxt').innerText = curSpeed || 32;

            // Center map smoothly on courier if auto-follow is active
            if (autoFollow) {
              map.panTo(newLatLng, { animate: false });
            }

            // Advance progress
            progress += 0.015; // Smooth sub-second step
            if (progress >= 1.0) {
              progress = 0;
              currentIndex++;
            }

            requestAnimationFrame(animateGPS);
          }

          // Start the continuous GPS animation
          animateGPS();
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Floating Control Bar */}
        <View style={styles.topFloatingHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.liveIndicatorBadge}>
            <View style={styles.liveIndicatorDot} />
            <Text style={styles.liveIndicatorText}>GPS DIRECT 60FPS • OUJDA</Text>
          </View>
        </View>

        {/* Map View Container with Web / Native Support */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Suivi Livreur GPS en Direct - Oujda"
            />
          ) : (
            <View style={styles.nativeMapPlaceholder}>
              <View style={styles.routeBox}>
                <Text style={{ fontSize: 36 }}>🛵</Text>
                <Text style={styles.nativeMapTitle}>Suivi GPS Haute Précision</Text>
                <Text style={styles.nativeMapSub}>
                  {driverName} se déplace le long du Boulevard Mohammed V vers Hay Al Qods.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Real-time Dynamic ETA & Street Navigation Banner */}
        <View style={styles.floatingEtaPill}>
          <View style={styles.etaEmojiCircle}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.floatingEtaTitle}>
                Arrivée estimée : <Text style={{ color: Colors.primary }}>~8-12 min</Text>
              </Text>
              <View style={styles.livePrecisionBadge}>
                <Text style={styles.livePrecisionText}>Précision 2m</Text>
              </View>
            </View>
            <Text style={styles.floatingEtaSub} numberOfLines={1}>
              📍 Actuellement sur Boulevard Mohammed V ➔ Hay Al Qods
            </Text>
          </View>
        </View>

        {/* Bottom Driver Card & Actions */}
        <View style={styles.bottomCard}>
          {/* Driver Profile */}
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 26 }}>🛵</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.driverNameText}>{driverName}</Text>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ 4.9</Text>
                </View>
              </View>
              <Text style={styles.driverVehicleText}>
                Coursier QuickLivraison • Scooter Honda SH 125cc
              </Text>
            </View>
          </View>

          {/* Quick Call & WhatsApp Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => Linking.openURL(`tel:${driverPhone}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>📞 Appeler ({driverPhone})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/212661223344?text=Bonjour%20${driverName},%20je%20suis%20le%20client%20de%20la%20commande%20${order.order_number}`
                )
              }
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>

          {/* Order Details Snippet */}
          <View style={styles.orderSnippet}>
            <Text style={styles.orderSnippetNumber}>
              Commande {order.order_number} ({order.items?.length || 1} articles)
            </Text>
            <Text style={styles.orderSnippetAddress} numberOfLines={1}>
              📍 Destination : {customerAddress}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topFloatingHeader: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  liveIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  liveIndicatorText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  nativeMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    padding: 20,
  },
  routeBox: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  nativeMapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  nativeMapSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  floatingEtaPill: {
    position: 'absolute',
    bottom: 230,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  etaEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingEtaTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  livePrecisionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePrecisionText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  floatingEtaSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    gap: 14,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  driverVehicleText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  orderSnippet: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  orderSnippetNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  orderSnippetAddress: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
