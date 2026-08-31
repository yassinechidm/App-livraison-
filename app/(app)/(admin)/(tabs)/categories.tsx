import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Colors from '@/constants/Colors';
import { productService } from '@/services/product.service';
import { promoService, PromoCode } from '@/services/promo.service';
import { Category, Product } from '@/types/product.types';

export default function AdminCategoriesScreen() {
  const [activeTab, setActiveTab] = useState<'promos' | 'categories'>('promos');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddPromoModal, setShowAddPromoModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catEmoji, setCatEmoji] = useState('📦');

  // New Promo Code Form
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT' | 'FREE_DELIVERY'>('FIXED');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrder, setMinOrder] = useState('60');
  const [promoDesc, setPromoDesc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribePromo = promoService.subscribe(loadData);
    return unsubscribePromo;
  }, []);

  async function loadData() {
    const [cats, prods, pms] = await Promise.all([
      productService.getAllCategoriesAdmin(),
      productService.getProducts(),
      promoService.getPromoCodes(),
    ]);
    setCategories(cats);
    setProducts(prods);
    setPromoCodes(pms);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleToggleCategory(id: string) {
    try {
      await productService.toggleCategoryActive(id);
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la catégorie.');
    }
  }

  async function handleTogglePromo(id: string) {
    await promoService.togglePromoStatus(id);
    await loadData();
  }

  async function handleDeletePromo(id: string, code: string) {
    Alert.alert(
      'Supprimer le code',
      `Voulez-vous supprimer le code promo "${code}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await promoService.deletePromoCode(id);
            await loadData();
          },
        },
      ]
    );
  }

  async function handleCreateCategory() {
    if (!catName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour la catégorie.');
      return;
    }

    setIsSubmitting(true);
    try {
      await productService.createCategory(catName.trim(), catDescription.trim(), catEmoji.trim() || '📦');
      setShowAddCatModal(false);
      setCatName('');
      setCatDescription('');
      setCatEmoji('📦');
      await loadData();
      Alert.alert('Succès', 'Catégorie créée avec succès.');
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la catégorie.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreatePromo() {
    if (!promoCode.trim() || !discountValue.trim()) {
      Alert.alert('Erreur', 'Veuillez renseigner le code et la valeur.');
      return;
    }

    setIsSubmitting(true);
    try {
      await promoService.createPromoCode({
        code: promoCode.trim(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_amount: Number(minOrder) || 0,
        description: promoDesc.trim() || `${discountValue} MAD de réduction`,
        is_active: true,
      });

      setShowAddPromoModal(false);
      setPromoCode('');
      setDiscountValue('10');
      setMinOrder('60');
      setPromoDesc('');
      await loadData();
      Alert.alert('Succès', 'Code promo créé avec succès ! 🏷️');
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le code promo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Segmented Tab Switcher */}
      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[styles.topTab, activeTab === 'promos' && styles.topTabActive]}
          onPress={() => setActiveTab('promos')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'promos' && styles.topTabTextActive]}>
            🏷️ Codes Promo ({promoCodes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTab, activeTab === 'categories' && styles.topTabActive]}
          onPress={() => setActiveTab('categories')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'categories' && styles.topTabTextActive]}>
            📂 Catégories ({categories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Header Bar with Action Button */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>
          {activeTab === 'promos'
            ? 'Codes Promo & Réductions Oujda'
            : `Catégories du Menu (${categories.length})`}
        </Text>

        {activeTab === 'promos' ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddPromoModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Nouveau Code</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddCatModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Nouvelle Catégorie</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ========================================================= */}
        {/* 1. PROMO CODES MANAGER                                   */}
        {/* ========================================================= */}
        {activeTab === 'promos' && (
          <View style={{ gap: 10 }}>
            {promoCodes.map((promo) => (
              <Card key={promo.id} style={styles.promoCard}>
                <View style={styles.promoRow}>
                  <View style={styles.promoIconBox}>
                    <Text style={{ fontSize: 22 }}>🏷️</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.promoCodeText}>{promo.code}</Text>
                      <View
                        style={[
                          styles.promoBadge,
                          { backgroundColor: promo.is_active ? '#ECFDF5' : '#F1F5F9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.promoBadgeText,
                            { color: promo.is_active ? '#059669' : '#64748B' },
                          ]}
                        >
                          {promo.is_active ? 'Actif' : 'Désactivé'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.promoDesc}>{promo.description}</Text>
                    <Text style={styles.promoMeta}>
                      Min. {promo.min_order_amount} MAD • Utilisé {promo.usage_count} fois
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Switch
                      value={promo.is_active}
                      onValueChange={() => handleTogglePromo(promo.id)}
                      trackColor={{ false: '#CBD5E1', true: Colors.secondary + '60' }}
                      thumbColor={promo.is_active ? Colors.secondary : '#94A3B8'}
                    />
                    <TouchableOpacity
                      onPress={() => handleDeletePromo(promo.id, promo.code)}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* ========================================================= */}
        {/* 2. PRODUCT CATEGORIES MANAGER                             */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <View style={{ gap: 10 }}>
            {categories.map((cat) => {
              const prodsInCat = products.filter((p) => p.category_id === cat.id);

              return (
                <Card key={cat.id} style={styles.categoryCard}>
                  <View style={styles.catRow}>
                    <View style={styles.catEmojiCircle}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                    </View>

                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catDescription} numberOfLines={2}>
                        {cat.description}
                      </Text>
                      <Text style={styles.productCount}>
                        📦 {prodsInCat.length} articles associés
                      </Text>
                    </View>

                    <View style={styles.toggleGroup}>
                      <Text
                        style={[
                          styles.toggleStatus,
                          { color: cat.is_active ? Colors.secondary : Colors.error },
                        ]}
                      >
                        {cat.is_active ? 'Active' : 'Masquée'}
                      </Text>
                      <Switch
                        value={cat.is_active}
                        onValueChange={() => handleToggleCategory(cat.id)}
                        trackColor={{ false: '#CBD5E1', true: Colors.secondary + '60' }}
                        thumbColor={cat.is_active ? Colors.secondary : '#94A3B8'}
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal: Create Promo Code */}
      <Modal visible={showAddPromoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏷️ Nouveau Code Promo</Text>
              <TouchableOpacity onPress={() => setShowAddPromoModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Code Promo (ex: OUJDA15)"
              placeholder="Ex: OUJDA15"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />

            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeTab,
                  discountType === 'FIXED' && styles.typeTabActive,
                ]}
                onPress={() => setDiscountType('FIXED')}
              >
                <Text style={styles.typeTabText}>Remise Fixe (MAD)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  discountType === 'PERCENT' && styles.typeTabActive,
                ]}
                onPress={() => setDiscountType('PERCENT')}
              >
                <Text style={styles.typeTabText}>Pourcentage (%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeTab,
                  discountType === 'FREE_DELIVERY' && styles.typeTabActive,
                ]}
                onPress={() => setDiscountType('FREE_DELIVERY')}
              >
                <Text style={styles.typeTabText}>Livraison Gratuite</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Valeur de la réduction"
              placeholder="Ex: 15 (en MAD ou %)"
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="numeric"
            />

            <Input
              label="Montant minimum de commande (en MAD)"
              placeholder="Ex: 60"
              value={minOrder}
              onChangeText={setMinOrder}
              keyboardType="numeric"
            />

            <Input
              label="Description pour les clients"
              placeholder="Ex: -15 MAD sur votre commande dès 60 MAD d'achat"
              value={promoDesc}
              onChangeText={setPromoDesc}
            />

            <Button
              title="Créer le Code Promo 🚀"
              onPress={handleCreatePromo}
              isLoading={isSubmitting}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: Create Category */}
      <Modal visible={showAddCatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Créer une Catégorie</Text>
              <TouchableOpacity onPress={() => setShowAddCatModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Emoji / Icône"
              placeholder="Ex: 🍕, 🍦, ☕"
              value={catEmoji}
              onChangeText={setCatEmoji}
            />

            <Input
              label="Nom de la catégorie"
              placeholder="Ex: Pizzas & Pastas"
              value={catName}
              onChangeText={setCatName}
            />

            <Input
              label="Description"
              placeholder="Ex: Plats italiens préparés à la commande"
              value={catDescription}
              onChangeText={setCatDescription}
              multiline
            />

            <Button
              title="Ajouter la catégorie"
              onPress={handleCreateCategory}
              isLoading={isSubmitting}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    borderBottomColor: Colors.primary,
  },
  topTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  topTabTextActive: {
    color: Colors.primary,
    fontWeight: '900',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  promoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  promoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCodeText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  promoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  promoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  promoDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  promoMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  typeTabActive: {
    backgroundColor: '#EBF2FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  typeTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catEmojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  catEmoji: {
    fontSize: 22,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  catDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  productCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  toggleGroup: {
    alignItems: 'center',
    gap: 4,
  },
  toggleStatus: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
});
