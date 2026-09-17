import { supabase } from '@/lib/supabase';
import { cartService } from '@/services/cart.service';
import { Category, CreateProductInput, Product, UpdateProductInput } from '@/types/product.types';

// Fallback minimal data (shown when Supabase is not yet configured or offline)
const FALLBACK_CATEGORIES: Category[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Food & Resto', description: 'Burgers, Pizzas, Plats traditionnels', emoji: '🍔', is_active: true },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Supermarché', description: 'Épicerie, boissons, produits frais', emoji: '🛒', is_active: true },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pharmacie & Soins', description: 'Hygiène et bien-être', emoji: '💊', is_active: true },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Boulangerie & Kaak', description: 'Kaak d\'Oujda et viennoiseries', emoji: '🥐', is_active: true },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Coursier Express', description: 'Envoi de colis urgent', emoji: '📦', is_active: true },
];

export let DYNAMIC_PRODUCTS: Product[] = [
  { id: 'prod-1', category_id: '11111111-1111-1111-1111-111111111111', name: 'Menu Burger Double Cheese', description: 'Double steak, cheddar fondant, frites', price: 55, stock: 45, is_available: true },
  { id: 'prod-2', category_id: '11111111-1111-1111-1111-111111111111', name: 'Pizza Royale Fruits de Mer', description: 'Mozzarella, crevettes, calamars', price: 70, stock: 25, is_available: true },
  { id: 'prod-5', category_id: '22222222-2222-2222-2222-222222222222', name: 'Pack Eau Ain Ifrane (6x1.5L)', description: 'Eau minérale naturelle', price: 32, stock: 100, is_available: true },
  { id: 'prod-7', category_id: '33333333-3333-3333-3333-333333333333', name: 'Doliprane 1000mg', description: 'Paracétamol boîte de 8', price: 18, stock: 80, is_available: true },
  { id: 'prod-8', category_id: '44444444-4444-4444-4444-444444444444', name: 'Kaak d\'Oujda (500g)', description: 'Kaak à l\'anis et sésame', price: 35, stock: 40, is_available: true },
  { id: 'prod-9', category_id: '55555555-5555-5555-5555-555555555555', name: 'Course Express Intra-Oujda', description: 'Livraison sous 30 min', price: 20, stock: 500, is_available: true },
];

const LOCAL_PRODUCT_OVERRIDES = new Map<string, Partial<Product>>();

type ProductListener = () => void;
const listeners: Set<ProductListener> = new Set();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Safe fail
    }
  });
}

// Setup Supabase Realtime Listener for live sync
if (typeof supabase?.channel === 'function') {
  try {
    supabase
      .channel('realtime:products_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new;
            const idx = DYNAMIC_PRODUCTS.findIndex((p) => p.id === updated.id);
            if (idx !== -1) {
              DYNAMIC_PRODUCTS[idx] = {
                ...DYNAMIC_PRODUCTS[idx],
                name: updated.name ?? DYNAMIC_PRODUCTS[idx].name,
                price: updated.price !== undefined ? Number(updated.price) : DYNAMIC_PRODUCTS[idx].price,
                description: updated.description ?? DYNAMIC_PRODUCTS[idx].description,
                stock: updated.stock !== undefined ? Number(updated.stock) : DYNAMIC_PRODUCTS[idx].stock,
                is_available: updated.is_available !== undefined ? updated.is_available : DYNAMIC_PRODUCTS[idx].is_available,
                image_url: updated.image_url ?? DYNAMIC_PRODUCTS[idx].image_url,
              };
            } else {
              DYNAMIC_PRODUCTS.unshift({
                id: updated.id,
                category_id: updated.category_id,
                name: updated.name,
                description: updated.description,
                price: Number(updated.price),
                stock: Number(updated.stock),
                is_available: updated.is_available,
                image_url: updated.image_url,
              });
            }
            if (updated.price !== undefined) {
              cartService.syncItemPrice(updated.id, Number(updated.price));
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newItem = payload.new;
            if (!DYNAMIC_PRODUCTS.some((p) => p.id === newItem.id)) {
              DYNAMIC_PRODUCTS.unshift({
                id: newItem.id,
                category_id: newItem.category_id,
                name: newItem.name,
                description: newItem.description,
                price: Number(newItem.price),
                stock: Number(newItem.stock),
                is_available: newItem.is_available,
                image_url: newItem.image_url,
              });
            }
          }
          notifyAll();
        }
      )
      .subscribe();
  } catch {
    // Ignore if offline
  }
}

