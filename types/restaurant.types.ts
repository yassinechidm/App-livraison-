export interface CustomizationOption {
  id: string;
  name: string;
  price: number; // 0 for free (e.g. sauces), +5, +10 for extras
  is_default?: boolean;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  required: boolean;
  min_selection?: number;
  max_selection?: number;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category: string; // e.g. 'Top des ventes', 'Shawarmas & Tacos', 'Les Box', 'Pizzas & Pastas', 'Burgers', 'Boissons'
  name: string;
  description: string;
  price: number; // in MAD
  image_url: string;
  order_count_badge?: string; // e.g. '500+ l''ont commandé', '100+ l''ont commandé'
  is_popular?: boolean;
  is_available: boolean;
  customization_groups?: CustomizationGroup[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string; // 'Fast-Food • Shawarma • Burgers'
  logo_url: string;
  cover_image: string;
  rating_percent: number; // 95 for 95%
  rating_count: string; // '500+', '5k+'
  delivery_time: string; // '20-35 min'
  delivery_fee: number; // 15 or 0
  delivery_fee_promo?: string; // 'Gratuit'
  free_delivery_threshold?: number; // 100 MAD
  is_top_rated?: boolean;
  is_open?: boolean;
  opening_hours?: string; // '11:30 - 02:00'
  promo_badge?: string; // '-40% sur les offres', 'Gratuit'
  categories: string[];
  menu_items: MenuItem[];
}

export interface RestaurantCategoryFilter {
  id: string;
  name: string;
  emoji: string;
}

export interface CreateRestaurantInput {
  name: string;
  cuisine_type: string;
  cover_image: string;
  logo_url?: string;
  delivery_time?: string;
  delivery_fee?: number;
  promo_badge?: string;
  categories?: string[];
  is_open?: boolean;
  opening_hours?: string;
}

export interface UpdateRestaurantInput extends Partial<CreateRestaurantInput> {
  id: string;
}

export interface CreateMenuItemInput {
  restaurant_id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_popular?: boolean;
  order_count_badge?: string;
  is_available?: boolean;
  customization_groups?: CustomizationGroup[];
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
  id: string;
  restaurant_id: string;
}
