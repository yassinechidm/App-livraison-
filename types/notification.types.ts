// ==============================================================================
// QUICKLY LIVRAISON — NOTIFICATION TYPES DEFINITIONS
// Path: types/notification.types.ts
// ==============================================================================

export type NotificationType =
  | "NEW_ORDER"
  | "ORDER_ASSIGNED"
  | "ORDER_STATUS_CHANGED"
  | "DELIVERY_CANCELLED"
  | "SYSTEM_ALERT";

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  order_id?: string | null;
  order_number?: string | null;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface UserPushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform?: "ios" | "android" | "web" | null;
  device_name?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  badge?: number;
}

