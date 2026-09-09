import { supabase } from "@/lib/supabase";
import { orderService } from "@/services/order.service";
import * as Location from "expo-location";

export interface LiveLocationUpdate {
  order_id: string;
  courier_lat: number;
  courier_lng: number;
  updated_at: string;
}

export type LiveLocationListener = (update: LiveLocationUpdate) => void;

// Active listeners per order
const orderListenersMap = new Map<string, Set<LiveLocationListener>>();
// Global listeners (for Admin)
const globalListeners = new Set<LiveLocationListener>();

// Location watcher subscription reference
let locationWatchSub: Location.LocationSubscription | null = null;
let activeTrackingOrderId: string | null = null;

export const liveLocationService = {
  /**
   * Default Oujda coordinates reference points
   */
  OUJDA_CENTER: { latitude: 34.6867, longitude: -1.9114 },
  RESTAURANT_DEFAULT: { latitude: 34.689, longitude: -1.915 },

  /**
   * Start tracking courier GPS and stream updates to Supabase + listeners
   */
  async startCourierTracking(orderId: string): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn(
          "[liveLocationService] Permission denied for GPS tracking",
        );
        return false;
      }

      // Stop existing watcher if any
      this.stopCourierTracking();
      activeTrackingOrderId = orderId;

      // Start watcher with balanced accuracy for smooth battery & updates
      locationWatchSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000, // Update every 4 seconds
          distanceInterval: 5, // Move at least 5 meters
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          this.updateOrderCourierLocation(orderId, latitude, longitude);
        },
      );

      return true;
    } catch (err) {
      console.warn(
        "[liveLocationService] Failed to start courier tracking:",
        err,
      );
      return false;
    }
  },

  /**
   * Stop active courier tracking
   */
  stopCourierTracking() {
    if (locationWatchSub) {
      locationWatchSub.remove();
      locationWatchSub = null;
    }
    activeTrackingOrderId = null;
  },

  /**
   * Update courier position for a given order
   */
  async updateOrderCourierLocation(
    orderId: string,
    courier_lat: number,
    courier_lng: number,
  ): Promise<void> {
    const update: LiveLocationUpdate = {
      order_id: orderId,
      courier_lat,
      courier_lng,
      updated_at: new Date().toISOString(),
    };

    // 1. Notify local subscribers (Client & Admin in same process / memory)
    const listeners = orderListenersMap.get(orderId);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(update);
        } catch {}
      });
    }
    globalListeners.forEach((fn) => {
      try {
        fn(update);
      } catch {}
    });

    // 2. Persist in memory store via orderService
    orderService.updateOrderCourierPosition(orderId, courier_lat, courier_lng);

    // 3. Broadcast to Supabase DB / Realtime channel
    try {
      await (supabase as any)
        .from("orders")
        .update({
          courier_lat,
          courier_lng,
          updated_at: update.updated_at,
        })
        .eq("id", orderId);
    } catch (err) {
      console.warn("[liveLocationService] DB update warning:", err);
    }
  },

  /**
   * Subscribe to live location updates for a specific order (Client view)
   */
  subscribeToOrderLocation(
    orderId: string,
    listener: LiveLocationListener,
  ): () => void {
    if (!orderListenersMap.has(orderId)) {
      orderListenersMap.set(orderId, new Set());
    }
    const set = orderListenersMap.get(orderId)!;
    set.add(listener);

    // Supabase Realtime channel subscription for multi-device sync
    let channel: any = null;
    try {
      channel = supabase
        .channel(`order_location_${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload: any) => {
            if (payload.new?.courier_lat && payload.new?.courier_lng) {
              const update: LiveLocationUpdate = {
                order_id: orderId,
                courier_lat: payload.new.courier_lat,
                courier_lng: payload.new.courier_lng,
                updated_at: payload.new.updated_at || new Date().toISOString(),
              };
              listener(update);
            }
          },
        )
        .subscribe();
    } catch {}

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        orderListenersMap.delete(orderId);
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  },

  /**
   * Subscribe to all active location updates (Admin View)
   */
  subscribeToAllActiveLocations(listener: LiveLocationListener): () => void {
    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  },

  /**
   * Calculate distance between two GPS coordinates in Kilometers (Haversine Formula)
   */
  calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
  },

  /**
   * Estimate ETA in minutes from distance (assuming average city delivery speed ~25 km/h)
   */
  calculateEtaMinutes(distanceKm: number): number {
    if (distanceKm <= 0.2) return 2;
    const minutes = Math.ceil((distanceKm / 25) * 60) + 3; // +3 min buffer
    return Math.max(3, minutes);
  },
};
