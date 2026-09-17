import { GLOVO_OUJDA_RESTAURANTS } from '@/constants/glovoRestaurants';
import { clientRateLimiter } from '@/lib/rateLimiter';
import { sanitizeName, sanitizeNumber, sanitizeText } from '@/lib/sanitize';
import { supabase } from '@/lib/supabase';
import { cartService } from '@/services/cart.service';
import {
    CreateMenuItemInput,
    CreateRestaurantInput,
    CustomizationGroup,
    MenuItem,
    Restaurant,
    RestaurantCategoryFilter,
    UpdateMenuItemInput,
    UpdateRestaurantInput,
} from '@/types/restaurant.types';

export const RESTAURANT_FILTERS: RestaurantCategoryFilter[] = [
  { id: 'all', name: 'Tous', emoji: '🌟' },
  { id: 'promo', name: 'Promotions', emoji: '🏷️' },
  { id: 'shawarma', name: 'Shawarma & Tacos', emoji: '🌯' },
  { id: 'burgers', name: 'Burgers', emoji: '🍔' },
  { id: 'pizzas', name: 'Pizzas', emoji: '🍕' },
  { id: 'moroccan', name: 'Plats Marocains', emoji: '🍲' },
  { id: 'desserts', name: 'Desserts & Kaak', emoji: '🥐' },
];

export const STANDARD_SAUCES_GROUP: CustomizationGroup = {
  id: 'sauces',
  title: 'Choix de vos Sauces (Gratuit, max 2)',
  required: false,
  max_selection: 2,
  options: [
    { id: 's-fromage', name: 'Sauce Fromagère Maison', price: 0, is_default: true },
    { id: 's-algerienne', name: 'Sauce Algérienne', price: 0 },
    { id: 's-samourai', name: 'Sauce Samouraï (Piquante 🔥)', price: 0 },
    { id: 's-biggy', name: 'Sauce Biggy Burger', price: 0 },
    { id: 's-barbecue', name: 'Sauce Barbecue Fumée', price: 0 },
    { id: 's-mayo-ketchup', name: 'Mayonnaise & Ketchup', price: 0 },
  ],
};

export const STANDARD_EXTRAS_GROUP: CustomizationGroup = {
  id: 'extras',
  title: 'Suppléments Gourmands',
  required: false,
  options: [
    { id: 'ext-cheddar', name: 'Double Fromage Cheddar Fondant', price: 5 },
    { id: 'ext-viande', name: 'Extra Viande Hachée Pure Bœuf', price: 10 },
    { id: 'ext-oeuf-bacon', name: 'Œuf au plat & Bacon de dinde', price: 8 },
    { id: 'ext-frites', name: 'Grande barquette de frites', price: 6 },
  ],
};

export const STANDARD_DRINKS_GROUP: CustomizationGroup = {
  id: 'drinks',
  title: 'Choix de la Boisson Fraîche 33cl',
  required: true,
  min_selection: 1,
  max_selection: 1,
  options: [
    { id: 'dr-coca', name: 'Coca-Cola Original 33cl', price: 0, is_default: true },
    { id: 'dr-coca-zero', name: 'Coca-Cola Zéro 33cl', price: 0 },
    { id: 'dr-fanta', name: 'Fanta Orange 33cl', price: 0 },
    { id: 'dr-sprite', name: 'Sprite Citron 33cl', price: 0 },
    { id: 'dr-hawai', name: 'Hawaï Tropical 33cl', price: 0 },
    { id: 'dr-poms', name: 'Poms Pomme 33cl', price: 0 },
    { id: 'dr-eau', name: 'Eau Minérale Ain Ifrane 50cl', price: 0 },
  ],
};

