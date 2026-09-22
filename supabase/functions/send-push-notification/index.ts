// ==============================================================================
// QUICKLY LIVRAISON — SUPABASE EDGE FUNCTION: SEND PUSH NOTIFICATION
// Path: supabase/functions/send-push-notification/index.ts
// Description: Triggered via Database Webhook on INSERT into public.notifications.
//              Dispatches push notifications through Expo Push API with ticket handling.
// ==============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookRecord {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  order_id: string | null;
  order_number: string | null;
  data: Record<string, any>;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "notifications";
  schema: "public";
  record: WebhookRecord;
  old_record: WebhookRecord | null;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload: WebhookPayload = await req.json();

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(
        JSON.stringify({ message: "Ignored non-insert event" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const record = payload.record;
    const userId = record.user_id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user_id in record" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error(
        "[send-push-notification] Missing Supabase environment credentials",
      );
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Fetch all active Expo push tokens for the recipient user
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from("user_push_tokens")
      .select("id, expo_push_token, platform")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (tokensError) {
      console.error(
        "[send-push-notification] Error querying user push tokens:",
        tokensError,
      );
      return new Response(JSON.stringify({ error: tokensError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!tokens || tokens.length === 0) {
      console.log(
        `[send-push-notification] No active push tokens for user ${userId}. In-app notification persisted.`,
      );
      return new Response(
        JSON.stringify({ message: "No active push tokens for user" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 2. Build Expo Push Payloads
    const pushMessages = tokens.map((t) => ({
      to: t.expo_push_token,
      title: record.title,
      body: record.body,
      data: {
        notificationId: record.id,
        orderId: record.order_id,
        orderNumber: record.order_number,
        type: record.type,
        ...(record.data || {}),
      },
      sound: "default",
      channelId: "orders_high_importance",
      priority: "high",
    }));

    // 3. Dispatch to Expo Push Service
    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(pushMessages),
    });

    const expoData = await expoResponse.json();
    const tickets = expoData.data || [];

    // 4. Ticket Inspection & Token Health Lifecycle
    const tokensToDeactivate: string[] = [];

    tickets.forEach((ticket: any, idx: number) => {
      const currentToken = tokens[idx];
      if (ticket.status === "error") {
        console.warn(
          `[send-push-notification] Ticket error for token ${currentToken.expo_push_token}:`,
          ticket.message,
          ticket.details,
        );

        if (ticket.details?.error === "DeviceNotRegistered") {
          // Token is dead / uninstalled — deactivate it
          tokensToDeactivate.push(currentToken.id);
        } else if (ticket.details?.error === "InvalidCredentials") {
          // Push credential misconfiguration — do NOT deactivate device token
          console.error(
            "[send-push-notification] Push credentials configuration error in Expo project!",
          );
        }
      }
    });

    // Deactivate invalid tokens if any
    if (tokensToDeactivate.length > 0) {
      await supabaseAdmin
        .from("user_push_tokens")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", tokensToDeactivate);

      console.log(
        `[send-push-notification] Deactivated ${tokensToDeactivate.length} invalid push tokens.`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        dispatched: pushMessages.length,
        tickets,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("[send-push-notification] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