export const productService = {
  subscribe(listener: ProductListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

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
        const formatted: Product[] = data.map((p: any) => {
          const override = LOCAL_PRODUCT_OVERRIDES.get(p.id);
          return {
            id: p.id,
            category_id: override?.category_id || p.category_id,
            name: override?.name || p.name,
            description: override?.description !== undefined ? override.description : p.description,
            price: override?.price !== undefined ? Number(override.price) : Number(p.price),
            stock: override?.stock !== undefined ? Number(override.stock) : Number(p.stock),
            is_available: override?.is_available !== undefined ? override.is_available : p.is_available,
            image_url: override?.image_url || p.image_url,
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        });

        // Keep local dynamic cache in sync
        formatted.forEach((p) => {
          const idx = DYNAMIC_PRODUCTS.findIndex((item) => item.id === p.id);
          if (idx !== -1) {
            DYNAMIC_PRODUCTS[idx] = p;
          } else {
            DYNAMIC_PRODUCTS.push(p);
          }
        });

        return formatted;
      }
    } catch {
      // Fallback below
    }

    return DYNAMIC_PRODUCTS.filter((p) => {
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
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const item = data as any;
        const override = LOCAL_PRODUCT_OVERRIDES.get(item.id);
        return {
          id: item.id,
          category_id: override?.category_id || item.category_id,
          name: override?.name || item.name,
          description: override?.description !== undefined ? override.description : item.description,
          price: override?.price !== undefined ? Number(override.price) : Number(item.price),
          stock: override?.stock !== undefined ? Number(override.stock) : Number(item.stock),
          is_available: override?.is_available !== undefined ? override.is_available : item.is_available,
          image_url: override?.image_url || item.image_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }
    } catch {
      // Fallback
    }
    return DYNAMIC_PRODUCTS.find((p) => p.id === id);
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const cleanPrice = Number(input.price) || 0;
    const cleanStock = Number(input.stock) || 50;

    let createdProduct: Product = {
      id: `prod-${Date.now()}`,
      category_id: input.category_id,
      name: input.name,
      description: input.description,
      price: cleanPrice,
      stock: cleanStock,
      is_available: input.is_available ?? true,
      image_url: input.image_url,
    };

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .insert({
          category_id: input.category_id,
          name: input.name,
          description: input.description,
          price: cleanPrice,
          stock: cleanStock,
          is_available: input.is_available ?? true,
          image_url: input.image_url || null,
        })
        .select()
        .single();

      if (!error && data) {
        createdProduct = {
          id: data.id,
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          stock: Number(data.stock),
          is_available: data.is_available,
          image_url: data.image_url,
        };
      }
    } catch {
      // In-memory creation
    }

    DYNAMIC_PRODUCTS.unshift(createdProduct);
    notifyAll();
    return createdProduct;
  },

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    const cleanPrice = input.price !== undefined ? Number(input.price) : undefined;
    const cleanStock = input.stock !== undefined ? Number(input.stock) : undefined;

    // 1. Record override so changes persist across fetches
    const currentOverride = LOCAL_PRODUCT_OVERRIDES.get(input.id) || {};
    LOCAL_PRODUCT_OVERRIDES.set(input.id, {
      ...currentOverride,
      ...input,
      price: cleanPrice !== undefined ? cleanPrice : currentOverride.price,
      stock: cleanStock !== undefined ? cleanStock : currentOverride.stock,
    });

    // 2. Build strictly whitelisted database payload
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (input.name !== undefined) dbPayload.name = input.name;
    if (cleanPrice !== undefined) dbPayload.price = cleanPrice;
    if (input.description !== undefined) dbPayload.description = input.description;
    if (cleanStock !== undefined) dbPayload.stock = cleanStock;
    if (input.category_id !== undefined) dbPayload.category_id = input.category_id;
    if (input.image_url !== undefined) dbPayload.image_url = input.image_url;
    if (input.is_available !== undefined) dbPayload.is_available = input.is_available;

    // 3. Try Supabase Update & RPC fallback
    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .update(dbPayload)
        .eq('id', input.id)
        .select();

      // If RLS returned 0 rows or error, try RPC fallback
      if (error || !data || data.length === 0) {
        try {
          await (supabase.rpc as any)('rpc_update_product', {
            p_id: input.id,
            p_name: input.name || null,
            p_price: cleanPrice !== undefined ? cleanPrice : null,
            p_description: input.description || null,
            p_stock: cleanStock !== undefined ? cleanStock : null,
            p_category_id: input.category_id || null,
            p_image_url: input.image_url || null,
            p_is_available: input.is_available !== undefined ? input.is_available : null,
          });
        } catch {
          // RPC may not be deployed yet in remote DB
        }
      }
    } catch {
      // Fallback
    }

    // 4. Immediate in-memory sync
    const idx = DYNAMIC_PRODUCTS.findIndex((p) => p.id === input.id);
    if (idx !== -1) {
      DYNAMIC_PRODUCTS[idx] = {
        ...DYNAMIC_PRODUCTS[idx],
        ...input,
        price: cleanPrice !== undefined ? cleanPrice : DYNAMIC_PRODUCTS[idx].price,
        stock: cleanStock !== undefined ? cleanStock : DYNAMIC_PRODUCTS[idx].stock,
      };
    }

    if (cleanPrice !== undefined) {
      cartService.syncItemPrice(input.id, cleanPrice);
    }

    // 5. Notify listeners
    notifyAll();
    return DYNAMIC_PRODUCTS.find((p) => p.id === input.id) || (input as Product);
  },

  async toggleProductAvailability(id: string): Promise<Product> {
    let nextAvail = false;
    const idx = DYNAMIC_PRODUCTS.findIndex((p) => p.id === id);
    if (idx !== -1) {
      DYNAMIC_PRODUCTS[idx].is_available = !DYNAMIC_PRODUCTS[idx].is_available;
      nextAvail = DYNAMIC_PRODUCTS[idx].is_available;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('products')
        .update({ is_available: nextAvail, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error || !data || data.length === 0) {
        await (supabase.rpc as any)('rpc_update_product', {
          p_id: id,
          p_is_available: nextAvail,
        });
      }
    } catch {
      // Fallback
    }

    notifyAll();
    return DYNAMIC_PRODUCTS.find((p) => p.id === id) as Product;
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
        notifyAll();
        return data as Category;
      }
    } catch {
      // Fallback
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description,
      emoji: emoji || '📦',
      is_active: true,
    };
    FALLBACK_CATEGORIES.push(newCat);
    notifyAll();
    return newCat;
  },

  async toggleCategoryActive(id: string): Promise<Category> {
    const cat = FALLBACK_CATEGORIES.find((c) => c.id === id);
    let nextState = cat ? !cat.is_active : true;
    try {
      const { data: current } = await (supabase as any)
        .from('categories').select('is_active').eq('id', id).single();
      if (current) {
        nextState = !current.is_active;
        await (supabase as any)
          .from('categories')
          .update({ is_active: nextState })
          .eq('id', id);
      }
    } catch {
      // Fallback
    }

    if (cat) {
      cat.is_active = nextState;
    }
    notifyAll();
    return (cat || { id, is_active: nextState, name: '', description: '', emoji: '' }) as Category;
  },
};