export const INITIAL_RESTAURANTS_SEED: Restaurant[] = [
  ...GLOVO_OUJDA_RESTAURANTS,
  {
    id: 'resto-bnin',
    name: 'Bnin Oujda',
    cuisine_type: 'Turkish Shawarma • Tacos • Pasticcio',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&auto=format&fit=crop&q=80',
    rating_percent: 95,
    rating_count: '500+',
    delivery_time: '20-35 min',
    delivery_fee: 15,
    delivery_fee_promo: 'Gratuit dès 100 DH',
    free_delivery_threshold: 100,
    is_top_rated: true,
    is_open: true,
    opening_hours: '11:30 - 02:00',
    promo_badge: 'Populaire à Oujda 🔥',
    categories: ['Top des ventes', 'OFFRES EXCLUSIVES ✌️', 'LES BOX', 'SHAWARMAS & TACOS', 'PASTICCIO', 'BOISSONS'],
    menu_items: [
      {
        id: 'bnin-1',
        restaurant_id: 'resto-bnin',
        category: 'Top des ventes',
        name: 'SHAWARMA ROLL',
        description: "L'authentique goût du shawarma dans un bowl ultra-généreux ! Dégustez nos rouleaux de tortilla moelleuse garnis de viande savoureuse, frites et sauces.",
        price: 75,
        image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "500+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_SAUCES_GROUP, STANDARD_EXTRAS_GROUP],
      },
      {
        id: 'bnin-2',
        restaurant_id: 'resto-bnin',
        category: 'Top des ventes',
        name: 'SHAWARMA TURC',
        description: 'Le mélange parfait pour les amateurs de viande ! Découvrez notre Shawarma Turc : une alliance savoureuse entre de tendres lamelles de viande et épices orientales.',
        price: 50,
        image_url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "100+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_SAUCES_GROUP, STANDARD_EXTRAS_GROUP],
      },
      {
        id: 'bnin-3',
        restaurant_id: 'resto-bnin',
        category: 'Top des ventes',
        name: 'SHAWARMA BIG',
        description: 'Vous avez une très grosse faim ? Découvrez notre Shawarma BIG ! Le même goût irrésistible de notre best-seller en format XXL avec double garniture.',
        price: 67,
        image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "100+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_SAUCES_GROUP, STANDARD_EXTRAS_GROUP],
      },
      {
        id: 'bnin-4',
        restaurant_id: 'resto-bnin',
        category: 'Top des ventes',
        name: 'EXPRESS COMBO ✔️',
        description: "Le meilleur choix pour bien manger en un clin d'œil : 1 Sandwich au choix + Frites croustillantes + Boisson fraîche 33cl.",
        price: 95,
        image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "250+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_DRINKS_GROUP, STANDARD_SAUCES_GROUP, STANDARD_EXTRAS_GROUP],
      },
      {
        id: 'bnin-5',
        restaurant_id: 'resto-bnin',
        category: 'LES BOX',
        name: 'BNIN LOVERS DUO BOX ❤️',
        description: 'Idéal à partager à 2 : 2 Shawarmas Rolls + Grande barquette de frites maison + Nuggets + 2 Sauces spéciales + 2 Boissons.',
        price: 152,
        image_url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "300+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_DRINKS_GROUP, STANDARD_SAUCES_GROUP, STANDARD_EXTRAS_GROUP],
      },
      {
        id: 'bnin-6',
        restaurant_id: 'resto-bnin',
        category: 'PASTICCIO',
        name: 'PASTICCIO POULET FROMAGE',
        description: 'Le gratin italien revisité à la marocaine : frites dorées, blanc de poulet mariné, crème béchamel onctueuse et mozzarella gratinée au four.',
        price: 60,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "400+ l'ont commandé",
        is_popular: true,
        is_available: true,
        customization_groups: [STANDARD_EXTRAS_GROUP],
      },
    ],
  },
  {
    id: 'resto-pizza-hut',
    name: 'Pizza Hut Oujda',
    cuisine_type: 'Pizzas • Pan Pizza • Ailes de Poulet',
    logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    rating_percent: 90,
    rating_count: '309',
    delivery_time: '15-30 min',
    delivery_fee: 15,
    delivery_fee_promo: 'Gratuit',
    free_delivery_threshold: 80,
    promo_badge: '-40% sur les offres',
    categories: ['Top des ventes', 'PIZZAS CLASSIQUES', 'PIZZAS SUPRÊMES', 'ENTRÉES & DESSERTS'],
    menu_items: [
      {
        id: 'ph-1',
        restaurant_id: 'resto-pizza-hut',
        category: 'Top des ventes',
        name: 'PIZZA SUPER SUPRÊME LARGE',
        description: 'Bœuf épicé, pepperoni savoureux, poivrons verts, champignons frais et oignons rouges avec double fromage fondu.',
        price: 99,
        image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "300+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
      {
        id: 'ph-2',
        restaurant_id: 'resto-pizza-hut',
        category: 'Top des ventes',
        name: 'PIZZA BARBECUE POULET MOYENNE',
        description: 'Sauce barbecue fumée, poulet grillé, oignons émincés et mélange de fromages fondus sur pâte fraîche croustillante.',
        price: 75,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "200+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
      {
        id: 'ph-3',
        restaurant_id: 'resto-pizza-hut',
        category: 'ENTRÉES & DESSERTS',
        name: 'GARLIC BREAD CHEESY STICKS',
        description: "Bâtonnets de pain à l'ail dorés nappés de mozzarella fondue, servis avec sauce marinara.",
        price: 32,
        image_url: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "150+ l'ont commandé",
        is_popular: false,
        is_available: true,
      },
    ],
  },
  {
    id: 'resto-mcdo',
    name: "McDonald's® Oujda",
    cuisine_type: 'Burgers • Frites • Glaces & Sundae',
    logo_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
    rating_percent: 89,
    rating_count: '5k+',
    delivery_time: '25-40 min',
    delivery_fee: 15,
    delivery_fee_promo: 'Gratuit',
    free_delivery_threshold: 90,
    promo_badge: 'Menu Maxi Best Of',
    categories: ['Top des ventes', 'MENUS BEST OF', 'BURGERS', 'DESSERTS & MCFLURRY'],
    menu_items: [
      {
        id: 'mc-1',
        restaurant_id: 'resto-mcdo',
        category: 'Top des ventes',
        name: 'MENU BIG MAC® MAXI BEST OF',
        description: 'Le légendaire Big Mac® : deux steaks hachés pur bœuf, laitue croquante, fromage fondu, oignons, cornichons et sauce inimitable avec grande frite et boisson.',
        price: 68,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "1k+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
      {
        id: 'mc-2',
        restaurant_id: 'resto-mcdo',
        category: 'Top des ventes',
        name: 'BOÎTE 9 NUGGETS POULET',
        description: 'Morceaux de poulet panés ultra croustillants, servis avec vos 2 sauces préférées.',
        price: 46,
        image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "800+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
      {
        id: 'mc-3',
        restaurant_id: 'resto-mcdo',
        category: 'DESSERTS & MCFLURRY',
        name: 'MCFLURRY® OREO® CARAMEL',
        description: 'Crème glacée onctueuse au lait fouetté avec éclats de biscuits Oreo® croquants et coulis caramel.',
        price: 28,
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "600+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
    ],
  },
  {
    id: 'resto-snack-hanaa',
    name: 'Snack Al Hanaa Oujda',
    cuisine_type: "Sandwichs • Tacos • Brochettes d'Oujda",
    logo_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200&auto=format&fit=crop&q=80',
    cover_image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80',
    rating_percent: 97,
    rating_count: '420+',
    delivery_time: '15-25 min',
    delivery_fee: 10,
    delivery_fee_promo: '10 DH Oujda',
    free_delivery_threshold: 70,
    is_top_rated: true,
    promo_badge: 'Spécial Oujda 🇲🇦',
    categories: ['Top des ventes', 'SANDWICHS TRADITIONNELS', 'TACOS MAXI', 'TAJINES RAPIDES'],
    menu_items: [
      {
        id: 'sh-1',
        restaurant_id: 'resto-snack-hanaa',
        category: 'Top des ventes',
        name: 'SANDWICH FOIE & BROCHETTES MIXTE',
        description: "Pain batbout chaud garni de brochettes de viande marinée et foie grillé aux épices de l'Oriental, salade fraîche et harissa maison.",
        price: 38,
        image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "350+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
      {
        id: 'sh-2',
        restaurant_id: 'resto-snack-hanaa',
        category: 'Top des ventes',
        name: 'TACOS OUJDA 3 VIANDES XL',
        description: 'Tacos géant farci de kefta épicée, dinde fumée, poulet tikka, frites et double sauce fromagère.',
        price: 52,
        image_url: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=400&auto=format&fit=crop&q=80',
        order_count_badge: "500+ l'ont commandé",
        is_popular: true,
        is_available: true,
      },
    ],
  },
];

export let DYNAMIC_RESTAURANTS: Restaurant[] = [...INITIAL_RESTAURANTS_SEED];

type RestaurantListener = () => void;
const listeners: Set<RestaurantListener> = new Set();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Safe fail
    }
  });
}

// Live Realtime Subscriptions for Restaurants and Menu Items
if (typeof supabase?.channel === 'function') {
  try {
    supabase
      .channel('realtime:restaurant_menu_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_menu_items' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new;
            for (const r of DYNAMIC_RESTAURANTS) {
              const idx = r.menu_items?.findIndex((i) => i.id === updated.id);
              if (idx !== -1 && idx !== undefined) {
                r.menu_items[idx] = {
                  ...r.menu_items[idx],
                  name: updated.name ?? r.menu_items[idx].name,
                  price: updated.price !== undefined ? Number(updated.price) : r.menu_items[idx].price,
                  description: updated.description ?? r.menu_items[idx].description,
                  category: updated.category ?? r.menu_items[idx].category,
                  image_url: updated.image_url ?? r.menu_items[idx].image_url,
                  is_popular: updated.is_popular !== undefined ? updated.is_popular : r.menu_items[idx].is_popular,
                  is_available: updated.is_available !== undefined ? updated.is_available : r.menu_items[idx].is_available,
                };
              }
            }
            if (updated.price !== undefined) {
              cartService.syncItemPrice(updated.id, Number(updated.price));
            }
          }
          notifyAll();
        }
      )
      .subscribe();

    supabase
      .channel('realtime:restaurants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurants' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new;
            const idx = DYNAMIC_RESTAURANTS.findIndex((r) => r.id === updated.id);
            if (idx !== -1) {
              DYNAMIC_RESTAURANTS[idx] = {
                ...DYNAMIC_RESTAURANTS[idx],
                name: updated.name ?? DYNAMIC_RESTAURANTS[idx].name,
                cuisine_type: updated.cuisine_type ?? DYNAMIC_RESTAURANTS[idx].cuisine_type,
                cover_image: updated.cover_image ?? DYNAMIC_RESTAURANTS[idx].cover_image,
                delivery_time: updated.delivery_time ?? DYNAMIC_RESTAURANTS[idx].delivery_time,
                delivery_fee: updated.delivery_fee !== undefined ? Number(updated.delivery_fee) : DYNAMIC_RESTAURANTS[idx].delivery_fee,
                promo_badge: updated.promo_badge ?? DYNAMIC_RESTAURANTS[idx].promo_badge,
                is_open: updated.is_active !== undefined ? updated.is_active : DYNAMIC_RESTAURANTS[idx].is_open,
              };
            }
          }
          notifyAll();
        }
      )
      .subscribe();
  } catch {
    // Silent fail if offline
  }
}

