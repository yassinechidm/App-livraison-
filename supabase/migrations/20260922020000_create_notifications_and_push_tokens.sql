-- ==============================================================================
-- QUICKLY LIVRAISON — PRODUCTION NOTIFICATION SYSTEM & PUSH TOKEN INFRASTRUCTURE
-- File: supabase/migrations/20260922020000_create_notifications_and_push_tokens.sql
-- Description: Creates notification tables, token registries, hardened RLS policies,
--              server-side deduplication triggers, 30-day cleanup, and realtime publications.
-- ==============================================================================

BEGIN;

-- 1. NOTIFICATION TYPE ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM (
      'NEW_ORDER',
      'ORDER_ASSIGNED',
      'ORDER_STATUS_CHANGED',
      'DELIVERY_CANCELLED',
      'SYSTEM_ALERT'
    );
  END IF;
END $$;


-- 2. USER PUSH TOKENS TABLE (Device Registration)
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_device_token UNIQUE (user_id, expo_push_token)
);

-- Indexes for fast token lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_lookup 
  ON public.user_push_tokens(user_id, is_active) 
  WHERE is_active = TRUE;


-- 3. IN-APP NOTIFICATIONS TABLE (Persistent Notification Center)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'SYSTEM_ALERT',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite indexes for high-frequency unread badges and reverse-chronological feeds
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications(user_id, created_at DESC);


-- 4. HARDENED ROW LEVEL SECURITY (RLS) POLICIES

-- 4.1 user_push_tokens RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can update own push tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.user_push_tokens;

CREATE POLICY "Users can view own push tokens" ON public.user_push_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push tokens" ON public.user_push_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push tokens" ON public.user_push_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push tokens" ON public.user_push_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 4.2 notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notification read state" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Block direct notification insertion" ON public.notifications;

-- Strict Isolation: users can ONLY query and see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Read status update: users can only mark their own notifications as read
CREATE POLICY "Users can update own notification read state" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Table Grants: Revoke INSERT from anon & authenticated (Reserved strictly for triggers/service role)
REVOKE INSERT ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

REVOKE ALL ON TABLE public.user_push_tokens FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_push_tokens TO authenticated;
GRANT ALL ON TABLE public.user_push_tokens TO service_role;


-- 5. IDEMPOTENT SERVER-SIDE NOTIFICATION TRIGGER FUNCTION

CREATE OR REPLACE FUNCTION public.handle_order_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_courier_user_id UUID;
  v_title TEXT;
  v_body TEXT;
BEGIN
  -- ---------------------------------------------------------------------------
  -- EVENT 1: NEW ORDER CREATED (Notify all active Admins)
  -- ---------------------------------------------------------------------------
  IF (TG_OP = 'INSERT') THEN
    v_title := 'Nouvelle commande #' || COALESCE(NEW.order_number, 'CMD');
    v_body := 'Une nouvelle commande de ' || COALESCE(NEW.total::text, '0') || ' DH vient d''arriver.';

    FOR v_admin IN 
      SELECT id FROM public.profiles WHERE role = 'admin'
    LOOP
      -- Idempotency check: ensure this admin has not already received this notification
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = v_admin.id 
          AND order_id = NEW.id 
          AND type = 'NEW_ORDER'
      ) THEN
        INSERT INTO public.notifications (
          user_id,
          title,
          body,
          type,
          order_id,
          order_number,
          data
        ) VALUES (
          v_admin.id,
          v_title,
          v_body,
          'NEW_ORDER',
          NEW.id,
          NEW.order_number,
          jsonb_build_object(
            'orderId', NEW.id,
            'orderNumber', NEW.order_number,
            'total', NEW.total,
            'deliveryMode', NEW.delivery_mode,
            'paymentMethod', NEW.payment_method
          )
        );
      END IF;
    END LOOP;

    RETURN NEW;
  END IF;

  -- ---------------------------------------------------------------------------
  -- EVENT 2: COURIER ASSIGNED (Notify the specific assigned Courier ONLY)
  -- ---------------------------------------------------------------------------
  IF (TG_OP = 'UPDATE' AND NEW.courier_id IS NOT NULL AND (OLD.courier_id IS NULL OR OLD.courier_id IS DISTINCT FROM NEW.courier_id)) THEN
    -- Look up the courier's linked auth/profile user_id
    SELECT user_id INTO v_courier_user_id 
    FROM public.couriers 
    WHERE id = NEW.courier_id;

    IF v_courier_user_id IS NOT NULL THEN
      v_title := 'Nouvelle livraison assignée';
      v_body := 'La commande #' || COALESCE(NEW.order_number, 'CMD') || ' vous a été confiée.';

      -- Idempotency check: prevent duplicate assignment alerts for the same courier
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = v_courier_user_id 
          AND order_id = NEW.id 
          AND type = 'ORDER_ASSIGNED'
      ) THEN
        INSERT INTO public.notifications (
          user_id,
          title,
          body,
          type,
          order_id,
          order_number,
          data
        ) VALUES (
          v_courier_user_id,
          v_title,
          v_body,
          'ORDER_ASSIGNED',
          NEW.id,
          NEW.order_number,
          jsonb_build_object(
            'orderId', NEW.id,
            'orderNumber', NEW.order_number,
            'total', NEW.total,
            'deliveryAddress', NEW.delivery_address_text
          )
        );
      END IF;
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- EVENT 3: ORDER STATUS CHANGED (Notify Customer)
  -- ---------------------------------------------------------------------------
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NEW.user_id IS NOT NULL THEN
      v_title := 'Statut de votre commande';
      IF NEW.status = 'PREPARING' THEN
        v_body := 'Votre commande #' || COALESCE(NEW.order_number, '') || ' est en cours de préparation.';
      ELSIF NEW.status = 'READY' THEN
        v_body := 'Votre commande #' || COALESCE(NEW.order_number, '') || ' est prête pour livraison.';
      ELSIF NEW.status = 'OUT_FOR_DELIVERY' THEN
        v_body := 'Votre livreur est en route avec votre commande #' || COALESCE(NEW.order_number, '') || ' !';
      ELSIF NEW.status = 'DELIVERED' THEN
        v_body := 'Votre commande #' || COALESCE(NEW.order_number, '') || ' a été livrée avec succès.';
      ELSIF NEW.status = 'CANCELLED' THEN
        v_body := 'Votre commande #' || COALESCE(NEW.order_number, '') || ' a été annulée.';
      ELSE
        v_body := 'Votre commande #' || COALESCE(NEW.order_number, '') || ' a été mise à jour.';
      END IF;

      INSERT INTO public.notifications (
        user_id,
        title,
        body,
        type,
        order_id,
        order_number,
        data
      ) VALUES (
        NEW.user_id,
        v_title,
        v_body,
        'ORDER_STATUS_CHANGED',
        NEW.id,
        NEW.order_number,
        jsonb_build_object(
          'orderId', NEW.id,
          'orderNumber', NEW.order_number,
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger cleanly on public.orders
DROP TRIGGER IF EXISTS trg_orders_notifications ON public.orders;

CREATE TRIGGER trg_orders_notifications
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_notifications();


-- 6. 30-DAY RETENTION CLEANUP FUNCTION
CREATE OR REPLACE FUNCTION public.cleanup_old_read_notifications()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.notifications
  WHERE is_read = TRUE
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


-- 7. REALTIME PUBLICATION CONFIGURATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMIT;

-- 8. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

