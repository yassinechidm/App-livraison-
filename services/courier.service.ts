import { supabase } from '@/lib/supabase';

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  is_available: boolean;
  active_orders_count: number;
  rating: number;
}

type CourierListener = () => void;
const listeners = new Set<CourierListener>();

function notify() {
  listeners.forEach((l) => { try { l(); } catch {} });
}

export const courierService = {
  subscribe(listener: CourierListener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },

  async getCouriers(): Promise<Courier[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('couriers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(_mapCourier);
    } catch (err) {
      console.warn('[courierService] getCouriers failed:', err);
      return [];
    }
  },

  async toggleAvailability(id: string): Promise<void> {
    try {
      const { data: current } = await (supabase as any)
        .from('couriers').select('is_available').eq('id', id).single();
      if (!current) return;

      await (supabase as any)
        .from('couriers')
        .update({ is_available: !current.is_available })
        .eq('id', id);

      notify();
    } catch (err) {
      console.warn('[courierService] toggleAvailability failed:', err);
    }
  },

  async addCourier(name: string, phone: string, vehicle: string): Promise<Courier> {
    const { data, error } = await (supabase as any)
      .from('couriers')
      .insert({ name, phone, vehicle, is_available: true, active_orders_count: 0, rating: 5.0 })
      .select()
      .single();

    if (error) throw new Error('Impossible de créer le coursier');
    notify();
    return _mapCourier(data);
  },

  async updateActiveOrdersCount(id: string, count: number): Promise<void> {
    try {
      await (supabase as any)
        .from('couriers')
        .update({ active_orders_count: count })
        .eq('id', id);
      notify();
    } catch {}
  },
};

function _mapCourier(row: any): Courier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    vehicle: row.vehicle || '🛵 Scooter',
    is_available: row.is_available,
    active_orders_count: row.active_orders_count ?? 0,
    rating: Number(row.rating) || 5.0,
  };
}
