export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
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
  category: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  order_count_badge?: string;
  is_popular?: boolean;
  is_available: boolean;
  customization_groups?: CustomizationGroup[];
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  logo_url: string;
  cover_image: string;
  rating_percent: number;
  rating_count: string;
  delivery_time: string;
  delivery_fee: number;
  delivery_fee_promo?: string;
  free_delivery_threshold?: number;
  is_top_rated?: boolean;
  is_open?: boolean;
  opening_hours?: string;
  promo_badge?: string;
  categories: string[];
  menu_items?: MenuItem[];
}

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  badge?: string;
}
