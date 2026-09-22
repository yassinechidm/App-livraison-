import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { locationStore } from "@/services/location.service";
import { orderService } from "@/services/order.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { useLanguage } from "@/src/context/LanguageContext";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface GroceryRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GroceryRequestModal: React.FC<GroceryRequestModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const [groceryList, setGroceryList] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(
    locationStore.getAddress() || "Oujda, Région de l'Oriental",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setGroceryList("");
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    const cleanText = groceryList.trim();
    if (!cleanText || cleanText.length < 3) {
      Alert.alert(
        "Liste vide",
        "Veuillez écrire au moins quelques articles à acheter (ex: pommes de terre, lait, pain...).",
      );
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const session = await authService.getSession();
      const user = session?.user;

      if (!user || !user.id) {
        setIsSubmitting(false);
        Alert.alert(
          "Connexion requise",
          "Vous devez être connecté à votre compte pour commander vos courses en direct.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Se connecter",
              onPress: () => {
                handleClose();
                router.push("/(auth)/login" as any);
              },
            },
          ],
        );
        return;
      }

      const order = await orderService.createOrder(
        {
          items: [
            {
              item_type: "grocery",
              product_name: "Courses & Supermarché",
              unit_price: 0,
              quantity: 1,
              special_instructions: cleanText,
            },
          ],
          delivery_mode: "DELIVERY",
          delivery_address_text: deliveryAddress.trim(),
          payment_method: "CASH",
          notes: `[GROCERY / COURSES]\n${cleanText}`,
        },
        user,
      );

      handleClose();

      Alert.alert(
        "Commande de courses transmise ! 🛒",
        `Votre commande ${order.order_number} a été reçue avec succès.\nUn livreur va effectuer vos achats à Oujda et vous livrer.\nFrais de course : ${order.delivery_fee || 15} DH (articles réglés à la livraison).`,
        [
          {
            text: "Suivre la commande",
            onPress: () => router.push("/(app)/(client)/(tabs)/orders" as any),
          },
          { text: "OK" },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err?.message ||
          "Impossible de transmettre votre demande de courses. Réessayez.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              disabled={isSubmitting}
              accessibilityLabel="Fermer"
            >
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <ShoppingCart
                size={20}
                color={Colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.headerTitle}>Courses & Supermarché</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Intro Banner */}
            <View style={styles.bannerCard}>
              <View style={styles.bannerIconBox}>
                <ShoppingBag size={24} color={Colors.primary} />
              </View>
              <View style={styles.bannerTextCol}>
                <Text style={styles.bannerTitle}>
                  Faites vos courses en direct
                </Text>
                <Text style={styles.bannerSubtitle}>
                  Dites-nous ce que vous souhaitez qu'on achète pour vous dans
                  les épiceries ou supermarchés d'Oujda.
                </Text>
              </View>
            </View>

            {/* Multiline Input Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles
                  size={16}
                  color={Colors.secondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.sectionLabel}>Votre liste de courses</Text>
              </View>
              <Text style={styles.sectionHint}>
                Écrivez précisément vos articles, quantités et préférences de
                marques :
              </Text>

              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Ex : 2 kg pommes de terre, 1 kg tomates fraîches, 2L lait demi-écrémé, 1 pack d'eau Ain Ifrane (6x1.5L), 2 baguettes, 500g blanc de poulet..."
                placeholderTextColor="#90CAF9"
                value={groceryList}
                onChangeText={setGroceryList}
                maxLength={1000}
                editable={!isSubmitting}
              />
              <Text style={styles.charCount}>
                {groceryList.length}/1000 caractères
              </Text>
            </View>

            {/* Delivery Address Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Adresse de livraison</Text>
              <TouchableOpacity
                style={styles.addressRow}
                onPress={() => setIsLocationModalVisible(true)}
                disabled={isSubmitting}
                activeOpacity={0.75}
              >
                <View style={styles.addressIconBox}>
                  <MapPin size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {deliveryAddress}
                  </Text>
                  <Text style={styles.addressSubtext}>
                    Appuyer pour changer l'adresse
                  </Text>
                </View>
                <Text style={styles.addressEditBtn}>Modifier</Text>
              </TouchableOpacity>
            </View>

            {/* Pricing & Transparency Notice */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Clock
                  size={16}
                  color={Colors.secondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.infoText}>
                  Livraison rapide en ~30-45 minutes selon les magasins.
                </Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <CheckCircle2
                  size={16}
                  color={Colors.success}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.infoText}>
                  Frais de service et livraison :{" "}
                  <Text style={styles.bold}>15.00 DH</Text>. Vous réglez le
                  total des tickets de caisse directement au livreur.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Fixed Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!groceryList.trim() || isSubmitting) &&
                  styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!groceryList.trim() || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={styles.submitLoadingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    Envoi de votre demande...
                  </Text>
                </View>
              ) : (
                <View style={styles.submitLoadingRow}>
                  <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>
                    Confirmer la demande de courses
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Location Picker Modal */}
        <LocationPickerModal
          visible={isLocationModalVisible}
          onClose={() => setIsLocationModalVisible(false)}
          selectedAddress={deliveryAddress}
          initialViewMode="map"
          onSelectAddress={(addr) => {
            setDeliveryAddress(addr);
            locationStore.setAddress(addr);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.backgroundWhite,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mutedTint,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bannerCard: {
    flexDirection: "row",
    backgroundColor: Colors.mutedTint,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  bannerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundWhite,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: Colors.backgroundWhite,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.darkText,
    minHeight: 140,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  addressIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.mutedTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  addressSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addressEditBtn: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.cta,
  },
  infoCard: {
    backgroundColor: Colors.backgroundWhite,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "800",
    color: Colors.darkText,
  },
  bottomBar: {
    padding: 16,
    backgroundColor: Colors.backgroundWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  submitBtn: {
    backgroundColor: Colors.cta,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: Colors.darkText,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  submitBtnDisabled: {
    backgroundColor: "#B2EBF2",
    elevation: 0,
  },
  submitLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
