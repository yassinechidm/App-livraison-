export interface Category {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  emoji: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // in MAD (DH)
  image_url?: string;
  stock: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductInput {
  category_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_available: boolean;
  image_url?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}
