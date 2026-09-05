import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import { addressService } from '@/services/address.service';
import { authService } from '@/services/auth.service';
import { cartService } from '@/services/cart.service';
import { orderService } from '@/services/order.service';
import { CartState } from '@/types/cart.types';
import { Address, PaymentMethodType } from '@/types/order.types';
import { BANK_DETAILS } from '@/types/payment.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CheckoutScreen() {
  const router = useRouter();
  const [cartState, setCartState] = useState<CartState>(cartService.getState());
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customAddress, setCustomAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = cartService.subscribe((state) => {
      setCartState(state);
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

    return unsubscribe;
  }, []);

  async function handleConfirmOrder() {
    if (cartState.items.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide.');
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
      Alert.alert('Adresse requise', 'Veuillez sélectionner ou saisir une adresse de livraison à Oujda.');
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
              .map((c) => `${c.optionName}${c.price > 0 ? ` (+${c.price} DH)` : ''}`)
              .join(' • ');
            const unitPrice = item.unit_total_price ?? item.product.price;

            return {
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: unitPrice,
              selected_customizations_text: customText || undefined,
              special_instructions: item.special_instructions,
            };
          }),
        },
        {
          id: user?.id || 'client-id',
          email: user?.email || 'client@quicklivraison.ma',
          name: user?.email?.split('@')[0] || 'Client Oujda',
        }
      );

      // Redirect immediately to orders tracking page
      router.replace('/(app)/(client)/(tabs)/orders' as any);

      // Show non-blocking confirmation (will appear on the orders page)
      setTimeout(() => {
        Alert.alert(
          '🎉 Commande Confirmée !',
          `Votre commande ${order.order_number} a été transmise avec succès.\nSuivez son statut en temps réel ci-dessous.`
        );
      }, 500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Une erreur est survenue';
      Alert.alert('Erreur', msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser la Commande</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* 1. Delivery Address Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 1. Adresse de livraison (Oujda)</Text>

        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;
          return (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, isSelected && styles.addressCardSelected]}
              onPress={() => {
                setSelectedAddressId(addr.id);
                setCustomAddress('');
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
                <Text style={styles.addressText}>{addr.city} • {addr.address}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Or manual address input */}
        <TouchableOpacity
          style={[
            styles.addressCard,
            selectedAddressId === '' && styles.addressCardSelected,
          ]}
          onPress={() => setSelectedAddressId('')}
          activeOpacity={0.8}
        >
          <View style={styles.radio}>
            {selectedAddressId === '' && <View style={styles.radioFill} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Autre adresse à Oujda</Text>
            {selectedAddressId === '' && (
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
        <Text style={styles.sectionTitle}>💰 2. Mode de paiement</Text>

        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'CASH' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('CASH')}
            activeOpacity={0.8}
          >
            <Text style={styles.paymentEmoji}>💵</Text>
            <Text style={styles.paymentTitle}>Cash à la livraison</Text>
            <Text style={styles.paymentSub}>Payez au livreur à la réception</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'TRANSFER' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('TRANSFER')}
            activeOpacity={0.8}
          >
            <Text style={styles.paymentEmoji}>🏦</Text>
            <Text style={styles.paymentTitle}>Virement Bancaire</Text>
            <Text style={styles.paymentSub}>CIH Bank / Attijariwafa / RIB</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Transfer Details Box when TRANSFER is selected */}
        {paymentMethod === 'TRANSFER' && (
          <View style={styles.bankDetailsCard}>
            <View style={styles.bankHeaderRow}>
              <Text style={styles.bankHeaderBadge}>🏦 RIB Officiel QuickLivraison</Text>
            </View>
            <View style={styles.bankFieldRow}>
              <Text style={styles.bankFieldLabel}>Banque :</Text>
              <Text style={styles.bankFieldValue}>{BANK_DETAILS.bankName}</Text>
            </View>
            <View style={styles.bankFieldRow}>
              <Text style={styles.bankFieldLabel}>Bénéficiaire :</Text>
              <Text style={styles.bankFieldValue}>{BANK_DETAILS.accountHolder}</Text>
            </View>
            <View style={styles.bankRibBox}>
              <Text style={styles.bankRibLabel}>Numéro de Compte / RIB :</Text>
              <Text style={styles.bankRibValue} selectable>{BANK_DETAILS.rib}</Text>
            </View>
            <Text style={styles.bankNote}>
              💡 Après validation, vous pourrez transmettre votre reçu de virement par WhatsApp au {BANK_DETAILS.whatsappReceipt}.
            </Text>
          </View>
        )}
      </View>

      {/* 3. Delivery Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 3. Instructions pour le livreur</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Ex: Code porte, sonner au 1er étage, appeler à l'arrivée..."
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* 4. Order Recap Card */}
      <Card style={styles.recapCard}>
        <Text style={styles.recapTitle}>Récapitulatif de paiement</Text>

        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Sous-total ({cartState.itemCount} articles)</Text>
          <Text style={styles.recapValue}>{cartState.subtotal.toFixed(2)} DH</Text>
        </View>

        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>Livraison Express Oujda</Text>
          {cartState.freeDeliveryReason ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12, textDecorationLine: 'line-through', color: Colors.textMuted }}>15.00 DH</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#059669' }}>GRATUITE</Text>
            </View>
          ) : (
            <Text style={styles.recapValue}>{cartState.deliveryFee.toFixed(2)} DH</Text>
          )}
        </View>

        {/* Free delivery badge */}
        {cartState.freeDeliveryReason === 'threshold' && (
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: 10, padding: 10, marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: '#059669', fontWeight: '700', textAlign: 'center' }}>
              🎉 Livraison GRATUITE — votre commande dépasse 300 DH !
            </Text>
          </View>
        )}

        {cartState.freeDeliveryReason === 'loyalty' && (
          <View style={{ backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: '#B45309', fontWeight: '700', textAlign: 'center' }}>
              ⭐ Client fidèle — livraison GRATUITE (5+ commandes) !
            </Text>
          </View>
        )}

        {/* Progress to free delivery */}
        {!cartState.freeDeliveryReason && cartState.deliveryMode === 'DELIVERY' && cartState.subtotal > 0 && (
          <View style={{ backgroundColor: '#EBF2FF', borderRadius: 10, padding: 10, marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '600', textAlign: 'center' }}>
              🚚 Plus que {(300 - cartState.subtotal).toFixed(0)} DH pour la livraison gratuite !
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.recapRow}>
          <Text style={styles.recapTotalLabel}>Total final</Text>
          <Text style={styles.recapTotalValue}>{cartState.total.toFixed(2)} DH</Text>
        </View>
      </Card>

      {/* Confirm Button */}
      <Button
        title={`Confirmer la commande (${cartState.total.toFixed(2)} DH) 🚀`}
        onPress={handleConfirmOrder}
        isLoading={isSubmitting}
        style={styles.confirmBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtnPlaceholder: {
    width: 40,
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  addressCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F8FAFF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  defaultBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
  },
  addressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  customAddressInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 40,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F8FAFF',
  },
  paymentEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
    textAlign: 'center',
  },
  paymentSub: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  recapCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recapTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  recapLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recapValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  recapTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  recapTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  confirmBtn: {
    marginBottom: 12,
  },
  bankDetailsCard: {
    marginTop: 14,
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  bankHeaderRow: {
    marginBottom: 10,
  },
  bankHeaderBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  bankFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bankFieldLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  bankFieldValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  bankRibBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankRibLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bankRibValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  bankNote: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
