import { supabase } from '@/lib/supabase';
import { orderService } from './order.service';

export interface AdminDashboardStats {
  todayOrdersCount: number;
  totalTurnoverMAD: number;
  activeClientsCount: number;
  totalProductsCount: number;
  pendingOrdersCount: number;
  outForDeliveryCount: number;
  deliveredCount: number;
}

export interface AdminClientInfo {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  totalOrders: number;
  totalSpentMAD: number;
  joined_date: string;
  is_active: boolean;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const allOrders = await orderService.getAllOrdersAdmin();
      const today = new Date().toISOString().slice(0, 10);

      const todayOrdersCount = allOrders.filter(
        (o: any) => o.created_at?.slice(0, 10) === today
      ).length;

      const totalTurnoverMAD = allOrders
        .filter((o: any) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + Number(o.total), 0);

      const pendingOrdersCount = allOrders.filter(
        (o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED'
      ).length;

      const outForDeliveryCount = allOrders.filter(
        (o: any) => ['OUT_FOR_DELIVERY', 'PREPARING', 'READY'].includes(o.status)
      ).length;

      const deliveredCount = allOrders.filter(
        (o: any) => o.status === 'DELIVERED'
      ).length;

      // Count clients
      const { count: activeClientsCount } = await (supabase as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'CLIENT');

      // Count products
      const { count: totalProductsCount } = await (supabase as any)
        .from('products')
        .select('id', { count: 'exact', head: true });

      return {
        todayOrdersCount: todayOrdersCount || allOrders.length,
        totalTurnoverMAD,
        activeClientsCount: activeClientsCount || 0,
        totalProductsCount: totalProductsCount || 0,
        pendingOrdersCount,
        outForDeliveryCount,
        deliveredCount,
      };
    } catch (err) {
      console.warn('[adminService] getDashboardStats failed:', err);
      return {
        todayOrdersCount: 0,
        totalTurnoverMAD: 0,
        activeClientsCount: 0,
        totalProductsCount: 0,
        pendingOrdersCount: 0,
        outForDeliveryCount: 0,
        deliveredCount: 0,
      };
    }
  },

  async getClients(): Promise<AdminClientInfo[]> {
    try {
      const { data: profiles, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('role', 'CLIENT')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get order stats per client
      const { data: orderStats } = await (supabase as any)
        .from('orders')
        .select('user_id, total, status')
        .neq('status', 'CANCELLED');

      const statsByUser: Record<string, { count: number; total: number }> = {};
      (orderStats || []).forEach((o: any) => {
        if (!statsByUser[o.user_id]) statsByUser[o.user_id] = { count: 0, total: 0 };
        statsByUser[o.user_id].count += 1;
        statsByUser[o.user_id].total += Number(o.total);
      });

      return (profiles || []).map((p: any) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name || p.email?.split('@')[0] || 'Client',
        phone: p.phone || '',
        totalOrders: statsByUser[p.id]?.count || 0,
        totalSpentMAD: statsByUser[p.id]?.total || 0,
        joined_date: p.created_at?.slice(0, 10) || '',
        is_active: true,
      }));
    } catch (err) {
      console.warn('[adminService] getClients failed:', err);
      return [];
    }
  },

  async toggleClientActive(clientId: string): Promise<AdminClientInfo> {
    // Note: profiles table doesn't have is_active, this is a UI-only toggle
    // In a real app you'd add an is_active column to profiles
    throw new Error('Fonctionnalité non implémentée');
  },
};
