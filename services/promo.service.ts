import { supabase } from '@/lib/supabase';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'FIXED' | 'PERCENT' | 'FREE_DELIVERY';
  discount_value: number;
  min_order_amount: number;
  description: string;
  is_active: boolean;
  usage_count: number;
}

type PromoListener = () => void;
const listeners = new Set<PromoListener>();

function notify() {
  listeners.forEach((l) => { try { l(); } catch {} });
}

export const promoService = {
  subscribe(listener: PromoListener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  async getPromoCodes(): Promise<PromoCode[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(_mapPromo);
    } catch (err) {
      console.warn('[promoService] getPromoCodes failed:', err);
      return [];
    }
  },

  async validatePromoCode(code: string, orderAmount: number): Promise<PromoCode | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (error || !data) return null;
      const promo = _mapPromo(data);
      if (orderAmount < promo.min_order_amount) return null;
      return promo;
    } catch {
      return null;
    }
  },

  async togglePromoStatus(id: string): Promise<void> {
    try {
      const { data: current } = await (supabase as any)
        .from('promo_codes').select('is_active').eq('id', id).single();
      if (!current) return;

      await (supabase as any)
        .from('promo_codes')
        .update({ is_active: !current.is_active })
        .eq('id', id);

      notify();
    } catch (err) {
      console.warn('[promoService] togglePromoStatus failed:', err);
    }
  },

  async createPromoCode(input: Omit<PromoCode, 'id' | 'usage_count'>): Promise<PromoCode> {
    const { data, error } = await (supabase as any)
      .from('promo_codes')
      .insert({
        code: input.code.toUpperCase().trim(),
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        min_order_amount: input.min_order_amount,
        description: input.description,
        is_active: input.is_active,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) throw new Error('Impossible de créer le code promo');
    notify();
    return _mapPromo(data);
  },

  async deletePromoCode(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Impossible de supprimer le code promo');
    notify();
  },

  async incrementUsage(id: string): Promise<void> {
    try {
      const { data: current } = await (supabase as any)
        .from('promo_codes').select('usage_count').eq('id', id).single();
      if (!current) return;

      await (supabase as any)
        .from('promo_codes')
        .update({ usage_count: (current.usage_count || 0) + 1 })
        .eq('id', id);
    } catch {}
  },
};

function _mapPromo(row: any): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discount_type as 'FIXED' | 'PERCENT' | 'FREE_DELIVERY',
    discount_value: Number(row.discount_value),
    min_order_amount: Number(row.min_order_amount),
    description: row.description || '',
    is_active: row.is_active,
    usage_count: row.usage_count ?? 0,
  };
}


