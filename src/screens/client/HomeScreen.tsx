import Colors from "@/constants/Colors";
import { locationStore } from "@/services/location.service";
import { restaurantService } from "@/services/restaurant.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { PharmacyOptionsModal } from "@/src/components/PharmacyOptionsModal";
import { useLanguage } from "@/src/context/LanguageContext";
import { useRouter } from "expo-router";
import {
  Bike,
  Cross,
  MapPin,
  Send,
  ShoppingBag,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PENTAGON_CONTAINER_SIZE = Math.min(SCREEN_WIDTH - 12, 380);
const PENTAGON_RADIUS = PENTAGON_CONTAINER_SIZE * 0.355;
const CX = PENTAGON_CONTAINER_SIZE / 2;
const CY = PENTAGON_CONTAINER_SIZE / 2 - 8;
const BUBBLE_WIDTH = 100;
const BUBBLE_CIRCLE_SIZE = 96;

const PENTAGON_POS = {
  food: {
    x: CX - PENTAGON_RADIUS * 0.5878,
    y: CY - PENTAGON_RADIUS * 0.809,
  },
  groceries: {
    x: CX + PENTAGON_RADIUS * 0.5878,
    y: CY - PENTAGON_RADIUS * 0.809,
  },
  shops: {
    x: CX + PENTAGON_RADIUS * 0.9511,
    y: CY + PENTAGON_RADIUS * 0.309,
  },
  packageDelivery: {
    x: CX,
    y: CY + PENTAGON_RADIUS,
  },
  pharmacy: {
    x: CX - PENTAGON_RADIUS * 0.9511,
    y: CY + PENTAGON_RADIUS * 0.309,
  },
};

interface DraggableBubbleProps {
  x: number;
  y: number;
  index: number;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  width: number;
  circleSize: number;
}

const DraggableBubble: React.FC<DraggableBubbleProps> = ({
  x,
  y,
  index,
  icon,
  label,
  onPress,
  width,
  circleSize,
}) => {
  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  const floatY = React.useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = React.useState(false);
  const floatAnimRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const startFloat = React.useCallback(() => {
    floatAnimRef.current?.stop();
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -5,
          duration: 1700 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 4,
          duration: 1700 + index * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatAnimRef.current = anim;
    anim.start();
  }, [index, floatY]);

  React.useEffect(() => {
    const delay = setTimeout(startFloat, index * 220);
    return () => {
      clearTimeout(delay);
      floatAnimRef.current?.stop();
    };
  }, [index, startFloat]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
        onPanResponderGrant: () => {
          setIsDragging(true);
          floatAnimRef.current?.stop();
          pan.setOffset({
            x: (pan.x as any)._value || 0,
            y: (pan.y as any)._value || 0,
          });
          pan.setValue({ x: 0, y: 0 });

          Animated.spring(scale, {
            toValue: 1.16,
            bounciness: 6,
            speed: 14,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          pan.flattenOffset();
          setIsDragging(false);

          const dist = Math.hypot(g.dx, g.dy);
          if (dist < 8) {
            // Tap feedback & trigger action
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 0.9,
                duration: 75,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1,
                bounciness: 8,
                speed: 16,
                useNativeDriver: true,
              }),
            ]).start(() => {
              startFloat();
            });
            onPress();
          } else {
            // Spring back automatically to home place with playful bouncy recoil
            Animated.parallel([
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                bounciness: 14,
                speed: 12,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1,
                bounciness: 8,
                speed: 14,
                useNativeDriver: true,
              }),
            ]).start(() => {
              startFloat();
            });
          }
        },
        onPanResponderTerminate: () => {
          pan.flattenOffset();
          setIsDragging(false);
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              bounciness: 12,
              speed: 12,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              bounciness: 8,
              speed: 14,
              useNativeDriver: true,
            }),
          ]).start(() => {
            startFloat();
          });
        },
      }),
    [onPress, startFloat, pan, scale],
  );

  const rotateInterpolation = pan.x.interpolate({
    inputRange: [-140, 0, 140],
    outputRange: ["-18deg", "0deg", "18deg"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.bubbleCol,
        {
          position: "absolute",
          left: x - width / 2,
          top: y - circleSize / 2,
          zIndex: isDragging ? 999 : 1,
          elevation: isDragging ? 16 : 4,
          transform: [
            { translateX: pan.x },
            { translateY: Animated.add(pan.y, floatY) },
            { scale },
            { rotate: rotateInterpolation },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.bubbleOuterCircle,
          isDragging && styles.bubbleOuterCircleActive,
        ]}
      >
        <View style={styles.bubbleCircle}>{icon}</View>
      </View>
      <View style={styles.bubbleBadge}>
        <Text
          style={styles.bubbleBadgeText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  // Address and modal states
  const [selectedAddress, setSelectedAddress] = useState(
    locationStore.getAddress() || "Rue Ziri Ibn Atia, 35",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [openStoresCount, setOpenStoresCount] = useState(4);

  // Pharmacy modal
  const [isPharmacyModalVisible, setIsPharmacyModalVisible] = useState(false);

  // Package Delivery modal
  const [isPackageModalVisible, setIsPackageModalVisible] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(
    locationStore.getAddress() || "Rue Ziri Ibn Atia, 35",
  );
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [packageSize, setPackageSize] = useState<"small" | "medium" | "large">(
    "small",
  );
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);

  useEffect(() => {
    restaurantService.getRestaurants().then((restos) => {
      if (restos && restos.length > 0) {
        setOpenStoresCount(restos.length);
      }
    });

    const unsubLoc = locationStore.subscribe((addr) => {
      setSelectedAddress(addr);
      setPickupAddress(addr);
    });

    return () => unsubLoc();
  }, []);

  const handleOrderPackageDelivery = async () => {
    if (!dropoffAddress.trim()) {
      Alert.alert(
        "Adresse manquante",
        "Veuillez saisir l'adresse de destination du colis.",
      );
      return;
    }
    if (!packageDescription.trim()) {
      Alert.alert(
        "Détails du colis",
        "Veuillez décrire brièvement ce qu'il faut livrer (ex. clés, documents, courses).",
      );
      return;
    }

    setIsSubmittingPackage(true);
    setTimeout(() => {
      setIsSubmittingPackage(false);
      setIsPackageModalVisible(false);
      Alert.alert(
        "Coursier en route !",
        `Votre demande de livraison coursier a été transmise.\nUn coursier arrive à "${pickupAddress}" dans ~10 minutes.\nTarif estimé : 15 DH`,
        [
          {
            text: "Suivre la course",
            onPress: () => router.push("/(app)/(client)/(tabs)/orders" as any),
          },
          { text: "OK" },
        ],
      );
      setDropoffAddress("");
      setPackageDescription("");
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* ── Full Brand Background Canvas ── */}
      <View style={styles.yellowCanvas}>
        {/* Subtle Concentric Rings Backdrop */}
        <View style={styles.organicWaveBackdrop} />
        <View style={styles.organicWaveBackdropInner} />

        <SafeAreaView style={styles.safeArea}>
          {/* ── Top Header: Address Pill + Friendly Greeting ── */}
          <View style={styles.topHeader}>
            <TouchableOpacity
              style={styles.addressPill}
              onPress={() => setIsLocationModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addressPillText} numberOfLines={1}>
                {selectedAddress}
              </Text>
              <Text style={styles.addressPillChevron}>▾</Text>
            </TouchableOpacity>

            <Text style={styles.greetingTitle}>
              {t("home.greetingTitle", "Qu'est-ce qui vous ferait plaisir ?")}
            </Text>
          </View>

          {/* ── Pentagon Drag-Physics Category Bubbles (Image 2) ── */}
          <View style={styles.bubblesContainer}>
            <View
              style={{
                width: PENTAGON_CONTAINER_SIZE,
                height: PENTAGON_CONTAINER_SIZE,
                position: "relative",
              }}
            >
              {/* Bubble 1: Food (Top-Left) */}
              <DraggableBubble
                index={0}
                x={PENTAGON_POS.food.x}
                y={PENTAGON_POS.food.y}
                width={BUBBLE_WIDTH}
                circleSize={BUBBLE_CIRCLE_SIZE}
                label={t("home.food", "Food")}
                onPress={() =>
                  router.push("/(app)/(client)/(tabs)/catalog" as any)
                }
                icon={
                  <UtensilsCrossed
                    size={38}
                    color="#D97706"
                    strokeWidth={2.2}
                  />
                }
              />

              {/* Bubble 2: Groceries (Top-Right) */}
              <DraggableBubble
                index={1}
                x={PENTAGON_POS.groceries.x}
                y={PENTAGON_POS.groceries.y}
                width={BUBBLE_WIDTH}
                circleSize={BUBBLE_CIRCLE_SIZE}
                label={t("home.groceries", "Groceries")}
                onPress={() =>
                  router.push("/(app)/(client)/(tabs)/catalog" as any)
                }
                icon={
                  <ShoppingCart size={38} color="#16A34A" strokeWidth={2.2} />
                }
              />

              {/* Bubble 3: Pharmacy (Middle-Left) */}
              <DraggableBubble
                index={2}
                x={PENTAGON_POS.pharmacy.x}
                y={PENTAGON_POS.pharmacy.y}
                width={BUBBLE_WIDTH}
                circleSize={BUBBLE_CIRCLE_SIZE}
                label={t("home.pharmacy", "Pharmacy")}
                onPress={() => setIsPharmacyModalVisible(true)}
                icon={<Cross size={34} color="#059669" strokeWidth={2.5} />}
              />

              {/* Bubble 4: Shops (Middle-Right) */}
              <DraggableBubble
                index={3}
                x={PENTAGON_POS.shops.x}
                y={PENTAGON_POS.shops.y}
                width={BUBBLE_WIDTH}
                circleSize={BUBBLE_CIRCLE_SIZE}
                label={t("home.shops", "Shops")}
                onPress={() =>
                  router.push("/(app)/(client)/(tabs)/catalog" as any)
                }
                icon={
                  <ShoppingBag size={38} color="#0284C7" strokeWidth={2.2} />
                }
              />

              {/* Bubble 5: Package Delivery (Bottom-Center) */}
              <DraggableBubble
                index={4}
                x={PENTAGON_POS.packageDelivery.x}
                y={PENTAGON_POS.packageDelivery.y}
                width={BUBBLE_WIDTH}
                circleSize={BUBBLE_CIRCLE_SIZE}
                label={t("home.packageDelivery", "Package Delivery")}
                onPress={() => setIsPackageModalVisible(true)}
                icon={<Bike size={38} color="#F59E0B" strokeWidth={2.2} />}
              />
            </View>
          </View>

          {/* ── Bottom Store Status Card (Image 2) ── */}
          <View style={styles.bottomStatusCardWrapper}>
            <View
              style={[
                styles.storeStatusCard,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View style={styles.storeStatusIconBox}>
                <Store size={30} color="#78716C" strokeWidth={1.8} />
              </View>
              <View
                style={[
                  styles.storeStatusTextCol,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text
                  style={[
                    styles.storeStatusTitle,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {openStoresCount > 0
                    ? `${openStoresCount} ${t("home.storesOpenCount", "stores open right now.")}`
                    : t(
                        "home.noStoresOpen",
                        "There aren't any stores open right now.",
                      )}
                </Text>
                <Text
                  style={[
                    styles.storeStatusSubtitle,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {openStoresCount > 0
                    ? t(
                        "home.orderNowEstimate",
                        "Order now and get delivered in ~25 min",
                      )
                    : t(
                        "home.openingAgain",
                        "They will start opening again at 07:00",
                      )}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Location Picker Modal ── */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        selectedAddress={selectedAddress}
        initialViewMode="map"
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          locationStore.setAddress(addr);
        }}
      />

      {/* ── Pharmacy Options Modal ── */}
      <PharmacyOptionsModal
        visible={isPharmacyModalVisible}
        onClose={() => setIsPharmacyModalVisible(false)}
      />

      {/* ── Package Delivery Modal (Coursier Express) ── */}
      <Modal
        visible={isPackageModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPackageModalVisible(false)}
      >
        <SafeAreaView style={styles.packageModalContainer}>
          <View style={styles.packageModalHeader}>
            <TouchableOpacity
              style={styles.closeBtnCircle}
              onPress={() => setIsPackageModalVisible(false)}
            >
              <X size={20} color="#3C3489" />
            </TouchableOpacity>
            <Text style={styles.packageModalHeaderTitle}>Package Delivery</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.packageModalBody}>
            <View style={styles.packageBannerBox}>
              <Bike size={32} color="#F59E0B" />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.packageBannerTitle}>
                  Livraison par coursier express
                </Text>
                <Text style={styles.packageBannerSub}>
                  Un coursier vient récupérer votre colis et le livre à
                  l'adresse de votre choix à Oujda.
                </Text>
              </View>
            </View>

            <Text style={styles.packageFormLabel}>ADRESSE DE RAMASSAGE</Text>
            <View style={styles.packageInputRow}>
              <MapPin
                size={18}
                color={Colors.primary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.packageInput}
                value={pickupAddress}
                onChangeText={setPickupAddress}
                placeholder="Ex. Rue Ziri Ibn Atia, 35"
              />
            </View>

            <Text style={styles.packageFormLabel}>ADRESSE DE DESTINATION</Text>
            <View style={styles.packageInputRow}>
              <Send size={18} color="#E65100" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.packageInput}
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
                placeholder="Ex. Boulevard Derfoufi, n° 14"
              />
            </View>

            <Text style={styles.packageFormLabel}>CONTENU DU COLIS</Text>
            <View style={styles.packageInputRowArea}>
              <TextInput
                style={styles.packageInputArea}
                value={packageDescription}
                onChangeText={setPackageDescription}
                placeholder="Décrivez ce qu'il faut livrer (clés, médicaments, documents...)"
                multiline
                numberOfLines={3}
              />
            </View>

            <Text style={styles.packageFormLabel}>TAILLE DU COLIS</Text>
            <View style={styles.sizeOptionsRow}>
              <TouchableOpacity
                style={[
                  styles.sizePill,
                  packageSize === "small" && styles.sizePillActive,
                ]}
                onPress={() => setPackageSize("small")}
              >
                <Text
                  style={[
                    styles.sizePillText,
                    packageSize === "small" && styles.sizePillTextActive,
                  ]}
                >
                  Petit ({"<"} 2kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sizePill,
                  packageSize === "medium" && styles.sizePillActive,
                ]}
                onPress={() => setPackageSize("medium")}
              >
                <Text
                  style={[
                    styles.sizePillText,
                    packageSize === "medium" && styles.sizePillTextActive,
                  ]}
                >
                  Moyen (2 - 5kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sizePill,
                  packageSize === "large" && styles.sizePillActive,
                ]}
                onPress={() => setPackageSize("large")}
              >
                <Text
                  style={[
                    styles.sizePillText,
                    packageSize === "large" && styles.sizePillTextActive,
                  ]}
                >
                  Grand (5 - 10kg)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceSummaryCard}>
              <View>
                <Text style={styles.priceSummaryLabel}>Tarif fixe Oujda :</Text>
                <Text style={styles.priceSummarySub}>
                  Livreur garanti en 20-30 min
                </Text>
              </View>
              <Text style={styles.priceSummaryValue}>15.00 DH</Text>
            </View>

            <TouchableOpacity
              style={styles.submitCourierBtn}
              onPress={handleOrderPackageDelivery}
              disabled={isSubmittingPackage}
              activeOpacity={0.85}
            >
              {isSubmittingPackage ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitCourierBtnText}>
                  Commander un coursier (15 DH)
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  yellowCanvas: {
    flex: 1,
    backgroundColor: Colors.primary,
    position: "relative",
  },
  organicWaveBackdrop: {
    position: "absolute",
    alignSelf: "center",
    top: "22%",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  organicWaveBackdropInner: {
    position: "absolute",
    alignSelf: "center",
    top: "27%",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 36 : 20,
  },

  // Top Header: Address Pill + Greeting
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 10 : 6,
    alignItems: "center",
  },
  addressPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  addressPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
    maxWidth: SCREEN_WIDTH * 0.62,
  },
  addressPillChevron: {
    fontSize: 14,
    color: "#7F77DD",
    marginLeft: 6,
    fontWeight: "700",
  },
  greetingBox: {
    marginTop: 14,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Category Bubbles (Pentagon Arrangement)
  bubblesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  pentagonWrapper: {
    width: PENTAGON_CONTAINER_SIZE,
    height: PENTAGON_CONTAINER_SIZE + 36,
    position: "relative",
  },
  bubbleCol: {
    alignItems: "center",
    width: BUBBLE_WIDTH,
  },
  bubbleOuterCircle: {
    width: BUBBLE_CIRCLE_SIZE,
    height: BUBBLE_CIRCLE_SIZE,
    borderRadius: BUBBLE_CIRCLE_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  bubbleOuterCircleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  bubbleCircle: {
    width: BUBBLE_CIRCLE_SIZE - 10,
    height: BUBBLE_CIRCLE_SIZE - 10,
    borderRadius: (BUBBLE_CIRCLE_SIZE - 10) / 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 3.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  bubbleBadge: {
    backgroundColor: "#FFFFFF",
    width: BUBBLE_WIDTH,
    height: 28,
    borderRadius: 14,
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C3489",
    textAlign: "center",
  },

  // Bottom Status Card (Image 2)
  bottomStatusCardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 100 : 90,
  },
  storeStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CECBF6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeStatusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  storeStatusTextCol: {
    flex: 1,
  },
  storeStatusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
  },
  storeStatusSubtitle: {
    fontSize: 12,
    color: "#7F77DD",
    marginTop: 2,
  },

  // Package modal styles
  packageModalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  packageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  closeBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  packageModalHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3C3489",
  },
  packageModalBody: {
    padding: 16,
  },
  packageBannerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
    marginBottom: 20,
  },
  packageBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  packageBannerSub: {
    fontSize: 12,
    color: "#B45309",
    marginTop: 2,
  },
  packageFormLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.5,
  },
  packageInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 48,
  },
  packageInput: {
    flex: 1,
    fontSize: 14,
    color: "#3C3489",
  },
  packageInputRowArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  packageInputArea: {
    fontSize: 14,
    color: "#3C3489",
    textAlignVertical: "top",
    minHeight: 64,
  },
  sizeOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  sizePillActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EBEBFC",
  },
  sizePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  sizePillTextActive: {
    color: "#3C3489",
    fontWeight: "800",
  },
  priceSummaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  priceSummaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
  },
  priceSummarySub: {
    fontSize: 12,
    color: "#7F77DD",
  },
  priceSummaryValue: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.cta,
  },
  submitCourierBtn: {
    backgroundColor: Colors.cta,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 40,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitCourierBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
