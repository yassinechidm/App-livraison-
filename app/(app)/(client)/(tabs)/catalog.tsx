import CartFloatingButton from '@/components/ui/CartFloatingButton';
import ProductCard from '@/components/ui/ProductCard';
import Colors from '@/constants/Colors';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import { Category, Product } from '@/types/product.types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CatalogScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  async function loadCatalog() {
    const cats = await productService.getCategories();
    setCategories(cats);
    const catId = selectedCategory === 'all' ? undefined : selectedCategory;
    const prods = await productService.getProducts(catId, searchQuery);
    setProducts(prods);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Plats, épicerie, restaurants..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Pills Bar */}
      <View style={styles.categoryPillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              selectedCategory === 'all' && styles.pillActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === 'all' && styles.pillTextActive,
              ]}
            >
              🌟 Tous
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                selectedCategory === cat.id && styles.pillActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedCategory === cat.id && styles.pillTextActive,
                ]}
              >
                {cat.emoji} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <ScrollView
        contentContainerStyle={styles.productsScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.resultCount}>
          {products.length} {products.length > 1 ? 'articles disponibles' : 'article disponible'} à Oujda
        </Text>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
            <Text style={styles.emptyText}>
              Essayez un autre mot-clé ou sélectionnez une autre catégorie.
            </Text>
          </View>
        ) : (
          products.map((product) => {
            const qty = cartService.getItemQuantity(product.id);
            return (
              <ProductCard
                key={product.id}
                product={product}
                quantityInCart={qty}
                onAddToCart={() => cartService.addItem(product, 1)}
                onIncrement={() => cartService.setQuantity(product.id, qty + 1)}
                onDecrement={() => cartService.setQuantity(product.id, qty - 1)}
                onPress={() => router.push(`/product/${product.id}` as any)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Floating Cart Button */}
      <CartFloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  clearIcon: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: 4,
  },
  categoryPillsWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  pillActive: {
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.white,
  },
  productsScroll: {
    padding: 16,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
