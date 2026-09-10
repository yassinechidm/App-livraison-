import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { authService } from "@/services/auth.service";
import { locationStore } from "@/services/location.service";
import { orderService } from "@/services/order.service";
import { useLanguage } from "@/src/context/LanguageContext";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Camera,
    CheckCircle2,
    Image as ImageIcon,
    MapPin,
    PhoneCall,
    Pill,
    Trash2,
    Upload,
    X
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export const COMPANY_PHARMACY_PHONE = "+212 5 36 60 00 00";
export const COMPANY_PHARMACY_PHONE_DISPLAY = "+212 5 36 60 00 00";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PharmacyOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PharmacyOptionsModal: React.FC<PharmacyOptionsModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    setSelectedImage(null);
    setInstructions("");
    setIsSubmitting(false);
    onClose();
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("pharmacy.permissionTitle", "Permission requise"),
          t(
            "pharmacy.cameraPermissionMsg",
            "Veuillez autoriser l'accès à l'appareil photo pour photographier votre ordonnance.",
          ),
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(imageUri);
      }
    } catch (err) {
      console.warn("[PharmacyOptionsModal] Camera error:", err);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "pharmacy.cameraError",
          "Impossible d'ouvrir l'appareil photo. Réessayez.",
        ),
      );
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("pharmacy.permissionTitle", "Permission requise"),
          t(
            "pharmacy.galleryPermissionMsg",
            "Veuillez autoriser l'accès à vos photos pour sélectionner une ordonnance.",
          ),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.75,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setSelectedImage(imageUri);
      }
    } catch (err) {
      console.warn("[PharmacyOptionsModal] Gallery picker error:", err);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "pharmacy.galleryError",
          "Impossible de charger la photo depuis la galerie.",
        ),
      );
    }
  };

  const handleDirectCall = () => {
    const cleanNumber = COMPANY_PHARMACY_PHONE.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert(
        t("pharmacy.callErrorTitle", "Appel téléphonique"),
        `${t("pharmacy.callErrorMsg", "Numéro de notre pharmacie :")} ${COMPANY_PHARMACY_PHONE_DISPLAY}`,
      );
    });
  };

  const handleSubmitPrescription = async () => {
    if (!selectedImage) {
      Alert.alert(
        t("pharmacy.missingPhotoTitle", "Photo manquante"),
        t(
          "pharmacy.missingPhotoMsg",
          "Veuillez ajouter une photo de votre ordonnance avant d'envoyer.",
        ),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await authService.getSession();
      const user = session?.user || {
        id: "guest",
        name: "Client Pharmacie",
        phone: "+212 6 XX XX XX XX",
      };

      const address =
        locationStore.getAddress() || "Oujda, Région de l'Oriental";

      const noteText = instructions.trim()
        ? instructions.trim()
        : "Photo d'ordonnance médicale transmise par le client.";

      // 1. Upload to Supabase Storage private prescriptions bucket
      const fileExt = "jpg";
      const filePath = `${user.id || "guest"}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      let storagePath: string | undefined = undefined;

      try {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(filePath, blob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (!uploadError) {
          storagePath = filePath;
        } else {
          console.warn(
            "[PharmacyOptionsModal] Storage upload warning:",
            uploadError,
          );
        }
      } catch (uploadErr) {
        console.warn(
          "[PharmacyOptionsModal] Storage upload exception:",
          uploadErr,
        );
      }

      // 2. Create authoritative order via RPC
      await orderService.createOrder(
        {
          items: [
            {
              item_type: "prescription",
              product_id: "33333333-3333-3333-3333-333333333333",
              product_name: t(
                "pharmacy.orderItemTitle",
                "Médicaments sur Ordonnance",
              ),
              unit_price: 0,
              quantity: 1,
              special_instructions: noteText,
            },
          ],
          delivery_mode: "DELIVERY",
          delivery_address_text: address,
          payment_method: "CASH",
          notes: noteText,
          prescription_storage_path: storagePath,
          prescription_image_url: selectedImage,
        },
        user,
      );

      handleClose();

      Alert.alert(
        t("pharmacy.successTitle", "Ordonnance envoyée !"),
        t(
          "pharmacy.successMessage",
          "Votre ordonnance a été transmise avec succès à notre pharmacie partenaire à Oujda. L'administrateur et le coursier préparent votre livraison.",
        ),
        [
          {
            text: t("orders.trackYourOrders", "Suivre ma commande"),
            onPress: () => router.push("/(app)/(client)/(tabs)/orders" as any),
          },
          { text: t("common.ok", "OK") },
        ],
      );
    } catch (err) {
      console.error("[PharmacyOptionsModal] Order submit error:", err);
      Alert.alert(
        t("common.error", "Erreur"),
        t(
          "pharmacy.submitError",
          "Impossible d'envoyer votre ordonnance. Veuillez réessayer ou nous contacter par téléphone.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardWrap}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.headerLeft,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.pillIconBadge}>
                  <Pill size={22} color="#059669" />
                </View>
                <View style={styles.headerTextCol}>
                  <Text
                    style={[
                      styles.headerTitle,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {t("pharmacy.modalTitle", "Service Pharmacie")}
                  </Text>
                  <Text
                    style={[
                      styles.headerSubtitle,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {t(
                      "pharmacy.modalSubtitle",
                      "Commandez vos médicaments en toute simplicité",
                    )}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#7F77DD" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollBody}
            >
              {/* Option 1: Prescription Upload */}
              <View style={styles.optionBox}>
                <View
                  style={[
                    styles.optionHeaderRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <View style={styles.iconCircleEmerald}>
                    <Upload size={18} color="#059669" />
                  </View>
                  <View style={styles.optionTitleCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {t(
                        "pharmacy.option1Title",
                        "1. Télécharger une ordonnance",
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {t(
                        "pharmacy.option1Desc",
                        "Prenez en photo votre ordonnance médicale pour une préparation express.",
                      )}
                    </Text>
                  </View>
                </View>

                {/* Photo Selection / Preview Area */}
                {!selectedImage ? (
                  <View style={styles.buttonActionRow}>
                    <TouchableOpacity
                      style={styles.photoChoiceBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.85}
                    >
                      <Camera
                        size={16}
                        color="#059669"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.photoChoiceText} numberOfLines={1}>
                        {t("pharmacy.takePhoto", "Prendre photo")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.photoChoiceBtn}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.85}
                    >
                      <ImageIcon
                        size={16}
                        color="#059669"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.photoChoiceText} numberOfLines={1}>
                        {t("pharmacy.fromGallery", "Galerie photos")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.previewContainer}>
                    <View style={styles.previewImageWrap}>
                      <Image
                        source={{ uri: selectedImage }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                      <View style={styles.previewBadge}>
                        <CheckCircle2
                          size={13}
                          color="#FFFFFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.previewBadgeText}>
                          {t("pharmacy.photoAdded", "Ordonnance prête")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewActionsRow}>
                      <TouchableOpacity
                        style={styles.changePhotoBtn}
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                      >
                        <Camera
                          size={13}
                          color="#3C3489"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.changePhotoText}>
                          {t("pharmacy.changePhoto", "Changer")}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deletePhotoBtn}
                        onPress={() => setSelectedImage(null)}
                        activeOpacity={0.8}
                      >
                        <Trash2
                          size={13}
                          color="#EF4444"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.deletePhotoText}>
                          {t("pharmacy.deletePhoto", "Supprimer")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Optional Instructions */}
                    <View style={styles.instructionsBox}>
                      <TextInput
                        style={[
                          styles.instructionsInput,
                          isRTL && { textAlign: "right" },
                        ]}
                        placeholder={t(
                          "pharmacy.instructionsPlaceholder",
                          "Instructions pour le pharmacien (urgences, posologie, allergies...)",
                        )}
                        placeholderTextColor="#A5B4FC"
                        value={instructions}
                        onChangeText={setInstructions}
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    {/* Delivery Address Reminder */}
                    <View
                      style={[
                        styles.addressReminderRow,
                        isRTL && { flexDirection: "row-reverse" },
                      ]}
                    >
                      <MapPin size={13} color="#5C5BDB" />
                      <Text
                        style={styles.addressReminderText}
                        numberOfLines={1}
                      >
                        {locationStore.getAddress() ||
                          "Oujda, Région de l'Oriental"}
                      </Text>
                    </View>

                    {/* Submit Prescription CTA Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitPrescriptionBtn,
                        isSubmitting && { opacity: 0.7 },
                      ]}
                      onPress={handleSubmitPrescription}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitPrescriptionText}>
                          {t("pharmacy.sendOrderBtn", "Confirmer et commander")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Symmetrical Divider with OR */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t("common.or", "OU")}</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Option 2: Direct Company Call */}
              <View style={styles.optionBox}>
                <View
                  style={[
                    styles.optionHeaderRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <View style={styles.iconCircleBlue}>
                    <PhoneCall size={18} color="#2563EB" />
                  </View>
                  <View style={styles.optionTitleCol}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {t(
                        "pharmacy.option2Title",
                        "2. Appeler le service pharmacie",
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        isRTL && { textAlign: "right" },
                      ]}
                    >
                      {t(
                        "pharmacy.option2Desc",
                        "Passez commande directement par téléphone avec nos conseillers à Oujda.",
                      )}
                    </Text>
                  </View>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                  style={styles.callActionButton}
                  onPress={handleDirectCall}
                  activeOpacity={0.85}
                >
                  <PhoneCall
                    size={17}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.callActionButtonText}>
                    {t("pharmacy.callBtn", "Appeler")}{" "}
                    {COMPANY_PHARMACY_PHONE_DISPLAY}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelFooterBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelFooterText}>
                  {t("common.cancel", "Annuler")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(60, 52, 137, 0.48)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdropTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardWrap: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#CECBF6",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pillIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#3C3489",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F77DD",
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  scrollBody: {
    paddingBottom: 4,
  },
  optionBox: {
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 18,
    padding: 14,
  },
  optionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  iconCircleEmerald: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  iconCircleBlue: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  optionTitleCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 11,
    color: "#7F77DD",
    lineHeight: 16,
  },
  buttonActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  photoChoiceBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  photoChoiceText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#059669",
  },
  previewContainer: {
    marginTop: 2,
  },
  previewImageWrap: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CECBF6",
    backgroundColor: "#000000",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 150, 105, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  previewActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3C3489",
  },
  deletePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deletePhotoText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  instructionsBox: {
    marginBottom: 8,
  },
  instructionsInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: "#3C3489",
    minHeight: 48,
    textAlignVertical: "top",
  },
  addressReminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  addressReminderText: {
    fontSize: 11,
    color: "#7F77DD",
    fontWeight: "600",
    flex: 1,
  },
  submitPrescriptionBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cta,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  submitPrescriptionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  callActionButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  callActionButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  cancelFooterBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelFooterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7F77DD",
  },
});