const LOCAL_RESTO_OVERRIDES = new Map<string, Partial<Restaurant>>();
const LOCAL_MENU_ITEM_OVERRIDES = new Map<string, Partial<MenuItem>>();

function mapRestaurantRow(r: any): Restaurant {
  const restoOverride = LOCAL_RESTO_OVERRIDES.get(r.id);

  const menuItems = (r.restaurant_menu_items || []).map((m: any) => {
    const itemOverride = LOCAL_MENU_ITEM_OVERRIDES.get(m.id);
    return {
      id: m.id,
      restaurant_id: m.restaurant_id,
      category: itemOverride?.category || m.category || 'Top des ventes',
      name: itemOverride?.name || m.name,
      description: itemOverride?.description !== undefined ? itemOverride.description : m.description,
      price: itemOverride?.price !== undefined ? Number(itemOverride.price) : Number(m.price),
      image_url: itemOverride?.image_url || m.image_url,
      is_popular: itemOverride?.is_popular !== undefined ? itemOverride.is_popular : m.is_popular,
      order_count_badge: itemOverride?.order_count_badge || m.order_count_badge,
      is_available: itemOverride?.is_available !== undefined ? itemOverride.is_available : m.is_available,
      customization_groups: m.customization_groups || undefined,
    };
  });

  const itemCats = Array.from(new Set(menuItems.map((i: any) => i.category).filter(Boolean))) as string[];
  const categories = Array.isArray(r.categories) && r.categories.length > 0
    ? r.categories
    : (itemCats.length > 0 ? itemCats : ['Top des ventes', 'MENUS', 'BOISSONS']);

  const finalDeliveryFee = restoOverride?.delivery_fee !== undefined
    ? Number(restoOverride.delivery_fee)
    : (Number(r.delivery_fee) || 15);

  const finalPromo = restoOverride?.promo_badge !== undefined
    ? restoOverride.promo_badge
    : r.promo_badge;

  return {
    id: r.id,
    name: restoOverride?.name || r.name,
    cuisine_type: restoOverride?.cuisine_type || r.cuisine_type,
    logo_url: restoOverride?.logo_url || r.logo_url || r.cover_image,
    cover_image: restoOverride?.cover_image || r.cover_image,
    rating_percent: r.rating_percent || 95,
    rating_count: r.rating_count || '100+',
    delivery_time: restoOverride?.delivery_time || r.delivery_time || '20-30 min',
    delivery_fee: finalDeliveryFee,
    delivery_fee_promo: finalPromo ? 'Promo' : undefined,
    free_delivery_threshold: Number(r.free_delivery_threshold) || 100,
    is_top_rated: r.rating_percent >= 95,
    promo_badge: finalPromo,
    opening_hours: restoOverride?.opening_hours || r.opening_hours || '11:30 - 02:00',
    is_open: restoOverride?.is_open !== undefined ? restoOverride.is_open : (r.is_active !== undefined ? r.is_active : true),
    categories,
    menu_items: menuItems,
  };
}

