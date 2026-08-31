import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Colors from '@/constants/Colors';
import { productService } from '@/services/product.service';
import { restaurantService } from '@/services/restaurant.service';
import { cartService } from '@/services/cart.service';
import { AnyPurchasableItem, SelectedCustomization } from '@/types/cart.types';
import { CustomizationGroup } from '@/types/restaurant.types';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<AnyPurchasableItem | null>(null);
  const [customizationGroups, setCustomizationGroups] = useState<CustomizationGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        productService.getProductById(id),
        restaurantService.getMenuItemById(id),
      ]).then(([prod, menuItem]) => {
        if (menuItem) {
          setProduct({
            id: menuItem.id,
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price,
            image_url: menuItem.image_url,
            is_available: menuItem.is_available,
            restaurant_id: menuItem.restaurant_id,
          });

          if (menuItem.customization_groups && menuItem.customization_groups.length > 0) {
            setCustomizationGroups(menuItem.customization_groups);

            // Pre-select default options
            const initialSelected: Record<string, string[]> = {};
            menuItem.customization_groups.forEach((group) => {
              const defaults = group.options
                .filter((opt) => opt.is_default)
                .map((opt) => opt.id);
              if (defaults.length > 0) {
                initialSelected[group.id] = defaults;
              }
            });
            setSelectedOptions(initialSelected);
          }
        } else if (prod) {
          setProduct({
            id: prod.id,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            image_url: prod.image_url,
            is_available: prod.is_available,
            category_id: prod.category_id,
            stock: prod.stock,
          });
        }
        setLoading(false);
      });
    }
  }, [id]);

  function handleToggleOption(group: CustomizationGroup, optionId: string) {
    setSelectedOptions((prev) => {
      const current = prev[group.id] || [];
      const isSelected = current.includes(optionId);

      // Single-choice (e.g. max_selection === 1 or min_selection === 1)
      if (group.max_selection === 1) {
        if (isSelected && !group.required) {
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [optionId] };
      }

      // Multi-choice
      if (isSelected) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      } else {
        const max = group.max_selection || 99;
        if (current.length >= max) {
          // Replace last if max reached
          return { ...prev, [group.id]: [...current.slice(1), optionId] };
        }
        return { ...prev, [group.id]: [...current, optionId] };
      }
    });
  }

  // Calculate extra cost from customizations
  let extraCost = 0;
  const formattedSelectedCustomizations: SelectedCustomization[] = [];

  customizationGroups.forEach((group) => {
    const selectedIds = selectedOptions[group.id] || [];
    selectedIds.forEach((optId) => {
      const opt = group.options.find((o) => o.id === optId);
      if (opt) {
        extraCost += opt.price;
        formattedSelectedCustomizations.push({
          groupId: group.id,
          groupTitle: group.title,
          optionId: opt.id,
          optionName: opt.name,
          price: opt.price,
        });
      }
    });
  });

  const unitPrice = (product?.price || 0) + extraCost;
  const totalPrice = unitPrice * quantity;

  function handleAddToCart() {
    if (product) {
      cartService.addItem(
        product,
        quantity,
        formattedSelectedCustomizations,
        specialInstructions.trim() || undefined
      );
      router.back();
    }
  }

  if (loading || !product) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.loadingSpinner}>
          <Text style={styles.loadingEmoji}>⏳</Text>
        </View>
        <Text style={styles.loadingText}>Chargement du plat...</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Personnaliser votre plat</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Visual Photo */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.productEmoji}>🍽️</Text>
            </View>
          )}

          <View style={styles.stockBadge}>
            <Text
              style={[
                styles.stockBadgeText,
                product.is_available === false && { color: Colors.error },
              ]}
            >
              {product.is_available !== false ? '✓ En cuisine à Oujda' : 'Épuisé'}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{product.price.toFixed(2)}</Text>
            <Text style={styles.currency}> MAD</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
        </Card>

        {/* Customization Options Groups (Sauces, Drinks, Extras) */}
        {customizationGroups.map((group) => {
          const selectedInGroup = selectedOptions[group.id] || [];

          return (
            <Card key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.max_selection && group.max_selection > 1 && (
                    <Text style={styles.groupSub}>
                      Choisissez jusqu'à {group.max_selection} options
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.reqBadge,
                    group.required ? styles.reqBadgeRequired : styles.reqBadgeOptional,
                  ]}
                >
                  <Text
                    style={[
                      styles.reqBadgeText,
                      group.required ? styles.reqBadgeTextRequired : styles.reqBadgeTextOptional,
                    ]}
                  >
                    {group.required ? 'Obligatoire' : 'Optionnel'}
                  </Text>
                </View>
              </View>

              <View style={styles.optionsList}>
                {group.options.map((option) => {
                  const isChecked = selectedInGroup.includes(option.id);

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionRow, isChecked && styles.optionRowActive]}
                      onPress={() => handleToggleOption(group, option.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionLeft}>
                        <View
                          style={[
                            group.max_selection === 1 ? styles.radioCircle : styles.checkboxBox,
                            isChecked && styles.selectedCircle,
                          ]}
                        >
                          {isChecked && <Text style={styles.checkIcon}>✓</Text>}
                        </View>
                        <Text style={[styles.optionName, isChecked && styles.optionNameActive]}>
                          {option.name}
                        </Text>
                      </View>

                      {option.price > 0 ? (
                        <View style={styles.extraPriceTag}>
                          <Text style={styles.extraPriceText}>
                            +{option.price.toFixed(2)} MAD
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.freeOptionText}>Gratuit</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          );
        })}

        {/* Special Instructions Input */}
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Text style={styles.instructionsTitle}>📝 Note pour le Chef</Text>
            <Text style={styles.instructionsSub}>Optionnel</Text>
          </View>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Ex: Sans oignons, sauce bien piquante, frites bien croustillantes..."
            placeholderTextColor={Colors.textMuted}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Quantity Card */}
        <Card style={styles.quantityCard}>
          <Text style={styles.quantityLabel}>Quantité :</Text>
          <QuantitySelector
            quantity={quantity}
            onIncrement={() => setQuantity((q) => q + 1)}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            size="medium"
          />
        </Card>

        {/* Delivery Guarantee */}
        <View style={styles.deliveryBox}>
          <Text style={styles.deliveryIcon}>⚡</Text>
          <Text style={styles.deliveryText}>
            Préparé à la minute aux saveurs d'Oujda et livré chaud à votre porte.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceGroup}>
          <Text style={styles.bottomPriceLabel}>Total ({quantity}x)</Text>
          <Text style={styles.bottomPriceValue}>{totalPrice.toFixed(2)} MAD</Text>
        </View>

        <Button
          title={
            product.is_available !== false
              ? `Ajouter 🛒 (${totalPrice.toFixed(2)} MAD)`
              : 'Article Épuisé 🚫'
          }
          onPress={handleAddToCart}
          disabled={product.is_available === false}
          style={product.is_available === false ? { ...styles.addBtn, backgroundColor: '#94A3B8' } : styles.addBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingSpinner: {
    marginBottom: 12,
  },
  loadingEmoji: {
    fontSize: 36,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: {
    width: 38,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: -3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  imageContainer: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 14,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
  },
  productEmoji: {
    fontSize: 72,
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondary,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 26,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  currency: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  groupSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reqBadgeRequired: {
    backgroundColor: '#FEE2E2',
  },
  reqBadgeOptional: {
    backgroundColor: '#F1F5F9',
  },
  reqBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reqBadgeTextRequired: {
    color: '#DC2626',
  },
  reqBadgeTextOptional: {
    color: Colors.textSecondary,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionRowActive: {
    backgroundColor: '#EBF2FF',
    borderColor: Colors.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  selectedCircle: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  optionNameActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  extraPriceTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  extraPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  freeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  instructionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  instructionsSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  instructionsInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  quantityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deliveryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  deliveryIcon: {
    fontSize: 20,
  },
  deliveryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPriceGroup: {
    flex: 0.8,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  addBtn: {
    flex: 1.4,
  },
});
