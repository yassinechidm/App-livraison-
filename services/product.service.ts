import { supabase } from '@/lib/supabase';
import { Category, Product, CreateProductInput, UpdateProductInput } from '@/types/product.types';

// Fallback minimal data (shown when Supabase is not yet configured)
const FALLBACK_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Food & Resto', description: 'Burgers, Pizzas, Plats traditionnels', emoji: '🍔', is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Supermarché', description: 'Épicerie, boissons, produits frais', emoji: '🛒', is_active: true },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pharmacie & Soins', description: 'Hygiène et bien-être', emoji: '💊', is_active: true },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Boulangerie & Kaak', description: 'Kaak d\'Oujda et viennoiseries', emoji: '🥐', is_active: true },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Coursier Express', description: 'Envoi de colis urgent', emoji: '📦', is_active: true },
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: 'prod-1', category_id: '11111111-1111-1111-1111-111111111111', name: 'Menu Burger Double Cheese', description: 'Double steak, cheddar fondant, frites', price: 55, stock: 45, is_available: true },
  { id: 'prod-2', category_id: '11111111-1111-1111-1111-111111111111', name: 'Pizza Royale Fruits de Mer', description: 'Mozzarella, crevettes, calamars', price: 70, stock: 25, is_available: true },
  { id: 'prod-5', category_id: '22222222-2222-2222-2222-222222222222', name: 'Pack Eau Ain Ifrane (6x1.5L)', description: 'Eau minérale naturelle', price: 32, stock: 100, is_available: true },
  { id: 'prod-7', category_id: '33333333-3333-3333-3333-333333333333', name: 'Doliprane 1000mg', description: 'Paracétamol boîte de 8', price: 18, stock: 80, is_available: true },
  { id: 'prod-8', category_id: '44444444-4444-4444-4444-444444444444', name: 'Kaak d\'Oujda (500g)', description: 'Kaak à l\'anis et sésame', price: 35, stock: 40, is_available: true },
  { id: 'prod-9', category_id: '55555555-5555-5555-5555-555555555555', name: 'Course Express Intra-Oujda', description: 'Livraison sous 30 min', price: 20, stock: 500, is_available: true },
];

export const productService = {
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Fallback below
    }
    return FALLBACK_CATEGORIES.filter((c) => c.is_active);
  },

  async getAllCategoriesAdmin(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Fallback
    }
    return [...FALLBACK_CATEGORIES];
  },

  async getProducts(categoryId?: string, query?: string): Promise<Product[]> {
    try {
      let req = supabase.from('products').select('*');
      if (categoryId && categoryId !== 'all') {
        req = req.eq('category_id', categoryId);
      }
      if (query && query.trim()) {
        req = req.ilike('name', `%${query.trim()}%`);
      }
      const { data, error } = await req;
      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    } catch {
      // Fallback below
    }

    return FALLBACK_PRODUCTS.filter((p) => {
      if (!p.is_available && !categoryId) return false;
      if (categoryId && categoryId !== 'all' && p.category_id !== categoryId) return false;
      if (query && query.trim()) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data as Product;
      }
    } catch {
      // Fallback
    }
    return FALLBACK_PRODUCTS.find((p) => p.id === id);
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .insert({
          category_id: input.category_id,
          name: input.name,
          description: input.description,
          price: Number(input.price),
          stock: Number(input.stock),
          is_available: input.is_available ?? true,
          image_url: input.image_url || null,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Product;
      }
    } catch {
      // Fallback in memory
    }

    throw new Error('Impossible de créer le produit. Vérifiez votre connexion Supabase.');
  },

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    try {
      const { id, ...updates } = input;
      const { data, error } = await (supabase as any)
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Product;
      }
    } catch {
      // Fallback
    }

    throw new Error('Impossible de modifier le produit. Vérifiez votre connexion Supabase.');
  },

  async toggleProductAvailability(id: string): Promise<Product> {
    const { data: current } = await (supabase as any)
      .from('products').select('is_available').eq('id', id).single();
    if (!current) throw new Error('Produit non trouvé');

    const { data, error } = await (supabase as any)
      .from('products')
      .update({ is_available: !current.is_available })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Impossible de modifier la disponibilité');
    return data as Product;
  },

  async createCategory(name: string, description: string, emoji: string): Promise<Category> {
    try {
      const { data, error } = await (supabase as any)
        .from('categories')
        .insert({
          name,
          description,
          emoji: emoji || '📦',
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Category;
      }
    } catch {
      // Fallback
    }

    throw new Error('Impossible de créer la catégorie. Vérifiez votre connexion Supabase.');
  },

  async toggleCategoryActive(id: string): Promise<Category> {
    const { data: current } = await (supabase as any)
      .from('categories').select('is_active').eq('id', id).single();
    if (!current) throw new Error('Catégorie non trouvée');

    const { data, error } = await (supabase as any)
      .from('categories')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Impossible de modifier la catégorie');
    return data as Category;
  },
};