function filterRestaurantList(list: Restaurant[], filterId?: string, searchQuery?: string): Restaurant[] {
  return list.filter((r) => {
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCuisine = r.cuisine_type.toLowerCase().includes(q);
      const matchItem = r.menu_items?.some((i) => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)));
      if (!matchName && !matchCuisine && !matchItem) return false;
    }

    if (filterId && filterId !== 'all') {
      const combined = (r.cuisine_type + ' ' + r.name).toLowerCase();
      if (filterId === 'promo') {
        if (!r.promo_badge) return false;
      } else if (filterId === 'pizzas') {
        if (!combined.includes('pizza') && !combined.includes('palermo') && !combined.includes('romano')) return false;
      } else if (filterId === 'burgers') {
        if (!combined.includes('burger') && !combined.includes('bun') && !combined.includes('crousty') && !combined.includes('brofood')) return false;
      } else if (filterId === 'shawarma') {
        if (!combined.includes('shawarma') && !combined.includes('chawarma') && !combined.includes('tacos') && !combined.includes('pasticcio') && !combined.includes('snack')) return false;
      } else if (filterId === 'moroccan') {
        if (!combined.includes('poulet') && !combined.includes('brais') && !combined.includes('tajine') && !combined.includes('maroc')) return false;
      } else if (filterId === 'desserts') {
        if (!combined.includes('pâtisserie') && !combined.includes('patisserie') && !combined.includes('paris') && !combined.includes('sweet') && !combined.includes('crêp') && !combined.includes('bubble') && !combined.includes('kaak') && !combined.includes('déjeuner')) return false;
      } else if (filterId === 'free-delivery') {
        if (r.delivery_fee !== 0 && r.delivery_fee_promo !== 'Gratuit' && (!r.free_delivery_threshold || r.free_delivery_threshold > 100)) return false;
      } else if (filterId === 'top-rated') {
        if (r.rating_percent < 92 && !r.is_top_rated) return false;
      }
    }

    return true;
  });
}

