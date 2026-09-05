import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { AnyPurchasableItem, CartState } from '@/types/cart.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CROSS_SELL_SUGGESTIONS: AnyPurchasableItem[] = [
  {
    id: 'cross-coca',
    name: 'Coca-Cola Canette 33cl',
    description: 'Boisson fraîche pétillante',
    price: 10,
    image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'cross-tiramisu',
    name: 'Tiramisu Spéculoos',
    description: 'Dessert gourmand maison',
    price: 25,
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=200&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'cross-frites',
    name: 'Barquette Frites Maison',
    description: 'Frites dorées croustillantes',
    price: 12,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format&fit=crop&q=80',
    is_available: true,
  },
  {
    id: 'cross-eau',
    name: 'Eau Minérale Ain Ifrane 50cl',
    description: 'Eau minérale naturelle pure',
    price: 6,
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=200&auto=format&fit=crop&q=80',
    is_available: true,
  },
];

export default function CartScreen() {
  const router = useRouter();
  const [cartState, setCartState] = useState<CartState>(cartService.getState());

  useEffect(() => {
    const unsubscribe = cartService.subscribe((state) => {
      setCartState(state);
    });
    return unsubscribe;
  }, []);

  if (cartState.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Votre panier est vide</Text>
        <Text style={styles.emptySubtitle}>
          Ajoutez de délicieux plats, des sandwichs ou des courses pour commencer votre commande à Oujda !
        </Text>
        <Button
          title="Découvrir les Snacks & Restos"
          onPress={() => router.push('/(app)/(client)/restaurants' as any)}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  // Free delivery progress calculation
  const threshold = cartState.freeDeliveryThreshold || 100;
  const progress = Math.min(1, cartState.subtotal / threshold);
  const remainingForFree = Math.max(0, threshold - cartState.subtotal);
  const isFreeDelivery = cartState.subtotal >= threshold && cartState.deliveryMode === 'DELIVERY';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery vs Pickup Switcher */}
        <View style={styles.modeSwitcherContainer}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              cartState.deliveryMode === 'DELIVERY' && styles.modeTabActive,
            ]}
            onPress={() => cartService.setDeliveryMode('DELIVERY')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeTabEmoji}>🛵</Text>
            <View>
              <Text
                style={[
                  styles.modeTabTitle,
                  cartState.deliveryMode === 'DELIVERY' && styles.modeTabTitleActive,
                ]}
              >
                Livraison à domicile
              </Text>
              <Text style={styles.modeTabSub}>
                {isFreeDelivery ? 'Gratuit' : '15,00 MAD'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              cartState.deliveryMode === 'PICKUP' && styles.modeTabActive,
            ]}
            onPress={() => cartService.setDeliveryMode('PICKUP')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeTabEmoji}>🥡</Text>
            <View>
              <Text
                style={[
                  styles.modeTabTitle,
                  cartState.deliveryMode === 'PICKUP' && styles.modeTabTitleActive,
                ]}
              >
                À emporter (Click & Collect)
              </Text>
              <Text style={styles.modeTabSub}>0,00 MAD • Prêt en 15 min</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Free Delivery Animated Progress Gauge */}
        {cartState.deliveryMode === 'DELIVERY' && (
          <Card style={styles.gaugeCard}>
            <View style={styles.gaugeHeader}>
              <Text style={styles.gaugeTitle}>
                {isFreeDelivery ? '🎉 Livraison Gratuite activée !' : '🛵 Livraison Gratuite'}
              </Text>
              <Text style={styles.gaugeSub}>
                {isFreeDelivery
                  ? 'Frais de livraison offerts'
                  : `Plus que ${remainingForFree.toFixed(2)} MAD`}
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: isFreeDelivery ? Colors.secondary : Colors.primary,
                  },
                ]}
              />
            </View>

            <Text style={styles.gaugeFooterText}>
              {isFreeDelivery
                ? 'Profitez de la livraison offerte sur votre commande à Oujda !'
                : `Atteignez ${threshold.toFixed(2)} MAD pour bénéficier de la livraison 100% offerte.`}
            </Text>
          </Card>
        )}

        {/* Header summary */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>
            Articles sélectionnés ({cartState.itemCount})
          </Text>
          <TouchableOpacity onPress={() => cartService.clearCart()}>
            <Text style={styles.clearCartText}>Vider le panier</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items List with Customizations */}
        {cartState.items.map((item, index) => {
          const itemIdentifier = item.cart_item_id || item.product.id;
          const unitPrice = item.unit_total_price ?? item.product.price;
          const totalItemPrice = unitPrice * item.quantity;

          return (
            <Card key={`${itemIdentifier}_${index}`} style={styles.itemCard}>
              <View style={styles.itemRow}>
                {item.product.image_url && (
                  <Image
                    source={{ uri: item.product.image_url }}
                    style={styles.itemThumb}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.product.name}</Text>

                  {/* Display Selected Customizations */}
                  {item.selected_customizations && item.selected_customizations.length > 0 && (
                    <View style={styles.customList}>
                      {item.selected_customizations.map((c, ci) => (
                        <Text key={ci} style={styles.customText}>
                          • {c.optionName} {c.price > 0 ? `(+${c.price} DH)` : ''}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Display Special Note */}
                  {item.special_instructions && (
                    <Text style={styles.specialNoteText}>
                      📝 Note : "{item.special_instructions}"
                    </Text>
                  )}

                  <Text style={styles.itemTotalPrice}>
                    {totalItemPrice.toFixed(2)} MAD
                  </Text>
                </View>

                <View style={styles.itemActions}>
                  <QuantitySelector
                    quantity={item.quantity}
                    onIncrement={() =>
                      cartService.setQuantity(itemIdentifier, item.quantity + 1)
                    }
                    onDecrement={() =>
                      cartService.setQuantity(itemIdentifier, item.quantity - 1)
                    }
                    size="small"
                  />
                  <TouchableOpacity
                    onPress={() => cartService.removeItem(itemIdentifier)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Cross-Selling Suggestions Carousel */}
        <View style={styles.crossSellSection}>
          <Text style={styles.crossSellHeading}>
            🥤 Envie d'une boisson ou d'un dessert ?
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.crossSellScroll}
          >
            {CROSS_SELL_SUGGESTIONS.map((suggestion) => (
              <View key={suggestion.id} style={styles.crossSellCard}>
                <Image
                  source={{ uri: suggestion.image_url }}
                  style={styles.crossSellImg}
                  resizeMode="cover"
                />
                <Text style={styles.crossSellName} numberOfLines={1}>
                  {suggestion.name}
                </Text>
                <View style={styles.crossSellBottom}>
                  <Text style={styles.crossSellPrice}>
                    {suggestion.price.toFixed(2)} MAD
                  </Text>
                  <TouchableOpacity
                    style={styles.crossSellAddBtn}
                    onPress={() => cartService.addItem(suggestion, 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.crossSellAddText}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Price Breakdown Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Détail du paiement</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total ({cartState.itemCount} articles)</Text>
            <Text style={styles.summaryValue}>{cartState.subtotal.toFixed(2)} MAD</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {cartState.deliveryMode === 'DELIVERY'
                ? 'Frais de livraison (Oujda Express)'
                : 'Mode de réception (À emporter)'}
            </Text>
            <Text
              style={[
                styles.summaryValue,
                isFreeDelivery && { color: Colors.secondary, fontWeight: '800' },
              ]}
            >
              {cartState.deliveryMode === 'PICKUP'
                ? 'Gratuit'
                : isFreeDelivery
                ? 'Gratuit (Promo 100 DH)'
                : `${cartState.deliveryFee.toFixed(2)} MAD`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{cartState.total.toFixed(2)} MAD</Text>
          </View>
        </Card>

        {/* Guarantee badge */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeEmoji}>⚡</Text>
          <Text style={styles.guaranteeText}>
            Commande préparée à la minute à Oujda. Paiement sécurisé en espèces à la livraison ou en ligne.
          </Text>
        </View>

        {/* Checkout CTA Deliveroo */}
        <Button
          title={`Passer commande • ${cartState.total.toFixed(2)} DH →`}
          onPress={() => router.push('/(app)/(client)/checkout' as any)}
          style={styles.checkoutBtn}
        />

      </ScrollView>
    </View>
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
  modeSwitcherContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundWhite,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },

  modeTabEmoji: {
    fontSize: 20,
  },
  modeTabTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modeTabTitleActive: {
    color: Colors.primary,
  },
  modeTabSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  gaugeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  gaugeSub: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeFooterText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearCartText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  customList: {
    marginVertical: 3,
  },
  customText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 14,
  },
  specialNoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Colors.primary,
    marginTop: 2,
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  deleteBtn: {
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  crossSellSection: {
    marginVertical: 12,
  },
  crossSellHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  crossSellScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  crossSellCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  crossSellImg: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    marginBottom: 6,
  },
  crossSellName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  crossSellBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  crossSellPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.primary,
  },
  crossSellAddBtn: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  crossSellAddText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  guaranteeEmoji: {
    fontSize: 18,
  },
  guaranteeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  checkoutBtn: {
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyButton: {
    minWidth: 200,
  },
});
