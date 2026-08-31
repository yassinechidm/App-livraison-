import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { authService } from './auth.service';
import { Order, OrderStatus, CreateOrderInput, OrderItem } from '@/types/order.types';
import { cartService } from './cart.service';

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const ORDERS_STORAGE_KEY = 'quick_livraison_shared_orders_v2';

// In-memory shared orders store to guarantee zero data loss between views
let SHARED_ORDERS: Order[] = [];

function saveOrdersToStorage() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(SHARED_ORDERS));
    } catch {}
  }
}

function loadOrdersFromStorage() {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          SHARED_ORDERS = parsed;
        }
      }
    } catch {}
  }
}

// Initial load on startup
loadOrdersFromStorage();

// Cross-tab real-time sync in browser
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          SHARED_ORDERS = parsed;
          notify();
        }
      } catch {}
    }
  });
}

// Supabase Realtime listener to sync orders across all phones & PC in real-time
try {
  supabase
    .channel('realtime_orders_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        orderService.getAllOrdersAdmin();
      }
    )
    .subscribe();
} catch (e) {
  console.warn('[orderService] Supabase realtime subscription warning:', e);
}
type OrderListener = () => void;
const listeners = new Set<OrderListener>();

function notify() {
  saveOrdersToStorage();
  listeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

export const orderService = {
  subscribe(listener: OrderListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async createOrder(
    input: CreateOrderInput,
    user: { id: string; email?: string; name?: string; phone?: string }
  ): Promise<Order> {
    const subtotal = input.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const isPickup = input.delivery_mode === 'PICKUP';

    // Check loyalty: 5+ past orders = free delivery
    loadOrdersFromStorage();
    const pastOrderCount = SHARED_ORDERS.filter(
      (o) => o.status !== 'CANCELLED'
    ).length;
    const isLoyaltyFree = pastOrderCount >= 5;
    const isThresholdFree = subtotal >= 300 && !isPickup;

    const delivery_fee = isPickup || isLoyaltyFree || isThresholdFree ? 0 : 15.0;
    const total = subtotal + delivery_fee;
    const orderNumber = `CMD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Ensure user_id is a valid UUID format for Postgres, or null if guest/demo
    const session = await authService.getSession();
    const realAuthUser = session?.user;
    const safeUserId = isValidUUID(realAuthUser?.id)
      ? realAuthUser.id
      : isValidUUID(user.id)
      ? user.id
      : null;

    const orderItems: OrderItem[] = input.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      selected_customizations_text: item.selected_customizations_text,
      special_instructions: item.special_instructions,
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      user_id: safeUserId || 'demo-user',
      customer_name: user.name || user.email?.split('@')[0] || 'Client Oujda',
      customer_phone: user.phone || '+212 6 XX XX XX XX',
      customer_email: user.email || 'client@quicklivraison.ma',
      delivery_address_text: input.delivery_address_text,
      status: 'PENDING',
      subtotal,
      delivery_fee,
      delivery_mode: input.delivery_mode || 'DELIVERY',
      total,
      payment_method: input.payment_method,
      notes: input.notes,
      estimated_delivery_minutes: 25,
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Store immediately in local memory & localStorage
    loadOrdersFromStorage();
    SHARED_ORDERS.unshift(newOrder);
    saveOrdersToStorage();
    cartService.clearCart();
    notify();

    // Async attempt to persist into Supabase PostgreSQL
    try {
      const insertPayload: any = {
        order_number: orderNumber,
        delivery_address_text: input.delivery_address_text,
        address_id: isValidUUID(input.address_id) ? input.address_id : null,
        status: 'PENDING',
        subtotal,
        delivery_fee,
        total,
        payment_method: input.payment_method,
        notes: input.notes || null,
        estimated_delivery_minutes: 25,
        delivery_mode: input.delivery_mode || 'DELIVERY',
        customer_name: newOrder.customer_name,
        customer_phone: user.phone || null,
        customer_email: user.email || null,
      };

      if (safeUserId) {
        insertPayload.user_id = safeUserId;
      }

      const { data: orderData, error: orderError } = await (supabase as any)
        .from('orders')
        .insert(insertPayload)
        .select()
        .single();

      if (orderError) {
        console.error('[orderService] Supabase insert orders error:', orderError);
      }

      if (!orderError && orderData) {
        newOrder.id = orderData.id;

        const orderItemsPayload = input.items.map((item) => ({
          order_id: orderData.id,
          product_id: isValidUUID(item.product_id) ? item.product_id : '11111111-1111-1111-1111-111111111111',
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          selected_customizations_text: item.selected_customizations_text || null,
          special_instructions: item.special_instructions || null,
        }));

        const { error: itemsError } = await (supabase as any).from('order_items').insert(orderItemsPayload);
        if (itemsError) {
          console.error('[orderService] Supabase insert order_items error:', itemsError);
        }
        saveOrdersToStorage();
      }
    } catch (err) {
      console.warn('[orderService] Supabase insert warning (kept in-memory):', err);
    }

    return newOrder;
  },

  async getClientOrders(userId?: string): Promise<Order[]> {
    loadOrdersFromStorage();
    try {
      const session = await authService.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      const uid = userId || user?.id || session?.user?.id;

      let query = (supabase as any)
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (uid && isValidUUID(uid)) {
        query = query.eq('user_id', uid);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbOrders = data.map((o: any) => _mapDbOrder(o, o.order_items || []));
        // Merge with in-memory orders (avoiding duplicates)
        _mergeOrders(dbOrders);
      }
    } catch (err) {
      console.warn('[orderService] getClientOrders Supabase fetch warning:', err);
    }

    return [...SHARED_ORDERS];
  },

  getPastOrderCount(): number {
    loadOrdersFromStorage();
    return SHARED_ORDERS.filter((o) => o.status !== 'CANCELLED').length;
  },

  async getAllOrdersAdmin(statusFilter?: OrderStatus | 'ALL'): Promise<Order[]> {
    loadOrdersFromStorage();
    try {
      let query = (supabase as any)
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbOrders = data.map((o: any) => _mapDbOrder(o, o.order_items || []));
        _mergeOrders(dbOrders);
      }
    } catch (err) {
      console.warn('[orderService] getAllOrdersAdmin Supabase fetch warning:', err);
    }

    if (!statusFilter || statusFilter === 'ALL') {
      return [...SHARED_ORDERS];
    }
    return SHARED_ORDERS.filter((o) => o.status === statusFilter);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const memoryOrder = SHARED_ORDERS.find((o) => o.id === id || o.order_number === id);
    if (memoryOrder) return memoryOrder;

    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && data) {
        return _mapDbOrder(data, data.order_items || []);
      }
    } catch {}

    return undefined;
  },

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const order = SHARED_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      order.status = newStatus;
      order.updated_at = new Date().toISOString();
      if (newStatus === 'DELIVERED') {
        order.estimated_delivery_minutes = 0;
      }
      notify();
    }

    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'DELIVERED') updates.estimated_delivery_minutes = 0;

      await (supabase as any)
        .from('orders')
        .update(updates)
        .eq('id', orderId);
    } catch {}

    if (!order) throw new Error('Commande non trouvée');
    return order;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = SHARED_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      order.status = 'CANCELLED';
      if (reason) {
        order.notes = order.notes ? `${order.notes} | [Annulée: ${reason}]` : `[Annulée: ${reason}]`;
      }
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId);
    } catch {}

    if (!order) throw new Error("Impossible d'annuler la commande");
    return order;
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<Order> {
    const order = SHARED_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      order.notes = notes;
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from('orders')
        .update({ notes })
        .eq('id', orderId);
    } catch {}

    if (!order) throw new Error('Commande non trouvée');
    return order;
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    SHARED_ORDERS = SHARED_ORDERS.filter((o) => o.id !== orderId && o.order_number !== orderId);
    notify();

    try {
      await (supabase as any)
        .from('orders')
        .delete()
        .eq('id', orderId);
    } catch {}

    return true;
  },

  async assignCourier(orderId: string, courierId: string, courierName: string, courierPhone: string): Promise<Order> {
    const order = SHARED_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      order.driver_name = courierName;
      order.driver_phone = courierPhone;
      order.status = 'OUT_FOR_DELIVERY';
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from('orders')
        .update({
          courier_id: courierId,
          driver_name: courierName,
          driver_phone: courierPhone,
          status: 'OUT_FOR_DELIVERY',
        })
        .eq('id', orderId);
    } catch {}

    if (!order) throw new Error("Impossible d'assigner le coursier");
    return order;
  },

  async rateOrder(orderId: string, rating: number, reviewText?: string): Promise<Order> {
    const order = SHARED_ORDERS.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      order.rating = rating;
      order.review_text = reviewText;
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from('orders')
        .update({ rating, review_text: reviewText || null })
        .eq('id', orderId);
    } catch {}

    if (!order) throw new Error('Commande non trouvée');
    return order;
  },

  async reorder(order: Order): Promise<void> {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      cartService.addItem(
        { id: item.product_id, name: item.product_name, description: 'Recommandé', price: item.unit_price, is_available: true },
        item.quantity,
        undefined,
        item.special_instructions
      );
    });
  },
};

function _mergeOrders(dbOrders: Order[]) {
  const existingNumbers = new Set(SHARED_ORDERS.map((o) => o.order_number));
  for (const dbo of dbOrders) {
    if (!existingNumbers.has(dbo.order_number)) {
      SHARED_ORDERS.push(dbo);
      existingNumbers.add(dbo.order_number);
    }
  }
  // Sort descending by created_at
  SHARED_ORDERS.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function _mapDbOrder(row: any, items: any[]): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    customer_name: row.customer_name || undefined,
    customer_phone: row.customer_phone || undefined,
    customer_email: row.customer_email || undefined,
    address_id: row.address_id || undefined,
    delivery_address_text: row.delivery_address_text,
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal),
    delivery_fee: Number(row.delivery_fee),
    delivery_mode: (row.delivery_mode as 'DELIVERY' | 'PICKUP') || 'DELIVERY',
    total: Number(row.total),
    payment_method: row.payment_method,
    notes: row.notes || undefined,
    estimated_delivery_minutes: row.estimated_delivery_minutes ?? 25,
    rating: row.rating || undefined,
    review_text: row.review_text || undefined,
    driver_name: row.driver_name || undefined,
    driver_phone: row.driver_phone || undefined,
    items: items.map((oi: any) => ({
      id: oi.id,
      order_id: oi.order_id,
      product_id: oi.product_id,
      product_name: oi.product_name,
      quantity: Number(oi.quantity),
      unit_price: Number(oi.unit_price),
      total_price: Number(oi.total_price),
      selected_customizations_text: oi.selected_customizations_text || undefined,
      special_instructions: oi.special_instructions || undefined,
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}



