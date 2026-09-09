import CartFloatingButton from "@/components/ui/CartFloatingButton";
import ProductCard from "@/components/ui/ProductCard";
import Colors from "@/constants/Colors";
import { cartService } from "@/services/cart.service";
import { locationStore } from "@/services/location.service";
import { productService } from "@/services/product.service";
import { LocationPickerModal } from "@/src/components/LocationPickerModal";
import { PharmacyOptionsModal } from "@/src/components/PharmacyOptionsModal";
import { useLanguage } from "@/src/context/LanguageContext";
import { Category, Product } from "@/types/product.types";
import { useRouter } from "expo-router";
import { Search, Store, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DiscoverCatalogScreen() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(
    locationStore.getAddress() || "Rue Ziri Ibn Atia, 35",
  );
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isPharmacyModalVisible, setIsPharmacyModalVisible] = useState(false);
  const [, setCartVersion] = useState(0);

  useEffect(() => {
    const unsubCart = cartService.subscribe(() => setCartVersion((v) => v + 1));
    const unsubLoc = locationStore.subscribe((addr) =>
      setSelectedAddress(addr),
    );
    return () => {
      unsubCart();
      unsubLoc();
    };
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  async function loadCatalog() {
    try {
      const cats = await productService.getCategories();
      setCategories(cats);
      const catId = selectedCategory === "all" ? undefined : selectedCategory;
      const prods = await productService.getProducts(catId, searchQuery);
      setProducts(prods);
    } catch {
      // Fallback
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadCatalog();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      {/* ── Top Header Section ── */}
      <View style={styles.organicHeader}>
        <SafeAreaView edges={["top"]} style={styles.headerSafe}>
          <View style={styles.heroRow}>
            <View style={{ width: 56 }} />
            <Text style={styles.discoverTitle}>
              {t("catalog.title", "Discover")}
            </Text>
            <View style={styles.magnifierCircle}>
              <Search size={28} color="#3C3489" strokeWidth={2.4} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Main Content Container ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Rounded Search Bar (Screenshot #1) */}
        <View style={styles.searchBarContainer}>
          <Search size={20} color="#7F77DD" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t(
              "catalog.searchPlaceholder",
              "Rechercher des plats, courses...",
            )}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#7F77DD" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills (Quick filters) */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === "all" && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory("all")}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === "all" && styles.categoryChipTextActive,
                ]}
              >
                {t("catalog.all", "All")}
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => {
                  const isPharmacy =
                    cat.id === "33333333-3333-3333-3333-333333333333" ||
                    (cat.name || "").toLowerCase().includes("pharma");
                  if (isPharmacy) {
                    setIsPharmacyModalVisible(true);
                  } else {
                    setSelectedCategory(
                      selectedCategory === cat.id ? "all" : cat.id,
                    );
                  }
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Empty Discovery State (Screenshot #1) ── */}
        {!searchQuery.trim() && selectedCategory === "all" && (
          <View style={styles.emptyDiscoverBox}>
            <View style={styles.emptyStoreIconCircle}>
              <Store size={48} color="#9CA3AF" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyDiscoverTitle}>
              {t("catalog.nothingToDiscover", "Nothing to discover for now")}
            </Text>
            <Text style={styles.emptyDiscoverSubtitle}>
              {t(
                "catalog.nothingToDiscoverSub",
                "You can still search for something you need to buy or want to try",
              )}
            </Text>
          </View>
        )}

        {/* ── Search Results List ── */}
        {(searchQuery.trim() || selectedCategory !== "all") && (
          <View style={styles.resultsGrid}>
            {products.length === 0 ? (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsTitle}>
                  {t("catalog.noResultsTitle", "Aucun résultat trouvé")}
                </Text>
                <Text style={styles.noResultsSub}>
                  {t(
                    "catalog.noResultsSub",
                    "Essayez un autre mot-clé ou parcourez nos catégories.",
                  )}
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
                    onIncrement={() =>
                      cartService.setQuantity(product.id, qty + 1)
                    }
                    onDecrement={() =>
                      cartService.setQuantity(product.id, qty - 1)
                    }
                    onPress={() => router.push(`/product/${product.id}` as any)}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Cart Button sitting above the floating bottom menu */}
      <CartFloatingButton bottomOffset={Platform.OS === "ios" ? 98 : 88} />

      {/* Address Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        selectedAddress={selectedAddress}
        initialViewMode="map"
        onSelectAddress={(addr) => {
          setSelectedAddress(addr);
          locationStore.setAddress(addr);
        }}
      />

      {/* Pharmacy Options Modal */}
      <PharmacyOptionsModal
        visible={isPharmacyModalVisible}
        onClose={() => setIsPharmacyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  organicHeader: {
    backgroundColor: Colors.primary, // Glovo signature warm yellow
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerSafe: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 16 : 8,
  },
  heroRow: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discoverTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  magnifierCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFD166",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 170,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#3C3489",
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryMuted,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7F77DD",
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: "800",
  },

  // Empty state matching Screenshot #1
  emptyDiscoverBox: {
    alignItems: "center",
    paddingHorizontal: 36,
    marginTop: 60,
  },
  emptyStoreIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyDiscoverTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3C3489",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyDiscoverSubtitle: {
    fontSize: 14,
    color: "#7F77DD",
    textAlign: "center",
    lineHeight: 20,
  },

  resultsGrid: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  noResultsBox: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C3489",
    marginBottom: 6,
  },
  noResultsSub: {
    fontSize: 13,
    color: "#7F77DD",
    textAlign: "center",
  },
});
