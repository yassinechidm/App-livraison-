import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import {
  Restaurant,
  RestaurantCategoryFilter,
  MenuItem,
  CustomizationGroup,
  CreateRestaurantInput,
  UpdateRestaurantInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
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
        const formatted: Restaurant[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          cuisine_type: r.cuisine_type,
          logo_url: r.logo_url || r.cover_image,
          cover_image: r.cover_image,
          rating_percent: r.rating_percent || 95,
          rating_count: r.rating_count || '100+',
          delivery_time: r.delivery_time || '20-30 min',
          delivery_fee: Number(r.delivery_fee) || 15,
          delivery_fee_promo: r.promo_badge ? 'Promo' : undefined,
          free_delivery_threshold: Number(r.free_delivery_threshold) || 100,
          is_top_rated: r.rating_percent >= 95,
          promo_badge: r.promo_badge,
          categories: Array.isArray(r.categories) ? r.categories : ['Top des ventes', 'MENUS', 'BOISSONS'],
          menu_items: (r.restaurant_menu_items || []).map((m: any) => ({
            id: m.id,
            restaurant_id: m.restaurant_id,
            category: m.category,
            name: m.name,
            description: m.description,
            price: Number(m.price),
            image_url: m.image_url,
            is_popular: m.is_popular,
            order_count_badge: m.order_count_badge,
            is_available: m.is_available,
          })),
        }));

        DYNAMIC_RESTAURANTS = formatted;
        return formatted.filter((r) => {
          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = r.name.toLowerCase().includes(q);
            const matchCuisine = r.cuisine_type.toLowerCase().includes(q);
            if (!matchName && !matchCuisine) return false;
          }
          return true;
        });
      }
    } catch {
      // Fallback below
    }

    return DYNAMIC_RESTAURANTS.filter((r) => {
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchCuisine = r.cuisine_type.toLowerCase().includes(q);
        const matchItem = r.menu_items.some((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
        if (!matchName && !matchCuisine && !matchItem) return false;
      }
      return true;
    });
  },

  async getAllRestaurantsAdmin(): Promise<Restaurant[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('restaurants')
        .select('*, restaurant_menu_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        DYNAMIC_RESTAURANTS = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          cuisine_type: r.cuisine_type,
          logo_url: r.logo_url || r.cover_image,
          cover_image: r.cover_image,
          rating_percent: r.rating_percent || 95,
          rating_count: r.rating_count || '100+',
          delivery_time: r.delivery_time || '20-30 min',
          delivery_fee: Number(r.delivery_fee) || 15,
          delivery_fee_promo: r.promo_badge ? 'Promo' : undefined,
          free_delivery_threshold: Number(r.free_delivery_threshold) || 100,
          is_top_rated: r.rating_percent >= 95,
          promo_badge: r.promo_badge,
          categories: Array.isArray(r.categories) ? r.categories : ['Top des ventes', 'MENUS', 'BOISSONS'],
          menu_items: (r.restaurant_menu_items || []).map((m: any) => ({
            id: m.id,
            restaurant_id: m.restaurant_id,
            category: m.category,
            name: m.name,
            description: m.description,
            price: Number(m.price),
            image_url: m.image_url,
            is_popular: m.is_popular,
            order_count_badge: m.order_count_badge,
            is_available: m.is_available,
          })),
        }));
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
        return {
          id: data.id,
          name: data.name,
          cuisine_type: data.cuisine_type,
          logo_url: data.logo_url || data.cover_image,
          cover_image: data.cover_image,
          rating_percent: data.rating_percent || 95,
          rating_count: data.rating_count || '100+',
          delivery_time: data.delivery_time || '20-30 min',
          delivery_fee: Number(data.delivery_fee) || 15,
          delivery_fee_promo: data.promo_badge ? 'Promo' : undefined,
          free_delivery_threshold: Number(data.free_delivery_threshold) || 100,
          is_top_rated: data.rating_percent >= 95,
          promo_badge: data.promo_badge,
          categories: Array.isArray(data.categories) ? data.categories : ['Top des ventes', 'MENUS', 'BOISSONS'],
          menu_items: (data.restaurant_menu_items || []).map((m: any) => ({
            id: m.id,
            restaurant_id: m.restaurant_id,
            category: m.category,
            name: m.name,
            description: m.description,
            price: Number(m.price),
            image_url: m.image_url,
            is_popular: m.is_popular,
            order_count_badge: m.order_count_badge,
            is_available: m.is_available,
          })),
        };
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
    const newResto: Restaurant = {
      id: `resto-${Date.now()}`,
      name: input.name,
      cuisine_type: input.cuisine_type,
      cover_image: input.cover_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      logo_url: input.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      rating_percent: 98,
      rating_count: 'Nouveau',
      delivery_time: input.delivery_time || '20-30 min',
      delivery_fee: Number(input.delivery_fee) || 15,
      delivery_fee_promo: input.promo_badge ? 'Promo' : undefined,
      free_delivery_threshold: 100,
      is_top_rated: false,
      promo_badge: input.promo_badge || 'Nouveau à Oujda ✨',
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
    try {
      const { id, ...updates } = input;
      await (supabase as any)
        .from('restaurants')
        .update(updates)
        .eq('id', id);
    } catch {
      // Fallback
    }

    const index = DYNAMIC_RESTAURANTS.findIndex((r) => r.id === input.id);
    if (index !== -1) {
      DYNAMIC_RESTAURANTS[index] = {
        ...DYNAMIC_RESTAURANTS[index],
        ...input,
      };
    }
    notifyAll();
    return DYNAMIC_RESTAURANTS[index];
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
    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === input.restaurant_id);

    const newItem: MenuItem = {
      id: `dish-${Date.now()}`,
      restaurant_id: input.restaurant_id,
      category: input.category || 'Top des ventes',
      name: input.name,
      description: input.description,
      price: Number(input.price),
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
    try {
      const { id, ...updates } = input;
      await (supabase as any)
        .from('restaurant_menu_items')
        .update(updates)
        .eq('id', id);
    } catch {
      // Fallback
    }

    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === input.restaurant_id);
    if (resto) {
      const itemIndex = resto.menu_items.findIndex((i) => i.id === input.id);
      if (itemIndex !== -1) {
        resto.menu_items[itemIndex] = {
          ...resto.menu_items[itemIndex],
          ...input,
          price: Number(input.price ?? resto.menu_items[itemIndex].price),
        };
      }
    }

    notifyAll();
    return resto?.menu_items.find((i) => i.id === input.id) as MenuItem;
  },

  async toggleMenuItemAvailability(restaurantId: string, itemId: string): Promise<MenuItem> {
    const resto = DYNAMIC_RESTAURANTS.find((r) => r.id === restaurantId);
    const item = resto?.menu_items.find((i) => i.id === itemId);
    if (item) {
      item.is_available = !item.is_available;
      try {
        await (supabase as any)
          .from('restaurant_menu_items')
          .update({ is_available: item.is_available })
          .eq('id', itemId);
      } catch {
        // Fallback
      }
    }
    notifyAll();
    return item as MenuItem;
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
