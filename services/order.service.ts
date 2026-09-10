import { supabase } from "@/lib/supabase";
import { CreateOrderInput, Order, OrderStatus } from "@/types/order.types";
import { Platform } from "react-native";
import { authService } from "./auth.service";
import { cartService } from "./cart.service";

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  );
}

let currentScopedUserId: string | null = null;

function getOrdersStorageKey(userId?: string | null): string {
  if (userId && isValidUUID(userId)) {
    return `quick_livraison_orders_${userId}`;
  }
  return "quick_livraison_orders_guest";
}

// In-memory shared orders store to guarantee zero data loss between views
let SHARED_ORDERS: Order[] = [];

function saveOrdersToStorage(userId?: string | null) {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const key = getOrdersStorageKey(userId || currentScopedUserId);
      localStorage.setItem(key, JSON.stringify(SHARED_ORDERS));
    } catch {}
  }
}

function loadOrdersFromStorage(userId?: string | null) {
  if (userId) {
    currentScopedUserId = userId;
  }
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const key = getOrdersStorageKey(userId || currentScopedUserId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          SHARED_ORDERS = parsed;
          return;
        }
      }
    } catch {}
  }
  SHARED_ORDERS = [];
}

// Initial load on startup
loadOrdersFromStorage();

// Cross-tab real-time sync in browser
if (Platform.OS === "web" && typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    const activeKey = getOrdersStorageKey(currentScopedUserId);
    if (e.key === activeKey && e.newValue) {
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
let realtimeOrdersChannel: any = null;

function ensureRealtimeSubscription() {
  if (realtimeOrdersChannel) return;
  try {
    realtimeOrdersChannel = supabase
      .channel("orders_realtime_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          listeners.forEach((l) => {
            try {
              l();
            } catch {}
          });
        },
      )
      .subscribe();
  } catch (e) {
    console.warn("[orderService] Realtime subscription warning:", e);
  }
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
  clearMemoryStore() {
    SHARED_ORDERS = [];
    currentScopedUserId = null;
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("quick_livraison_shared_orders_v2");
        localStorage.removeItem("quick_livraison_orders_guest");
      } catch {}
    }
    notify();
  },

  subscribe(listener: OrderListener): () => void {
    listeners.add(listener);
    ensureRealtimeSubscription();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && realtimeOrdersChannel) {
        try {
          supabase.removeChannel(realtimeOrdersChannel);
          realtimeOrdersChannel = null;
        } catch {}
      }
    };
  },

  async getPrescriptionSignedUrl(storagePath: string): Promise<string | null> {
    try {
      if (!storagePath) return null;
      if (
        storagePath.startsWith("http://") ||
        storagePath.startsWith("https://") ||
        storagePath.startsWith("data:")
      ) {
        return storagePath;
      }
      const { data, error } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(storagePath, 3600);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  },

  async createOrder(
    input: CreateOrderInput,
    user?: { id?: string; email?: string; name?: string; phone?: string },
  ): Promise<Order> {
    const session = await authService.getSession();
    const activeUserId = session?.user?.id || user?.id;

    if (!activeUserId) {
      throw new Error("Vous devez être connecté pour passer une commande.");
    }

    const rpcPayload: any = {
      p_items: input.items.map((item) => ({
        item_type:
          item.item_type ||
          (isValidUUID(item.product_id) ? "product" : "restaurant_menu_item"),
        product_id: isValidUUID(item.product_id) ? item.product_id : null,
        menu_item_id: isValidUUID(item.menu_item_id)
          ? item.menu_item_id
          : isValidUUID(item.product_id)
            ? null
            : item.product_id,
        raw_item_id: item.raw_item_id || item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        selected_customizations: item.selected_customizations || null,
        selected_customizations_text: item.selected_customizations_text || null,
        special_instructions: item.special_instructions || null,
      })),
      p_delivery_address_text: input.delivery_address_text,
      p_address_id: isValidUUID(input.address_id) ? input.address_id : null,
      p_delivery_mode: input.delivery_mode || "DELIVERY",
      p_payment_method: input.payment_method || "CASH",
      p_notes: input.notes || null,
      p_prescription_storage_path: input.prescription_storage_path || null,
      p_is_package_delivery: input.is_package_delivery || false,
      p_package_details: input.package_details || null,
      p_promo_code: input.promo_code || null,
      p_customer_name: user?.name || null,
      p_customer_phone: user?.phone || null,
    };

    const { data: orderData, error: rpcError } = await (supabase as any).rpc(
      "rpc_create_order",
      rpcPayload,
    );

    if (rpcError) {
      console.error("[orderService] rpc_create_order error:", rpcError);
      throw new Error(
        rpcError.message || "Erreur lors de la création de la commande.",
      );
    }

    const { data: itemsData } = await (supabase as any)
      .from("order_items")
      .select("*")
      .eq("order_id", orderData.id);

    const createdOrder = _mapDbOrder(orderData, itemsData || []);

    loadOrdersFromStorage();
    SHARED_ORDERS.unshift(createdOrder);
    saveOrdersToStorage();
    cartService.clearCart();
    notify();

    return createdOrder;
  },

  async getClientOrders(userId?: string): Promise<Order[]> {
    try {
      const session = await authService.getSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = userId || user?.id || session?.user?.id;
      loadOrdersFromStorage(uid);

      let query = (supabase as any)
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (uid && isValidUUID(uid)) {
        query = query.eq("user_id", uid);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbOrders = data.map((o: any) =>
          _mapDbOrder(o, o.order_items || []),
        );
        // Merge with in-memory orders (avoiding duplicates)
        _mergeOrders(dbOrders);
      }
    } catch (err) {
      console.warn(
        "[orderService] getClientOrders Supabase fetch warning:",
        err,
      );
    }

    return [...SHARED_ORDERS];
  },

  getPastOrderCount(): number {
    loadOrdersFromStorage();
    return SHARED_ORDERS.filter((o) => o.status !== "CANCELLED").length;
  },

  async getAllOrdersAdmin(
    statusFilter?: OrderStatus | "ALL",
  ): Promise<Order[]> {
    loadOrdersFromStorage();
    try {
      let query = (supabase as any)
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const dbOrders = data.map((o: any) =>
          _mapDbOrder(o, o.order_items || []),
        );
        _mergeOrders(dbOrders);
      }
    } catch (err) {
      console.warn(
        "[orderService] getAllOrdersAdmin Supabase fetch warning:",
        err,
      );
    }

    if (!statusFilter || statusFilter === "ALL") {
      return [...SHARED_ORDERS];
    }
    return SHARED_ORDERS.filter((o) => o.status === statusFilter);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const memoryOrder = SHARED_ORDERS.find(
      (o) => o.id === id || o.order_number === id,
    );
    if (memoryOrder) return memoryOrder;

    try {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*, order_items(*)")
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && data) {
        return _mapDbOrder(data, data.order_items || []);
      }
    } catch {}

    return undefined;
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<Order> {
    try {
      const { data, error } = await (supabase.rpc as any)(
        "rpc_update_order_status",
        {
          p_order_id: orderId,
          p_new_status: newStatus,
        },
      );
      if (!error && data) {
        const updated = _mapDbOrder(data, data.order_items || []);
        const idx = SHARED_ORDERS.findIndex(
          (o) => o.id === orderId || o.order_number === orderId,
        );
        if (idx !== -1)
          SHARED_ORDERS[idx] = { ...SHARED_ORDERS[idx], ...updated };
        notify();
        return updated;
      }
    } catch {}

    const order = SHARED_ORDERS.find(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (order) {
      order.status = newStatus;
      order.updated_at = new Date().toISOString();
      if (newStatus === "DELIVERED") {
        order.estimated_delivery_minutes = 0;
      }
      notify();
    }

    try {
      const updates: any = { status: newStatus };
      if (newStatus === "DELIVERED") updates.estimated_delivery_minutes = 0;

      await (supabase as any).from("orders").update(updates).eq("id", orderId);
    } catch {}

    if (!order) throw new Error("Commande non trouvée");
    return order;
  },

  async claimOrder(orderId: string): Promise<Order> {
    const { data, error } = await (supabase.rpc as any)("rpc_claim_order", {
      p_order_id: orderId,
    });

    if (error) {
      throw new Error(
        error.message || "Impossible de prendre en charge cette commande.",
      );
    }

    const claimedOrder = _mapDbOrder(data, data.order_items || []);
    const idx = SHARED_ORDERS.findIndex(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (idx !== -1) {
      SHARED_ORDERS[idx] = { ...SHARED_ORDERS[idx], ...claimedOrder };
    } else {
      SHARED_ORDERS.unshift(claimedOrder);
    }
    notify();
    return claimedOrder;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const { data, error } = await (supabase.rpc as any)("rpc_cancel_order", {
        p_order_id: orderId,
        p_reason: reason || null,
      });
      if (!error && data) {
        const cancelled = _mapDbOrder(data, data.order_items || []);
        const idx = SHARED_ORDERS.findIndex(
          (o) => o.id === orderId || o.order_number === orderId,
        );
        if (idx !== -1)
          SHARED_ORDERS[idx] = { ...SHARED_ORDERS[idx], ...cancelled };
        notify();
        return cancelled;
      }
    } catch {}

    const order = SHARED_ORDERS.find(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (order) {
      order.status = "CANCELLED";
      if (reason) {
        order.notes = order.notes
          ? `${order.notes} | [Annulée: ${reason}]`
          : `[Annulée: ${reason}]`;
      }
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from("orders")
        .update({ status: "CANCELLED" })
        .eq("id", orderId);
    } catch {}

    if (!order) throw new Error("Impossible d'annuler la commande");
    return order;
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<Order> {
    const order = SHARED_ORDERS.find(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (order) {
      order.notes = notes;
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from("orders")
        .update({ notes })
        .eq("id", orderId);
    } catch {}

    if (!order) throw new Error("Commande non trouvée");
    return order;
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    SHARED_ORDERS = SHARED_ORDERS.filter(
      (o) => o.id !== orderId && o.order_number !== orderId,
    );
    notify();

    try {
      await (supabase as any).from("orders").delete().eq("id", orderId);
    } catch {}

    return true;
  },

  async assignCourier(
    orderId: string,
    courierId: string,
    courierName?: string,
    courierPhone?: string,
  ): Promise<Order> {
    const { data, error } = await (supabase.rpc as any)("rpc_assign_courier", {
      p_order_id: orderId,
      p_courier_id: courierId,
    });

    if (error) {
      console.error("[orderService] rpc_assign_courier error:", error);
      throw new Error(error.message || "Impossible d'assigner le coursier");
    }

    const { data: itemsData } = await (supabase as any)
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    const assigned = _mapDbOrder(data, itemsData || []);
    const idx = SHARED_ORDERS.findIndex(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (idx !== -1) {
      SHARED_ORDERS[idx] = { ...SHARED_ORDERS[idx], ...assigned };
    } else {
      SHARED_ORDERS.unshift(assigned);
    }
    notify();
    return assigned;
  },

  async rateOrder(
    orderId: string,
    rating: number,
    reviewText?: string,
  ): Promise<Order> {
    const order = SHARED_ORDERS.find(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (order) {
      order.rating = rating;
      order.review_text = reviewText;
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from("orders")
        .update({ rating, review_text: reviewText || null })
        .eq("id", orderId);
    } catch {}

    if (!order) throw new Error("Commande non trouvée");
    return order;
  },

  async rateCourier(
    orderId: string,
    rating: number,
    reviewText?: string,
    tags?: string[],
  ): Promise<Order> {
    const order = SHARED_ORDERS.find(
      (o) => o.id === orderId || o.order_number === orderId,
    );
    if (order) {
      order.courier_rating = rating;
      order.courier_review_text = reviewText;
      order.courier_tags = tags;
      order.updated_at = new Date().toISOString();
      notify();
    }

    try {
      await (supabase as any)
        .from("orders")
        .update({
          courier_rating: rating,
          courier_review_text: reviewText || null,
        })
        .eq("id", orderId);
    } catch {}

    if (!order) throw new Error("Commande non trouvée");
    return order;
  },

  async reorder(order: Order): Promise<void> {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach((item) => {
      cartService.addItem(
        {
          id: item.product_id,
          name: item.product_name,
          description: "Recommandé",
          price: item.unit_price,
          is_available: true,
        },
        item.quantity,
        undefined,
        item.special_instructions,
      );
    });
  },

  updateOrderCourierPosition(
    orderId: string,
    courier_lat: number,
    courier_lng: number,
  ) {
    const order = SHARED_ORDERS.find((o) => o.id === orderId);
    if (order) {
      order.courier_lat = courier_lat;
      order.courier_lng = courier_lng;
      notify();
    }
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
  SHARED_ORDERS.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function _mapDbOrder(row: any, items: any[]): Order {
  let prescriptionUrl = row.prescription_image_url || undefined;
  let cleanNotes = row.notes || undefined;
  if (
    !prescriptionUrl &&
    cleanNotes &&
    cleanNotes.includes("[ORDONNANCE_IMG:")
  ) {
    const match = cleanNotes.match(/\[ORDONNANCE_IMG:(.*?)\]/);
    if (match && match[1]) {
      prescriptionUrl = match[1];
      cleanNotes =
        cleanNotes.replace(/\[ORDONNANCE_IMG:.*?\]/, "").trim() || undefined;
    }
  }

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
    delivery_mode: (row.delivery_mode as "DELIVERY" | "PICKUP") || "DELIVERY",
    total: Number(row.total),
    payment_method: row.payment_method,
    notes: cleanNotes,
    prescription_image_url: prescriptionUrl,
    estimated_delivery_minutes: row.estimated_delivery_minutes ?? 25,
    rating: row.rating || undefined,
    review_text: row.review_text || undefined,
    driver_name: row.driver_name || undefined,
    driver_phone: row.driver_phone || undefined,
    driver_id: row.driver_id || undefined,
    courier_rating: row.courier_rating || undefined,
    courier_review_text: row.courier_review_text || undefined,
    courier_tags: row.courier_tags || undefined,
    delivery_lat: Number(row.delivery_lat) || 34.6867,
    delivery_lng: Number(row.delivery_lng) || -1.9114,
    courier_lat: Number(row.courier_lat) || 34.688,
    courier_lng: Number(row.courier_lng) || -1.913,
    restaurant_lat: Number(row.restaurant_lat) || 34.689,
    restaurant_lng: Number(row.restaurant_lng) || -1.915,
    items: items.map((oi: any) => ({
      id: oi.id,
      order_id: oi.order_id,
      product_id: oi.product_id,
      product_name: oi.product_name,
      quantity: Number(oi.quantity),
      unit_price: Number(oi.unit_price),
      total_price: Number(oi.total_price),
      selected_customizations_text:
        oi.selected_customizations_text || undefined,
      special_instructions: oi.special_instructions || undefined,
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
