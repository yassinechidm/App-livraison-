import {
    OrderStatus,
    PaymentMethodType
} from "./order.types";
import { UserRole } from "./user.types";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      couriers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          phone: string;
          vehicle: string;
          license_plate: string | null;
          bio: string | null;
          profile_photo_url: string | null;
          is_available: boolean;
          active_orders_count: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["couriers"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["couriers"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          emoji: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["categories"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          stock: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          address: string;
          city: string;
          latitude: number | null;
          longitude: number | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["addresses"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
          discount_value: number;
          min_order_amount: number;
          description: string | null;
          is_active: boolean;
          usage_count: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["promo_codes"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["promo_codes"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          address_id: string | null;
          delivery_address_text: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          discount_amount: number;
          total: number;
          payment_method: PaymentMethodType;
          delivery_mode: "DELIVERY" | "PICKUP";
          notes: string | null;
          prescription_storage_path: string | null;
          courier_id: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          courier_lat: number | null;
          courier_lng: number | null;
          restaurant_lat: number | null;
          restaurant_lng: number | null;
          rating: number | null;
          review_text: string | null;
          courier_rating: number | null;
          courier_review_text: string | null;
          courier_tags: string[] | null;
          estimated_delivery_minutes: number;
          is_package_delivery: boolean;
          package_details: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          item_type:
            | "product"
            | "restaurant_menu_item"
            | "prescription"
            | "parcel";
          product_id: string | null;
          menu_item_id: string | null;
          raw_item_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          selected_customizations_text: string | null;
          special_instructions: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          cuisine_type: string;
          logo_url: string | null;
          cover_image: string;
          rating_percent: number;
          rating_count: string;
          delivery_time: string;
          delivery_fee: number;
          free_delivery_threshold: number | null;
          promo_badge: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["restaurants"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
      };
      restaurant_menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_popular: boolean;
          order_count_badge: string | null;
          is_available: boolean;
          customization_groups: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["restaurant_menu_items"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["restaurant_menu_items"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_method: PaymentMethodType;
    };
  };
}