export const restaurantService = {
  subscribe(listener: RestaurantListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async getRestaurants(filterId?: string, searchQuery?: string): Promise<Restaurant[]> {
    try {
      // Direct query to Supabase PostgreSQL database
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .select('*, restaurant_menu_items(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const formatted: Restaurant[] = data.map(mapRestaurantRow);
        DYNAMIC_RESTAURANTS = formatted;
        return filterRestaurantList(formatted, filterId, searchQuery);
      }
    } catch {
      // Fallback below
    }

    return filterRestaurantList(DYNAMIC_RESTAURANTS, filterId, searchQuery);
  },

  async getAllRestaurantsAdmin(): Promise<Restaurant[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .select('*, restaurant_menu_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        DYNAMIC_RESTAURANTS = data.map(mapRestaurantRow);
        return [...DYNAMIC_RESTAURANTS];
      }
    } catch {
      // Fallback
    }
    return [...DYNAMIC_RESTAURANTS];
  },

  async getRestaurantById(id: string): Promise<Restaurant | undefined> {
    try {
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .select('*, restaurant_menu_items(*)')
        .eq('id', id)
        .single();

      if (!error && data) {
        return mapRestaurantRow(data);
      }
    } catch {
      // Fallback
    }
    return DYNAMIC_RESTAURANTS.find((r) => r.id === id);
  },

  async getMenuItemById(id: string): Promise<MenuItem | undefined> {
    try {
      const { data, error } = await (supabase as any)
        .from('restaurant_menu_items')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          restaurant_id: data.restaurant_id,
          category: data.category,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          image_url: data.image_url,
          is_popular: data.is_popular,
          order_count_badge: data.order_count_badge,
          is_available: data.is_available,
        };
      }
    } catch {
      // Fallback
    }

    for (const r of DYNAMIC_RESTAURANTS) {
      const item = r.menu_items.find((m) => m.id === id);
      if (item) return item;
    }
    return undefined;
  },

  // -------------------------------------------------------------
  // ADMIN RESTAURANT CRUD OPERATIONS WITH SUPABASE
  // -------------------------------------------------------------
  async createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
    clientRateLimiter.assert("api:default", "restaurant_admin");

    const cleanName = sanitizeName(input.name, 100);
    const cleanCuisine = sanitizeName(input.cuisine_type, 100);
    const cleanDeliveryTime = sanitizeText(input.delivery_time, { maxLength: 30 }) || '20-30 min';
    const cleanPromoBadge = input.promo_badge ? sanitizeText(input.promo_badge, { maxLength: 50 }) : 'Nouveau à Oujda ✨';

    const newResto: Restaurant = {
      id: `resto-${Date.now()}`,
      name: cleanName,
      cuisine_type: cleanCuisine,
      cover_image: input.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      logo_url: input.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      rating_percent: 98,
      rating_count: 'Nouveau',
      delivery_time: cleanDeliveryTime,
      delivery_fee: sanitizeNumber(input.delivery_fee, 15, 0, 200),
      delivery_fee_promo: input.promo_badge ? 'Promo' : undefined,
      free_delivery_threshold: 100,
      is_top_rated: false,
      promo_badge: cleanPromoBadge,
      categories: input.categories && input.categories.length > 0 ? input.categories : ['Top des ventes', 'MENUS', 'BOISSONS'],
      menu_items: [],
    };

    try {
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .insert({
          name: newResto.name,
          cuisine_type: newResto.cuisine_type,
          cover_image: newResto.cover_image,
          logo_url: newResto.logo_url,
          delivery_time: newResto.delivery_time,
          delivery_fee: newResto.delivery_fee,
          promo_badge: newResto.promo_badge,
        })
        .select()
        .single();

      if (!error && data) {
        newResto.id = data.id;
      }
    } catch {
      // Fallback
    }

    DYNAMIC_RESTAURANTS.unshift(newResto);
    notifyAll();
    return newResto;
  },

  async updateRestaurant(input: UpdateRestaurantInput): Promise<Restaurant> {
    clientRateLimiter.assert("api:default", "restaurant_admin");

    const cleanFee = input.delivery_fee !== undefined ? Number(input.delivery_fee) : undefined;

    // 1. Record in local override map so changes are never wiped by subsequent fetches
    const currentOverride = LOCAL_RESTO_OVERRIDES.get(input.id) || {};
    LOCAL_RESTO_OVERRIDES.set(input.id, {
      ...currentOverride,
      ...input,
      delivery_fee: cleanFee !== undefined ? cleanFee : currentOverride.delivery_fee,
      is_open: input.is_open !== undefined ? input.is_open : currentOverride.is_open,
    });

    // 2. Build strictly whitelisted database payload (prevents 400 Bad Request on unknown columns)
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) dbPayload.name = sanitizeName(input.name, 100);
    if (input.cuisine_type !== undefined) dbPayload.cuisine_type = sanitizeName(input.cuisine_type, 100);
    if (input.cover_image !== undefined) dbPayload.cover_image = input.cover_image;
    if (input.logo_url !== undefined) dbPayload.logo_url = input.logo_url;
    if (input.delivery_time !== undefined) dbPayload.delivery_time = sanitizeText(input.delivery_time, { maxLength: 30 });
    if (cleanFee !== undefined) dbPayload.delivery_fee = cleanFee;
    if (input.promo_badge !== undefined) dbPayload.promo_badge = input.promo_badge ? sanitizeText(input.promo_badge, { maxLength: 50 }) : null;
    if (input.is_open !== undefined) dbPayload.is_active = input.is_open;

    // 3. Try Supabase Update & RPC fallback
    try {
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .update(dbPayload)
        .eq('id', input.id)
        .select();

      if (error || !data || data.length === 0) {
        try {
          await (supabase.rpc as any)('rpc_update_restaurant', {
            p_id: input.id,
            p_name: input.name || null,
            p_cuisine_type: input.cuisine_type || null,
            p_cover_image: input.cover_image || null,
            p_delivery_time: input.delivery_time || null,
            p_delivery_fee: cleanFee !== undefined ? cleanFee : null,
            p_promo_badge: input.promo_badge || null,
            p_is_active: input.is_open !== undefined ? input.is_open : null,
            p_opening_hours: input.opening_hours || null,
          });
        } catch {
          // RPC may not be deployed yet in remote DB
        }
      }
    } catch {
      // Offline fallback
    }

    // 4. Update in-memory state
    const index = DYNAMIC_RESTAURANTS.findIndex((r) => r.id === input.id);
    if (index !== -1) {
      DYNAMIC_RESTAURANTS[index] = {
        ...DYNAMIC_RESTAURANTS[index],
        ...input,
        delivery_fee: cleanFee !== undefined ? cleanFee : DYNAMIC_RESTAURANTS[index].delivery_fee,
        is_open: input.is_open !== undefined ? input.is_open : DYNAMIC_RESTAURANTS[index].is_open,
      };
    }

    notifyAll();
    return DYNAMIC_RESTAURANTS[index] || (input as Restaurant);
  },

  async deleteRestaurant(id: string): Promise<boolean> {
    try {
      await (supabase as any)
        .from('restaurants')
        .delete()
        .eq('id', id);
    } catch {
      // Fallback
    }

    DYNAMIC_RESTAURANTS = DYNAMIC_RESTAURANTS.filter((r) => r.id !== id);
    notifyAll();
    return true;
  },

  // -------------------------------------------------------------
  // ADMIN DISH / MENU ITEM CRUD OPERATIONS WITH SUPABASE
  // -------------------------------------------------------------
  async addMenuItem(input: CreateMenuItemInput): Promise<MenuItem> {
    clientRateLimiter.assert("api:default", "menu_admin");

    const cleanCategory = sanitizeName(input.category, 100) || 'Top des ventes';
    const cleanName = sanitizeName(input.name, 150);
    const cleanDesc = sanitizeText(input.description, { maxLength: 400 });
    const cleanPrice = sanitizeNumber(input.price, 0, 0, 10000);

    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === input.restaurant_id);

    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      restaurant_id: input.restaurant_id,
      category: cleanCategory,
      name: cleanName,
      description: cleanDesc,
      price: cleanPrice,
      image_url: input.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      is_popular: input.is_popular ?? true,
      order_count_badge: input.order_count_badge || 'Nouveau 🌟',
      is_available: input.is_available ?? true,
    };

    try {
      const { data, error } = await (supabase as any)
        .from('restaurant_menu_items')
        .insert({
          restaurant_id: newItem.restaurant_id,
          category: newItem.category,
          name: newItem.name,
          description: newItem.description,
          price: newItem.price,
          image_url: newItem.image_url,
          is_popular: newItem.is_popular,
          is_available: newItem.is_available,
        })
        .select()
        .single();

      if (!error && data) {
        newItem.id = data.id;
      }
    } catch {
      // Fallback
    }

    if (resto) {
      if (!resto.categories.includes(newItem.category)) {
        resto.categories.push(newItem.category);
      }
      resto.menu_items.unshift(newItem);
    }

    notifyAll();
    return newItem;
  },

  async updateMenuItem(input: UpdateMenuItemInput): Promise<MenuItem> {
    const cleanPrice = input.price !== undefined ? Number(input.price) : undefined;
    const cleanName = input.name ? sanitizeName(input.name, 150) : undefined;
    const cleanDesc = input.description ? sanitizeText(input.description, { maxLength: 400 }) : undefined;
    const cleanCategory = input.category ? sanitizeName(input.category, 100) : undefined;

    // 1. Record in local override map so changes persist across UI navigations and fetches
    const currentOverride = LOCAL_MENU_ITEM_OVERRIDES.get(input.id) || {};
    LOCAL_MENU_ITEM_OVERRIDES.set(input.id, {
      ...currentOverride,
      ...input,
      price: cleanPrice !== undefined ? cleanPrice : currentOverride.price,
      name: cleanName || currentOverride.name,
      description: cleanDesc !== undefined ? cleanDesc : currentOverride.description,
      category: cleanCategory || currentOverride.category,
    });

    // 2. Build strictly whitelisted database payload
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanName !== undefined) dbPayload.name = cleanName;
    if (cleanPrice !== undefined) dbPayload.price = cleanPrice;
    if (cleanDesc !== undefined) dbPayload.description = cleanDesc;
    if (cleanCategory !== undefined) dbPayload.category = cleanCategory;
    if (input.image_url !== undefined) dbPayload.image_url = input.image_url;
    if (input.is_popular !== undefined) dbPayload.is_popular = input.is_popular;
    if (input.is_available !== undefined) dbPayload.is_available = input.is_available;
    if (input.order_count_badge !== undefined) dbPayload.order_count_badge = input.order_count_badge;

    // 3. Try Supabase Update & RPC fallback
    try {
      const { data, error } = await (supabase as any)
        .from('restaurant_menu_items')
        .update(dbPayload)
        .eq('id', input.id)
        .select();

      if (error || !data || data.length === 0) {
        try {
          await (supabase.rpc as any)('rpc_update_menu_item', {
            p_id: input.id,
            p_name: cleanName || null,
            p_price: cleanPrice !== undefined ? cleanPrice : null,
            p_description: cleanDesc || null,
            p_category: cleanCategory || null,
            p_image_url: input.image_url || null,
            p_is_popular: input.is_popular !== undefined ? input.is_popular : null,
            p_is_available: input.is_available !== undefined ? input.is_available : null,
          });
        } catch {
          // RPC may not be deployed yet in remote DB
        }
      }
    } catch {
      // Offline fallback
    }

    // 2. Synchronize In-Memory State across all restaurants
    for (const resto of DYNAMIC_RESTAURANTS) {
      const itemIndex = resto.menu_items?.findIndex((i) => i.id === input.id);
      if (itemIndex !== -1 && itemIndex !== undefined) {
        resto.menu_items[itemIndex] = {
          ...resto.menu_items[itemIndex],
          ...input,
          price: cleanPrice !== undefined ? cleanPrice : resto.menu_items[itemIndex].price,
          name: cleanName || resto.menu_items[itemIndex].name,
          description: cleanDesc !== undefined ? cleanDesc : resto.menu_items[itemIndex].description,
          category: cleanCategory || resto.menu_items[itemIndex].category,
        };
      }
    }

    if (cleanPrice !== undefined) {
      cartService.syncItemPrice(input.id, cleanPrice);
    }

    notifyAll();
    const currentResto = DYNAMIC_RESTAURANTS.find((r) => r.id === input.restaurant_id);
    return (currentResto?.menu_items.find((i) => i.id === input.id) || (input as MenuItem)) as MenuItem;
  },

  async toggleMenuItemAvailability(restaurantId: string, itemId: string): Promise<MenuItem> {
    let nextAvail = false;
    for (const resto of DYNAMIC_RESTAURANTS) {
      const item = resto.menu_items?.find((i) => i.id === itemId);
      if (item) {
        item.is_available = !item.is_available;
        nextAvail = item.is_available;
      }
    }

    try {
      const { data, error } = await (supabase as any)
        .from('restaurant_menu_items')
        .update({ is_available: nextAvail, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select();

      if (error || !data || data.length === 0) {
        await (supabase.rpc as any)('rpc_update_menu_item', {
          p_id: itemId,
          p_is_available: nextAvail,
        });
      }
    } catch {
      // Fallback
    }

    notifyAll();
    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === restaurantId);
    return (resto?.menu_items.find((i) => i.id === itemId) || { id: itemId, is_available: nextAvail }) as MenuItem;
  },

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<boolean> {
    try {
      await (supabase as any)
        .from('restaurant_menu_items')
        .delete()
        .eq('id', itemId);
    } catch {
      // Fallback
    }

    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === restaurantId);
    if (resto) {
      resto.menu_items = resto.menu_items.filter((i) => i.id !== itemId);
    }
    notifyAll();
    return true;
  },
};
