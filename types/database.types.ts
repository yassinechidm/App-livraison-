import { Category, Product } from './product.types';
import { Order, OrderItem, Address, OrderStatus, PaymentMethodType } from './order.types';
import { UserRole } from './user.types';

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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string | null;
          emoji: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string;
          price: number;
          image_url: string | null;
          stock: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>;
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
          total: number;
          payment_method: PaymentMethodType;
          notes: string | null;
          estimated_delivery_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
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
