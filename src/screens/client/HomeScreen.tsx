import { useLanguage } from "@/src/context/LanguageContext";
import Colors from "@/constants/Colors";
import { restaurantService } from "@/services/restaurant.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { useRouter } from "expo-router";
import {
    Bike,
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
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function GreenCrescentIcon({ size = 42 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#10B981"
      stroke="#059669"
      strokeWidth={0.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: [{ rotate: "-15deg" }] }}
    >
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();


  // Address and modal states
  const [selectedAddress, setSelectedAddress] = useState(
    "Rue Ziri Ibn Atia, 35",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [openStoresCount, setOpenStoresCount] = useState(4);

  // Package Delivery modal
  const [isPackageModalVisible, setIsPackageModalVisible] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("Rue Ziri Ibn Atia, 35");
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
        "Coursier en route ! 🛵",
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
      {/* ── Full Yellow Background Canvas ── */}
      <View style={styles.yellowCanvas}>
        {/* Subtle Organic Wave Decor */}
        <View style={styles.organicWaveBackdrop} />

        <SafeAreaView style={styles.safeArea}>
          {/* ── 5 Glovo Category Bubbles ── */}
          <View style={styles.bubblesContainer}>
            {/* Row 1: Food & Groceries */}
            <View style={styles.bubblesRow}>
              {/* Bubble 1: Food */}
              <View style={styles.bubbleCol}>
                <TouchableOpacity
                  style={styles.bubbleOuterCircle}
                  onPress={() =>
                    router.push("/(app)/(client)/(tabs)/catalog" as any)
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.bubbleCircle}>
                    <UtensilsCrossed
                      size={40}
                      color="#D97706"
                      strokeWidth={2.2}
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.bubbleBadge}>
                  <Text style={styles.bubbleBadgeText}>{t("home.food", "Food")}</Text>
                </View>
              </View>

              {/* Bubble 2: Groceries */}
              <View style={styles.bubbleCol}>
                <TouchableOpacity
                  style={styles.bubbleOuterCircle}
                  onPress={() =>
                    router.push("/(app)/(client)/(tabs)/catalog" as any)
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.bubbleCircle}>
                    <ShoppingCart size={40} color="#16A34A" strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
                <View style={styles.bubbleBadge}>
                  <Text style={styles.bubbleBadgeText}>{t("home.groceries", "Groceries")}</Text>
                </View>
              </View>
            </View>

            {/* Row 2: Pharmacy & Shops */}
            <View style={[styles.bubblesRow, { marginTop: 24 }]}>
              {/* Bubble 3: Pharmacy (NEW option requested) */}
              <View style={styles.bubbleCol}>
                <TouchableOpacity
                  style={styles.bubbleOuterCircle}
                  onPress={() =>
                    router.push("/(app)/(client)/(tabs)/catalog" as any)
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.bubbleCircle}>
                    <GreenCrescentIcon size={42} />
                  </View>
                </TouchableOpacity>
                <View style={styles.bubbleBadge}>
                  <Text style={styles.bubbleBadgeText}>{t("home.pharmacy", "Pharmacy")}</Text>
                </View>
              </View>

              {/* Bubble 4: Shops */}
              <View style={styles.bubbleCol}>
                <TouchableOpacity
                  style={styles.bubbleOuterCircle}
                  onPress={() =>
                    router.push("/(app)/(client)/(tabs)/catalog" as any)
                  }
                  activeOpacity={0.82}
                >
                  <View style={styles.bubbleCircle}>
                    <ShoppingBag size={40} color="#0284C7" strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
                <View style={styles.bubbleBadge}>
                  <Text style={styles.bubbleBadgeText}>{t("home.shops", "Shops")}</Text>
                </View>
              </View>
            </View>

            {/* Row 3: Package Delivery (Centered) */}
            <View
              style={[
                styles.bubblesRow,
                { marginTop: 24, justifyContent: "center" },
              ]}
            >
              <View style={styles.bubbleCol}>
                <TouchableOpacity
                  style={styles.bubbleOuterCircle}
                  onPress={() => setIsPackageModalVisible(true)}
                  activeOpacity={0.82}
                >
                  <View style={styles.bubbleCircle}>
                    <Bike size={42} color="#F59E0B" strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
                <View style={styles.bubbleBadge}>
                  <Text style={styles.bubbleBadgeText}>{t("home.packageDelivery", "Package Delivery")}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Bottom Store Status Card (Image 2) ── */}
          <View style={styles.bottomStatusCardWrapper}>
            <View style={styles.storeStatusCard}>
              <View style={styles.storeStatusIconBox}>
                <Store size={30} color="#78716C" strokeWidth={1.8} />
              </View>
              <View style={styles.storeStatusTextCol}>
                <Text style={styles.storeStatusTitle}>
                  {openStoresCount > 0
                    ? `${openStoresCount} stores open right now.`
                    : "There aren't any stores open right now."}
                </Text>
                <Text style={styles.storeStatusSubtitle}>
                  {openStoresCount > 0
                    ? "Order now and get delivered in ~25 min"
                    : "They will start opening again at 07:00"}
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
        onSelectAddress={(addr) => setSelectedAddress(addr)}
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
    top: 60,
    right: -40,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 36 : 20,
  },

  // Address Pill (Image 2)
  topAddressWrapper: {
    alignItems: "center",
    paddingTop: 8,
  },
  addressPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    maxWidth: SCREEN_WIDTH * 0.85,
  },
  addressPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C3489",
    maxWidth: SCREEN_WIDTH * 0.6,
  },

  // Category Bubbles (Image 2)
  bubblesContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    marginVertical: 10,
  },
  bubblesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  bubbleCol: {
    alignItems: "center",
  },
  bubbleOuterCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  bubbleCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C3489",
  },

  // Bottom Status Card (Image 2)
  bottomStatusCardWrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 95 : 85,
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
