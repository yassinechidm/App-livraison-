import Card from "@/components/ui/Card";
import Colors from "@/constants/Colors";
import { addressService } from "@/services/address.service";
import { authService } from "@/services/auth.service";
import { cartService } from "@/services/cart.service";
import { locationStore } from "@/services/location.service";
import { orderService } from "@/services/order.service";
import { LocationPickerModal } from "@/src/components";
import { useLanguage } from "@/src/context/LanguageContext";
import { CartState } from "@/types/cart.types";
import { Address, PaymentMethodType } from "@/types/order.types";
import { BANK_DETAILS } from "@/types/payment.types";
import { useRouter } from "expo-router";
import {
    Banknote,
    ChevronRight,
    CreditCard,
    MapPin,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function CheckoutScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [cartState, setCartState] = useState<CartState>(cartService.getState());
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [customAddress, setCustomAddress] = useState(
    locationStore.getAddress() || "",
  );
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeCart = cartService.subscribe((state) => {
      setCartState(state);
    });

    const unsubscribeLoc = locationStore.subscribe((addr) => {
      setCustomAddress(addr);
    });

    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    addressService.getAddresses().then((addrs) => {
      setAddresses(addrs);
      const defaultAddr = addrs.find((a) => a.is_default) || addrs[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    });

    // Check loyalty: 5+ past orders = free delivery
    const pastCount = orderService.getPastOrderCount();
    cartService.setLoyaltyFreeDelivery(pastCount >= 5);

    return () => {
      unsubscribeCart();
      unsubscribeLoc();
    };
  }, []);

  async function handleConfirmOrder() {
    if (cartState.items.length === 0) {
      Alert.alert("Erreur", "Votre panier est vide.");
      return;
    }

    let finalAddressText = customAddress.trim();
    if (selectedAddressId) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        finalAddressText = `${addr.city} — ${addr.address}`;
      }
    }

    if (!finalAddressText) {
      Alert.alert(
        "Adresse requise",
        "Veuillez sélectionner ou saisir une adresse de livraison à Oujda.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder(
        {
          address_id: selectedAddressId || undefined,
          delivery_address_text: finalAddressText,
          delivery_mode: cartState.deliveryMode,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
          items: cartState.items.map((item) => {
            const customText = (item.selected_customizations || [])
              .map(
                (c) =>
                  `${c.optionName}${c.price > 0 ? ` (+${c.price} DH)` : ""}`,
              )
              .join(" • ");
            const unitPrice = item.unit_total_price ?? item.product.price;

            return {
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: unitPrice,
              selected_customizations: item.selected_customizations,
              selected_customizations_text: customText || undefined,
              special_instructions: item.special_instructions,
            };
          }),
        },
        {
          id: user?.id || "client-id",
          email: user?.email || "client@quicklivraison.ma",
          name: user?.email?.split("@")[0] || "Client Oujda",
        },
      );

      // Redirect immediately to orders tracking page
      router.replace("/(app)/(client)/(tabs)/orders" as any);

      // Show non-blocking confirmation (will appear on the orders page)
      setTimeout(() => {
        Alert.alert(
          "Commande Confirmée !",
          `Votre commande ${order.order_number} a été transmise avec succès.\nSuivez son statut en temps réel ci-dessous.`,
        );
      }, 500);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Une erreur est survenue";
      Alert.alert("Erreur", msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>{isRTL ? "→" : "←"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("checkout.title", "Finaliser la Commande")}
          </Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        {/* 1. Delivery Address Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
            1. {t("checkout.address", "Adresse de livraison (Oujda)")}
          </Text>

          {/* Interactive Map Location Picker Button */}
          <TouchableOpacity
            style={[
              styles.mapPickerCardBtn,
              isRTL && { flexDirection: "row-reverse" },
            ]}
            onPress={() => setIsMapModalVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.mapPickerBtnLeft,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <MapPin size={22} color="#5C5BDB" strokeWidth={2} />
              <View style={[isRTL && { alignItems: "flex-end" }, { flex: 1 }]}>
                <Text
                  style={[
                    styles.mapPickerTitle,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {t("location.chooseOnMap", "Choisir l'adresse sur la carte")}
                </Text>
                <Text
                  style={[styles.mapPickerSub, isRTL && { textAlign: "right" }]}
                  numberOfLines={1}
                >
                  {customAddress
                    ? customAddress
                    : `${t("location.recommended", "Recommandé")} (Oujda)`}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#7F77DD" strokeWidth={2.2} />
          </TouchableOpacity>

          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  isSelected && styles.addressCardSelected,
                ]}
                onPress={() => {
                  setSelectedAddressId(addr.id);
                  setCustomAddress("");
                }}
                activeOpacity={0.8}
              >
                <View style={styles.radio}>
                  {isSelected && <View style={styles.radioFill} />}
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.addressLabelRow}>
                    <Text style={styles.addressLabel}>{addr.label}</Text>
                    {addr.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Par défaut</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText}>
                    {addr.city} • {addr.address}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Or manual address input */}
          <TouchableOpacity
            style={[
              styles.addressCard,
              selectedAddressId === "" && styles.addressCardSelected,
            ]}
            onPress={() => setSelectedAddressId("")}
            activeOpacity={0.8}
          >
            <View style={styles.radio}>
              {selectedAddressId === "" && <View style={styles.radioFill} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressLabel}>Autre adresse à Oujda</Text>
              {selectedAddressId === "" && (
                <TextInput
                  style={styles.customAddressInput}
                  placeholder="Ex: Hay Al Hikma, Rue 12 près de la pharmacie"
                  placeholderTextColor={Colors.textMuted}
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  multiline
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Payment Method Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
            2. {t("checkout.paymentMethod", "Mode de paiement")}
          </Text>

          <View
            style={[
              styles.paymentRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "CASH" && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod("CASH")}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIconCircle}>
                <Banknote
                  size={24}
                  color={paymentMethod === "CASH" ? "#5C5BDB" : "#7F77DD"}
                  strokeWidth={1.8}
                />
              </View>
              <Text style={styles.paymentTitle}>
                {t("checkout.cash", "Cash à la livraison")}
              </Text>
              <Text style={styles.paymentSub}>
                Payez au livreur à la réception
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === "TRANSFER" && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod("TRANSFER")}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIconCircle}>
                <CreditCard
                  size={24}
                  color={paymentMethod === "TRANSFER" ? "#5C5BDB" : "#7F77DD"}
                  strokeWidth={1.8}
                />
              </View>
              <Text style={styles.paymentTitle}>Virement Bancaire</Text>
              <Text style={styles.paymentSub}>
                CIH Bank / Attijariwafa / RIB
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bank Transfer Details Box when TRANSFER is selected */}
          {paymentMethod === "TRANSFER" && (
            <View style={styles.bankDetailsCard}>
              <View style={styles.bankHeaderRow}>
                <Text style={styles.bankHeaderBadge}>
                  RIB Officiel QuickLivraison
                </Text>
              </View>
              <View style={styles.bankFieldRow}>
                <Text style={styles.bankFieldLabel}>Banque :</Text>
                <Text style={styles.bankFieldValue}>
                  {BANK_DETAILS.bankName}
                </Text>
              </View>
              <View style={styles.bankFieldRow}>
                <Text style={styles.bankFieldLabel}>Bénéficiaire :</Text>
                <Text style={styles.bankFieldValue}>
                  {BANK_DETAILS.accountHolder}
                </Text>
              </View>
              <View style={styles.bankRibBox}>
                <Text style={styles.bankRibLabel}>
                  Numéro de Compte / RIB :
                </Text>
                <Text style={styles.bankRibValue} selectable>
                  {BANK_DETAILS.rib}
                </Text>
              </View>
              <Text style={styles.bankNote}>
                Après validation, vous pourrez transmettre votre reçu de
                virement par WhatsApp au {BANK_DETAILS.whatsappReceipt}.
              </Text>
            </View>
          )}
        </View>

        {/* 3. Delivery Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: "right" }]}>
            3. {t("checkout.notes", "Instructions pour le livreur")}
          </Text>
          <TextInput
            style={[styles.notesInput, isRTL && { textAlign: "right" }]}
            placeholder="Ex: Code porte, sonner au 1er étage, appeler à l'arrivée..."
            placeholderTextColor={Colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* 4. Order Recap Card */}
        <Card style={styles.recapCard}>
          <Text style={[styles.recapTitle, isRTL && { textAlign: "right" }]}>
            {t("cart.paymentDetails", "Récapitulatif de paiement")}
          </Text>

          <View
            style={[styles.recapRow, isRTL && { flexDirection: "row-reverse" }]}
          >
            <Text style={styles.recapLabel}>
              {t("cart.subtotal", "Sous-total")} ({cartState.itemCount}{" "}
              {cartState.itemCount > 1
                ? t("cart.articles", "articles")
                : t("cart.article", "article")}
              )
            </Text>
            <Text style={styles.recapValue}>
              {cartState.subtotal.toFixed(2)} DH
            </Text>
          </View>

          <View
            style={[styles.recapRow, isRTL && { flexDirection: "row-reverse" }]}
          >
            <Text style={styles.recapLabel}>Livraison Express Oujda</Text>
            {cartState.freeDeliveryReason ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    textDecorationLine: "line-through",
                    color: Colors.textMuted,
                  }}
                >
                  15.00 DH
                </Text>
                <Text
                  style={{ fontSize: 13, fontWeight: "800", color: "#059669" }}
                >
                  GRATUITE
                </Text>
              </View>
            ) : (
              <Text style={styles.recapValue}>
                {cartState.deliveryFee.toFixed(2)} DH
              </Text>
            )}
          </View>

          {/* Free delivery badge */}
          {cartState.freeDeliveryReason === "threshold" && (
            <View
              style={{
                backgroundColor: "#ECFDF5",
                borderRadius: 10,
                padding: 10,
                marginTop: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#059669",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Livraison GRATUITE — votre commande dépasse 300 DH !
              </Text>
            </View>
          )}

          {cartState.freeDeliveryReason === "loyalty" && (
            <View
              style={{
                backgroundColor: "#FEF3C7",
                borderRadius: 10,
                padding: 10,
                marginTop: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#B45309",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Client fidèle — livraison GRATUITE (5+ commandes) !
              </Text>
            </View>
          )}

          {/* Progress to free delivery */}
          {!cartState.freeDeliveryReason &&
            cartState.deliveryMode === "DELIVERY" &&
            cartState.subtotal > 0 && (
              <View
                style={{
                  backgroundColor: "#EBF2FF",
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: Colors.primary,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Plus que {(300 - cartState.subtotal).toFixed(0)} DH pour la
                  livraison gratuite !
                </Text>
              </View>
            )}

          <View style={styles.divider} />

          <View
            style={[styles.recapRow, isRTL && { flexDirection: "row-reverse" }]}
          >
            <Text style={styles.recapTotalLabel}>
              {t("cart.totalTTC", "Total final")}
            </Text>
            <Text style={styles.recapTotalValue}>
              {cartState.total.toFixed(2)} DH
            </Text>
          </View>
        </Card>

        {/* Confirm Button */}
        <TouchableOpacity
          style={styles.confirmButtonPill}
          onPress={handleConfirmOrder}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              {t("checkout.confirmOrder", "Confirmer la commande")} (
              {cartState.total.toFixed(2)} DH)
            </Text>
          )}
        </TouchableOpacity>

        {/* Location Picker Map Modal */}
        <LocationPickerModal
          visible={isMapModalVisible}
          onClose={() => setIsMapModalVisible(false)}
          selectedAddress={customAddress || "Oujda — Centre-Ville"}
          initialViewMode="map"
          onSelectAddress={(selected) => {
            setSelectedAddressId("");
            setCustomAddress(selected);
            locationStore.setAddress(selected);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    width: "100%",
  },
  mapPickerCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  mapPickerBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mapPickerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#3C3489",
  },
  mapPickerSub: {
    fontSize: 12,
    color: "#7F77DD",
    marginTop: 2,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7F7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  backBtnPlaceholder: {
    width: 40,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3C3489",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#3C3489",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 10,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#CECBF6",
    gap: 12,
  },
  addressCardSelected: {
    borderColor: "#5C5BDB",
    backgroundColor: "#F7F7FF",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CECBF6",
    justifyContent: "center",
    alignItems: "center",
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5C5BDB",
  },
  addressInfo: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
  },
  defaultBadge: {
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#5C5BDB",
  },
  addressText: {
    fontSize: 12,
    color: "#7F77DD",
  },
  customAddressInput: {
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    fontSize: 13,
    color: "#3C3489",
    minHeight: 40,
  },
  paymentRow: {
    flexDirection: "row",
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CECBF6",
    alignItems: "center",
  },
  paymentOptionSelected: {
    borderColor: "#5C5BDB",
    backgroundColor: "#F7F7FF",
  },
  paymentIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 2,
    textAlign: "center",
  },
  paymentSub: {
    fontSize: 10,
    color: "#7F77DD",
    textAlign: "center",
  },
  notesInput: {
    backgroundColor: "#F7F7FF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CECBF6",
    fontSize: 13,
    color: "#3C3489",
    minHeight: 50,
  },
  recapCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  recapTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#3C3489",
    marginBottom: 10,
  },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  recapLabel: {
    fontSize: 13,
    color: "#7F77DD",
  },
  recapValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3C3489",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
  recapTotalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#3C3489",
  },
  recapTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#5C5BDB",
  },
  confirmButtonPill: {
    backgroundColor: Colors.cta,
    borderRadius: 28,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.cta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  bankDetailsCard: {
    marginTop: 14,
    backgroundColor: "#F7F7FF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  bankHeaderRow: {
    marginBottom: 10,
  },
  bankHeaderBadge: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
  },
  bankFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bankFieldLabel: {
    fontSize: 12,
    color: "#7F77DD",
    fontWeight: "600",
  },
  bankFieldValue: {
    fontSize: 12,
    color: "#3C3489",
    fontWeight: "700",
  },
  bankRibBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  bankRibLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7F77DD",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  bankRibValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5C5BDB",
    letterSpacing: 0.5,
  },
  bankNote: {
    fontSize: 11,
    color: "#7F77DD",
    lineHeight: 16,
    fontStyle: "italic",
  },
});
