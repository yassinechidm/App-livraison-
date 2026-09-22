// ==============================================================================
// QUICKLY LIVRAISON — NOTIFICATION & PUSH TOKEN SERVICE
// Path: services/notification.service.ts
// ==============================================================================

import { supabase } from "@/lib/supabase";
import { AppNotification, NotificationType } from "@/types/notification.types";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { authService } from "./auth.service";

// Configure default foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const NOTIFICATION_CHANNELS = {
  ORDERS: "orders_high_importance",
};

let notificationSubscription: any = null;
let responseSubscription: any = null;
let realtimeChannel: any = null;

export const notificationService = {
  /**
   * Configure Android High-Importance Notification Channel
   */
  async setupNotificationChannelsAsync(): Promise<void> {
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync(
          NOTIFICATION_CHANNELS.ORDERS,
          {
            name: "Commandes & Livraisons",
            description:
              "Notifications urgentes pour les nouvelles commandes et livraisons",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0288D1",
            sound: "default",
            enableLights: true,
            enableVibrate: true,
            showBadge: true,
          },
        );
      } catch (err) {
        console.warn(
          "[notificationService] Error setting up Android channels:",
          err,
        );
      }
    }
  },

  /**
   * Request OS permissions and register Expo Push Token in Supabase
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      await this.setupNotificationChannelsAsync();

      if (!Device.isDevice && Platform.OS !== "web") {
        console.log(
          "[notificationService] Push notifications require a physical device.",
        );
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log(
          "[notificationService] Notification permissions not granted.",
        );
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        "9be52026-bd11-4159-b27e-2e0d2b8d9001";

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;

      // Sync token with current authenticated Supabase user
      const session = await authService.getSession();
      const user = session?.user;

      if (user && user.id && token) {
        await this.savePushTokenToDatabase(user.id, token);
      }

      return token;
    } catch (error) {
      console.warn("[notificationService] Push registration warning:", error);
      return null;
    }
  },

  /**
   * Save or reactivate token in user_push_tokens table
   */
  async savePushTokenToDatabase(
    userId: string,
    expoPushToken: string,
  ): Promise<void> {
    try {
      const platform =
        Platform.OS === "ios"
          ? "ios"
          : Platform.OS === "android"
            ? "android"
            : "web";
      const deviceName = Device.modelName || Device.deviceName || "Device";

      const { error } = await (supabase as any).from("user_push_tokens").upsert(
        {
          user_id: userId,
          expo_push_token: expoPushToken,
          platform,
          device_name: deviceName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id, expo_push_token" },
      );

      if (error) {
        console.warn(
          "[notificationService] Error saving token to database:",
          error.message,
        );
      }
    } catch (err) {
      console.warn("[notificationService] Token sync exception:", err);
    }
  },

  /**
   * Deactivate push token on user logout
   */
  async unregisterPushTokenAsync(): Promise<void> {
    try {
      const session = await authService.getSession();
      const user = session?.user;

      if (user && user.id) {
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(
          () => null,
        );
        if (tokenData?.data) {
          await (supabase as any)
            .from("user_push_tokens")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("expo_push_token", tokenData.data);
        }
      }
    } catch (err) {
      console.warn("[notificationService] Unregister token error:", err);
    }
  },

  /**
   * Fetch in-app notifications for authenticated user
   */
  async getNotifications(limit: number = 30): Promise<AppNotification[]> {
    try {
      const session = await authService.getSession();
      const user = session?.user;
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn(
          "[notificationService] Fetch notifications error:",
          error.message,
        );
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        body: row.body,
        type: row.type as NotificationType,
        order_id: row.order_id,
        order_number: row.order_number,
        data: row.data,
        is_read: row.is_read,
        read_at: row.read_at,
        created_at: row.created_at,
      }));
    } catch (err) {
      console.warn("[notificationService] getNotifications exception:", err);
      return [];
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const session = await authService.getSession();
      const user = session?.user;
      if (!user) return 0;

      const { count, error } = await (supabase as any)
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const session = await authService.getSession();
      const user = session?.user;
      if (!user) return false;

      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user.id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const session = await authService.getSession();
      const user = session?.user;
      if (!user) return false;

      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Subscribe to live Realtime notifications for the active user
   */
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: AppNotification) => void,
  ): () => void {
    if (!userId) return () => {};

    if (realtimeChannel) {
      try {
        supabase.removeChannel(realtimeChannel);
      } catch {}
    }

    realtimeChannel = supabase
      .channel(`user_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            onNotification({
              id: payload.new.id,
              user_id: payload.new.user_id,
              title: payload.new.title,
              body: payload.new.body,
              type: payload.new.type as NotificationType,
              order_id: payload.new.order_id,
              order_number: payload.new.order_number,
              data: payload.new.data,
              is_read: payload.new.is_read,
              read_at: payload.new.read_at,
              created_at: payload.new.created_at,
            });
          }
        },
      )
      .subscribe();

    return () => {
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
          realtimeChannel = null;
        } catch {}
      }
    };
  },

  /**
   * Setup push notification response listener for deep-linking
   */
  setupNotificationResponseListener(router: any): () => void {
    if (responseSubscription) {
      responseSubscription.remove();
    }

    responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        try {
          const data = response.notification.request.content.data;
          if (!data) return;

          const type = data.type;
          const orderId = data.orderId;

          if (type === "NEW_ORDER") {
            router.push("/(app)/(admin)/(tabs)/orders" as any);
          } else if (type === "ORDER_ASSIGNED") {
            router.push("/(app)/(delivery)/(tabs)/active" as any);
          } else if (type === "ORDER_STATUS_CHANGED") {
            router.push("/(app)/(client)/(tabs)/orders" as any);
          }
        } catch (e) {
          console.warn("[notificationService] Deep link error:", e);
        }
      });

    return () => {
      if (responseSubscription) {
        responseSubscription.remove();
        responseSubscription = null;
      }
    };
  },
};
