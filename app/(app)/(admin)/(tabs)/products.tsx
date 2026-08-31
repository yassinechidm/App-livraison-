import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ImagePickerField from '@/components/ui/ImagePickerField';
import Colors from '@/constants/Colors';
import { productService } from '@/services/product.service';
import { restaurantService } from '@/services/restaurant.service';
import { Category, Product, CreateProductInput } from '@/types/product.types';
import { Restaurant, MenuItem, CreateRestaurantInput, CreateMenuItemInput } from '@/types/restaurant.types';

export default function AdminProductsScreen() {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'market'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Selected restaurant to manage its dishes
  const [selectedRestoForMenu, setSelectedRestoForMenu] = useState<Restaurant | null>(null);

  // Modals state
  const [showAddRestoModal, setShowAddRestoModal] = useState(false);
  const [showEditRestoModal, setShowEditRestoModal] = useState(false);
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [showAddMarketModal, setShowAddMarketModal] = useState(false);

  // Form State: Restaurant
  const [editingRestoId, setEditingRestoId] = useState<string | null>(null);
  const [restoName, setRestoName] = useState('');
  const [restoCuisine, setRestoCuisine] = useState('');
  const [restoCover, setRestoCover] = useState('');
  const [restoTime, setRestoTime] = useState('20-30 min');
  const [restoFee, setRestoFee] = useState('15');
  const [restoPromo, setRestoPromo] = useState('');
  const [restoOpeningHours, setRestoOpeningHours] = useState('11:30 - 02:00');

  // Form State: Dish / Menu Item
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Top des ventes');
  const [dishPrice, setDishPrice] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishImage, setDishImage] = useState('');
  const [dishIsPopular, setDishIsPopular] = useState(true);

  // Form State: Market Product
  const [marketName, setMarketName] = useState('');
  const [marketDescription, setMarketDescription] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketStock, setMarketStock] = useState('50');
  const [marketCategoryId, setMarketCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    const unsub = restaurantService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [searchQuery]);

  async function loadData() {
    const [restos, prods, cats] = await Promise.all([
      restaurantService.getAllRestaurantsAdmin(),
      productService.getProducts(undefined, searchQuery),
      productService.getCategories(),
    ]);
    setRestaurants(restos);
    setProducts(prods);
    setCategories(cats);
    if (cats.length > 0 && !marketCategoryId) {
      setMarketCategoryId(cats[0].id);
    }
    // Update selected resto if currently open
    if (selectedRestoForMenu) {
      const updated = restos.find((r) => r.id === selectedRestoForMenu.id);
      if (updated) setSelectedRestoForMenu(updated);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // -------------------------------------------------------------
  // RESTAURANT ACTIONS
  // -------------------------------------------------------------
  async function handleCreateRestaurant() {
    if (!restoName.trim() || !restoCuisine.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et le type de cuisine du restaurant.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateRestaurantInput = {
        name: restoName.trim(),
        cuisine_type: restoCuisine.trim(),
        cover_image: restoCover.trim() || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        delivery_time: restoTime.trim() || '20-30 min',
        delivery_fee: Number(restoFee) || 15,
        promo_badge: restoPromo.trim() || undefined,
        categories: ['Top des ventes', 'MENUS', 'BOISSONS'],
      };

      await restaurantService.createRestaurant(input);
      setShowAddRestoModal(false);
      setRestoName('');
      setRestoCuisine('');
      setRestoCover('');
      setRestoPromo('');
      await loadData();
      Alert.alert('Succès', 'Le nouveau restaurant/snack a été ajouté !');
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRestaurant(id: string, name: string) {
    Alert.alert(
      'Supprimer le restaurant',
      `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await restaurantService.deleteRestaurant(id);
            if (selectedRestoForMenu?.id === id) {
              setSelectedRestoForMenu(null);
            }
            await loadData();
          },
        },
      ]
    );
  }

  async function handleToggleRestoOpen(resto: Restaurant) {
    const nextState = !(resto.is_open !== false);
    await restaurantService.updateRestaurant({
      id: resto.id,
      is_open: nextState,
    });
    await loadData();
    Alert.alert(
      'Statut Snack Modifié',
      `${resto.name} est maintenant ${nextState ? 'OUVERT 🟢' : 'FERMÉ TEMPORAIREMENT 🔴'}.`
    );
  }

  function openEditRestoModal(resto: Restaurant) {
    setEditingRestoId(resto.id);
    setRestoName(resto.name);
    setRestoCuisine(resto.cuisine_type);
    setRestoCover(resto.cover_image);
    setRestoTime(resto.delivery_time);
    setRestoFee(resto.delivery_fee.toString());
    setRestoPromo(resto.promo_badge || '');
    setRestoOpeningHours(resto.opening_hours || '11:30 - 02:00');
    setShowEditRestoModal(true);
  }

  async function handleSaveEditRestaurant() {
    if (!editingRestoId) return;
    if (!restoName.trim() || !restoCuisine.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom et le type de cuisine.');
      return;
    }

    setIsSubmitting(true);
    try {
      await restaurantService.updateRestaurant({
        id: editingRestoId,
        name: restoName.trim(),
        cuisine_type: restoCuisine.trim(),
        cover_image: restoCover.trim(),
        delivery_time: restoTime.trim(),
        delivery_fee: Number(restoFee) || 15,
        promo_badge: restoPromo.trim() || undefined,
        opening_hours: restoOpeningHours.trim() || '11:30 - 02:00',
      });

      setShowEditRestoModal(false);
      setEditingRestoId(null);
      await loadData();
      Alert.alert('Succès', 'Les informations du restaurant ont été mises à jour !');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le restaurant.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // -------------------------------------------------------------
  // DISH / MENU ITEM ACTIONS
  // -------------------------------------------------------------
  async function handleCreateDish() {
    if (!selectedRestoForMenu) return;
    if (!dishName.trim() || !dishPrice.trim() || isNaN(Number(dishPrice))) {
      Alert.alert('Erreur', 'Veuillez renseigner un nom et un prix valide en MAD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateMenuItemInput = {
        restaurant_id: selectedRestoForMenu.id,
        category: dishCategory.trim() || 'Top des ventes',
        name: dishName.trim(),
        description: dishDescription.trim() || 'Préparé à la minute aux saveurs gourmandes',
        price: Number(dishPrice),
        image_url: dishImage.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        is_popular: dishIsPopular,
        order_count_badge: dishIsPopular ? 'Populaire 🔥' : undefined,
        is_available: true,
      };

      await restaurantService.addMenuItem(input);
      setShowAddDishModal(false);
      setDishName('');
      setDishDescription('');
      setDishPrice('');
      setDishImage('');
      await loadData();
      Alert.alert('Succès', 'Le plat a été ajouté au menu du restaurant !');
    } catch {
      Alert.alert('Erreur', "Impossible d'ajouter le plat.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditDishModal(dish: MenuItem) {
    setEditingDishId(dish.id);
    setDishName(dish.name);
    setDishCategory(dish.category);
    setDishPrice(dish.price.toString());
    setDishDescription(dish.description);
    setDishImage(dish.image_url);
    setDishIsPopular(dish.is_popular ?? false);
    setShowEditDishModal(true);
  }

  async function handleSaveEditDish() {
    if (!selectedRestoForMenu || !editingDishId) return;
    if (!dishName.trim() || !dishPrice.trim() || isNaN(Number(dishPrice))) {
      Alert.alert('Erreur', 'Veuillez renseigner un nom et un prix valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      await restaurantService.updateMenuItem({
        id: editingDishId,
        restaurant_id: selectedRestoForMenu.id,
        name: dishName.trim(),
        category: dishCategory.trim() || 'Top des ventes',
        price: Number(dishPrice),
        description: dishDescription.trim(),
        image_url: dishImage.trim(),
        is_popular: dishIsPopular,
      });

      setShowEditDishModal(false);
      setEditingDishId(null);
      await loadData();
      Alert.alert('Succès', 'Les modifications du plat ont été enregistrées !');
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le plat.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleDishAvailability(dishId: string) {
    if (!selectedRestoForMenu) return;
    try {
      await restaurantService.toggleMenuItemAvailability(selectedRestoForMenu.id, dishId);
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité.');
    }
  }

  async function handleDeleteDish(dishId: string, name: string) {
    if (!selectedRestoForMenu) return;
    Alert.alert(
      'Supprimer le plat',
      `Supprimer "${name}" du menu ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await restaurantService.deleteMenuItem(selectedRestoForMenu.id, dishId);
            await loadData();
          },
        },
      ]
    );
  }

  // -------------------------------------------------------------
  // MARKET PRODUCTS ACTIONS
  // -------------------------------------------------------------
  async function handleCreateMarketProduct() {
    if (!marketName.trim() || !marketPrice.trim() || isNaN(Number(marketPrice))) {
      Alert.alert('Erreur', 'Veuillez renseigner un nom et un prix valide.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateProductInput = {
        name: marketName.trim(),
        description: marketDescription.trim() || 'Produit disponible à Oujda',
        price: Number(marketPrice),
        stock: Number(marketStock) || 50,
        category_id: marketCategoryId || categories[0]?.id || 'cat-market',
        is_available: true,
      };

      await productService.createProduct(input);
      setShowAddMarketModal(false);
      setMarketName('');
      setMarketDescription('');
      setMarketPrice('');
      setMarketStock('50');
      await loadData();
      Alert.alert('Succès', 'Produit ajouté au supermarché.');
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le produit.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleMarketAvailability(productId: string) {
    try {
      await productService.toggleProductAvailability(productId);
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier la disponibilité.');
    }
  }

  return (
    <View style={styles.container}>
      {/* Tab Switcher: Restaurants vs Supermarché */}
      <View style={styles.topTabSwitcher}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'restaurants' && styles.topTabBtnActive]}
          onPress={() => {
            setActiveTab('restaurants');
            setSelectedRestoForMenu(null);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'restaurants' && styles.topTabTextActive]}>
            🍔 Snacks & Restos ({restaurants.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'market' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('market')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'market' && styles.topTabTextActive]}>
            🛒 Supermarché ({products.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* 1. RESTAURANTS & DISHES MANAGEMENT                        */}
      {/* ========================================================= */}
      {activeTab === 'restaurants' && (
        <>
          {/* Sub-Header Bar */}
          <View style={styles.headerBar}>
            {selectedRestoForMenu ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelectedRestoForMenu(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.backIcon}>‹</Text>
                <Text style={styles.backText}>Tous les Snacks</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un restaurant/snack..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            )}

            {selectedRestoForMenu ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddDishModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>+ Ajouter un Plat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddRestoModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>+ Nouveau Snack</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            {/* VIEW 1A: Selected Restaurant Menu Manager */}
            {selectedRestoForMenu ? (
              <View>
                {/* Restaurant Banner Card */}
                <Card style={styles.restoBannerCard}>
                  <View style={styles.restoBannerRow}>
                    <Image
                      source={{ uri: selectedRestoForMenu.cover_image }}
                      style={styles.restoBannerImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.restoBannerName}>{selectedRestoForMenu.name}</Text>
                      <Text style={styles.restoBannerCuisine}>{selectedRestoForMenu.cuisine_type}</Text>
                      <Text style={styles.restoBannerMeta}>
                        🕒 {selectedRestoForMenu.delivery_time} • 🛵 {selectedRestoForMenu.delivery_fee} DH
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditRestoModal(selectedRestoForMenu)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* Section Title */}
                <View style={styles.menuHeaderRow}>
                  <Text style={styles.sectionHeading}>
                    Plats au Menu ({selectedRestoForMenu.menu_items.length})
                  </Text>
                  <Text style={styles.menuSubTip}>Cliquez sur ✏️ pour modifier prix/nom</Text>
                </View>

                {/* Dishes List */}
                {selectedRestoForMenu.menu_items.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyEmoji}>🍽️</Text>
                    <Text style={styles.emptyTitle}>Aucun plat pour le moment</Text>
                    <Text style={styles.emptySub}>
                      Cliquez sur "+ Ajouter un Plat" en haut pour ajouter des shawarmas, pizzas ou burgers !
                    </Text>
                  </View>
                ) : (
                  selectedRestoForMenu.menu_items.map((dish) => (
                    <Card key={dish.id} style={styles.dishCard}>
                      <View style={styles.dishRow}>
                        <Image
                          source={{ uri: dish.image_url }}
                          style={styles.dishThumb}
                          resizeMode="cover"
                        />

                        <View style={styles.dishInfo}>
                          <View style={styles.dishBadgeRow}>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{dish.category}</Text>
                            </View>
                            {dish.is_popular && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>🔥 Top Ventes</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.dishName}>{dish.name}</Text>
                          <Text style={styles.dishDescription} numberOfLines={2}>
                            {dish.description}
                          </Text>

                          <Text style={styles.dishPrice}>{dish.price.toFixed(2)} MAD</Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.dishActions}>
                          <Switch
                            value={dish.is_available}
                            onValueChange={() => handleToggleDishAvailability(dish.id)}
                            trackColor={{ false: '#CBD5E1', true: Colors.secondary + '60' }}
                            thumbColor={dish.is_available ? Colors.secondary : '#94A3B8'}
                          />
                          <Text
                            style={[
                              styles.availLabel,
                              { color: dish.is_available ? Colors.secondary : Colors.error },
                            ]}
                          >
                            {dish.is_available ? 'Dispo' : 'Épuisé'}
                          </Text>

                          <View style={styles.dishBtnGroup}>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={() => openEditDishModal(dish)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.editBtnText}>✏️</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={() => handleDeleteDish(dish.id, dish.name)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.deleteBtnText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            ) : (
              /* VIEW 1B: All Restaurants List */
              <View>
                <Text style={styles.countText}>{restaurants.length} Snacks & Restaurants répertoriés</Text>

                {restaurants.map((resto) => (
                  <Card key={resto.id} style={styles.restoCard}>
                    <View style={styles.restoRow}>
                      <Image
                        source={{ uri: resto.cover_image }}
                        style={styles.restoCoverThumb}
                        resizeMode="cover"
                      />

                      <View style={styles.restoDetails}>
                        <View style={styles.restoTitleRow}>
                          <Text style={styles.restoTitle}>{resto.name}</Text>
                          {resto.promo_badge && (
                            <View style={styles.restoPromoTag}>
                              <Text style={styles.restoPromoText}>{resto.promo_badge}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.restoCuisineText} numberOfLines={1}>
                          {resto.cuisine_type}
                        </Text>

                        <Text style={styles.restoMetaText}>
                          👍 {resto.rating_percent}% ({resto.rating_count}) • 🕒 {resto.delivery_time} • {resto.opening_hours || '11:30 - 02:00'}
                        </Text>

                        {/* Open / Closed Live Switch */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 }}>
                          <Switch
                            value={resto.is_open !== false}
                            onValueChange={() => handleToggleRestoOpen(resto)}
                            trackColor={{ false: '#CBD5E1', true: Colors.secondary + '60' }}
                            thumbColor={resto.is_open !== false ? Colors.secondary : '#94A3B8'}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: resto.is_open !== false ? Colors.secondary : Colors.error,
                            }}
                          >
                            {resto.is_open !== false ? '🟢 Ouvert aux commandes' : '🔴 Fermé temporairement'}
                          </Text>
                        </View>

                        <View style={styles.restoActionsRow}>
                          <TouchableOpacity
                            style={styles.manageMenuBtn}
                            onPress={() => setSelectedRestoForMenu(resto)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.manageMenuBtnText}>
                              📋 Menu ({resto.menu_items.length}) →
                            </Text>
                          </TouchableOpacity>

                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={styles.editBtn}
                              onPress={() => openEditRestoModal(resto)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.editBtnText}>✏️</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.restoDeleteIconBtn}
                              onPress={() => handleDeleteRestaurant(resto.id, resto.name)}
                              activeOpacity={0.7}
                            >
                              <Text style={{ fontSize: 16 }}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. MARKET / GROCERY PRODUCTS                              */}
      {/* ========================================================= */}
      {activeTab === 'market' && (
        <>
          <View style={styles.headerBar}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un produit épicerie..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddMarketModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            <Text style={styles.countText}>{products.length} articles répertoriés</Text>

            {products.map((product) => {
              const cat = categories.find((c) => c.id === product.category_id);
              return (
                <Card key={product.id} style={styles.productCard}>
                  <View style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {cat?.emoji} {cat?.name || 'Catégorie'}
                        </Text>
                      </View>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>
                      <View style={styles.detailsRow}>
                        <Text style={styles.priceText}>{product.price.toFixed(2)} DH</Text>
                        <Text style={styles.stockText}>📦 Stock : {product.stock}</Text>
                      </View>
                    </View>

                    <View style={styles.toggleContainer}>
                      <Text
                        style={[
                          styles.toggleLabel,
                          { color: product.is_available ? Colors.secondary : Colors.error },
                        ]}
                      >
                        {product.is_available ? 'Disponible' : 'Épuisé'}
                      </Text>
                      <Switch
                        value={product.is_available}
                        onValueChange={() => handleToggleMarketAvailability(product.id)}
                        trackColor={{ false: '#CBD5E1', true: Colors.secondary + '60' }}
                        thumbColor={product.is_available ? Colors.secondary : '#94A3B8'}
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJOUTER UN NOUVEAU SNACK / RESTAURANT              */}
      {/* ========================================================= */}
      <Modal visible={showAddRestoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🍔 Nouveau Snack / Restaurant</Text>
              <TouchableOpacity onPress={() => setShowAddRestoModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nom du restaurant / snack *"
                placeholder="Ex: Snack Le Gourmet Oujda"
                value={restoName}
                onChangeText={setRestoName}
              />

              <Input
                label="Type de cuisine / Spécialités *"
                placeholder="Ex: Burgers • Shawarmas • Tacos"
                value={restoCuisine}
                onChangeText={setRestoCuisine}
              />

              <Input
                label="Temps estimé de livraison"
                placeholder="Ex: 20-30 min"
                value={restoTime}
                onChangeText={setRestoTime}
              />

              <Input
                label="Frais de livraison (en DH)"
                placeholder="Ex: 15"
                value={restoFee}
                onChangeText={setRestoFee}
                keyboardType="numeric"
              />

              <Input
                label="Horaires d'ouverture"
                placeholder="Ex: 11:30 - 02:00"
                value={restoOpeningHours}
                onChangeText={setRestoOpeningHours}
              />

              <Input
                label="Badge Promo (optionnel)"
                placeholder="Ex: -20% sur les offres / Nouveau ✨"
                value={restoPromo}
                onChangeText={setRestoPromo}
              />

              <ImagePickerField
                label="Photo de couverture du restaurant"
                value={restoCover}
                onChangeImage={setRestoCover}
              />

              <Button
                title="Enregistrer le Restaurant 🚀"
                onPress={handleCreateRestaurant}
                isLoading={isSubmitting}
                style={{ marginTop: 14, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: MODIFIER UN SNACK / RESTAURANT                     */}
      {/* ========================================================= */}
      <Modal visible={showEditRestoModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Modifier le Snack / Restaurant</Text>
              <TouchableOpacity onPress={() => setShowEditRestoModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nom du restaurant / snack *"
                value={restoName}
                onChangeText={setRestoName}
              />

              <Input
                label="Type de cuisine / Spécialités *"
                value={restoCuisine}
                onChangeText={setRestoCuisine}
              />

              <Input
                label="Horaires d'ouverture"
                placeholder="Ex: 11:30 - 02:00"
                value={restoOpeningHours}
                onChangeText={setRestoOpeningHours}
              />

              <Input
                label="Temps estimé de livraison"
                value={restoTime}
                onChangeText={setRestoTime}
              />

              <Input
                label="Frais de livraison (en DH)"
                value={restoFee}
                onChangeText={setRestoFee}
                keyboardType="numeric"
              />

              <Input
                label="Badge Promo (optionnel)"
                value={restoPromo}
                onChangeText={setRestoPromo}
              />

              <ImagePickerField
                label="Photo de couverture du restaurant"
                value={restoCover}
                onChangeImage={setRestoCover}
              />

              <Button
                title="Enregistrer les Modifications 💾"
                onPress={handleSaveEditRestaurant}
                isLoading={isSubmitting}
                style={{ marginTop: 14, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: AJOUTER UN PLAT AU MENU DU RESTAURANT              */}
      {/* ========================================================= */}
      <Modal visible={showAddDishModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                🌯 Ajouter un Plat ({selectedRestoForMenu?.name})
              </Text>
              <TouchableOpacity onPress={() => setShowAddDishModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nom du plat *"
                placeholder="Ex: SHAWARMA ROLL DOUBLE CHEESE"
                value={dishName}
                onChangeText={setDishName}
              />

              <Input
                label="Catégorie du menu *"
                placeholder="Ex: Top des ventes / Shawarmas & Tacos / Pizzas / Box"
                value={dishCategory}
                onChangeText={setDishCategory}
              />

              <Input
                label="Prix en MAD *"
                placeholder="Ex: 65.00"
                value={dishPrice}
                onChangeText={setDishPrice}
                keyboardType="numeric"
              />

              <Input
                label="Description gourmande"
                placeholder="Ex: Tortilla moelleuse, viande marinée, frites et sauces"
                value={dishDescription}
                onChangeText={setDishDescription}
                multiline
              />

              <ImagePickerField
                label="Photo du plat"
                value={dishImage}
                onChangeImage={setDishImage}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Mettre en "Top des ventes 🔥"</Text>
                <Switch
                  value={dishIsPopular}
                  onValueChange={setDishIsPopular}
                  trackColor={{ false: '#CBD5E1', true: Colors.primary + '60' }}
                  thumbColor={dishIsPopular ? Colors.primary : '#94A3B8'}
                />
              </View>

              <Button
                title="Ajouter le Plat au Menu 🍽️"
                onPress={handleCreateDish}
                isLoading={isSubmitting}
                style={{ marginTop: 14, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: MODIFIER UN PLAT EXISTANT                          */}
      {/* ========================================================= */}
      <Modal visible={showEditDishModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Modifier le Plat</Text>
              <TouchableOpacity onPress={() => setShowEditDishModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nom du plat"
                value={dishName}
                onChangeText={setDishName}
              />

              <Input
                label="Catégorie"
                value={dishCategory}
                onChangeText={setDishCategory}
              />

              <Input
                label="Prix en MAD"
                value={dishPrice}
                onChangeText={setDishPrice}
                keyboardType="numeric"
              />

              <Input
                label="Description"
                value={dishDescription}
                onChangeText={setDishDescription}
                multiline
              />

              <ImagePickerField
                label="Photo du plat"
                value={dishImage}
                onChangeImage={setDishImage}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Top des ventes 🔥</Text>
                <Switch
                  value={dishIsPopular}
                  onValueChange={setDishIsPopular}
                  trackColor={{ false: '#CBD5E1', true: Colors.primary + '60' }}
                  thumbColor={dishIsPopular ? Colors.primary : '#94A3B8'}
                />
              </View>

              <Button
                title="Enregistrer les Modifications"
                onPress={handleSaveEditDish}
                isLoading={isSubmitting}
                style={{ marginTop: 14, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: AJOUTER PRODUIT SUPERMARCHÉ                        */}
      {/* ========================================================= */}
      <Modal visible={showAddMarketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🛒 Produit Supermarché</Text>
              <TouchableOpacity onPress={() => setShowAddMarketModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nom de l'article"
                placeholder="Ex: Eau Minérale Ain Ifrane"
                value={marketName}
                onChangeText={setMarketName}
              />

              <Input
                label="Prix (en DH)"
                placeholder="Ex: 32.00"
                value={marketPrice}
                onChangeText={setMarketPrice}
                keyboardType="numeric"
              />

              <Input
                label="Stock initial"
                placeholder="Ex: 50"
                value={marketStock}
                onChangeText={setMarketStock}
                keyboardType="numeric"
              />

              <Input
                label="Description"
                placeholder="Détails du produit..."
                value={marketDescription}
                onChangeText={setMarketDescription}
                multiline
              />

              <Button
                title="Enregistrer le produit"
                onPress={handleCreateMarketProduct}
                isLoading={isSubmitting}
                style={{ marginTop: 14, marginBottom: 20 }}
              />
            </ScrollView>
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
  topTabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  topTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  topTabText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  topTabTextActive: {
    color: Colors.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  backText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
    gap: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  restoBannerCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  restoBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restoBannerImg: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  restoBannerName: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  restoBannerCuisine: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  restoBannerMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  menuSubTip: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dishCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dishRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dishThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  dishInfo: {
    flex: 1,
  },
  dishBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  popularBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
  },
  dishName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dishDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  dishActions: {
    alignItems: 'center',
    gap: 4,
  },
  availLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  dishBtnGroup: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
  },
  restoCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  restoCoverThumb: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  restoDetails: {
    flex: 1,
  },
  restoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  restoTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  restoPromoTag: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  restoPromoText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
  },
  restoCuisineText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  restoMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  restoActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageMenuBtn: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  manageMenuBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  restoDeleteIconBtn: {
    padding: 4,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
  },
  categoryBadge: {
    backgroundColor: '#EBF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  stockText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  toggleContainer: {
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 18,
    color: Colors.textMuted,
    padding: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
