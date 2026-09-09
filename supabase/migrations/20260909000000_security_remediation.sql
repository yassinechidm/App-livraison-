-- Supabase Security Remediation Migration
-- File: supabase/migrations/20260909000000_security_remediation.sql

-- 1. ENUM MIGRATION & PROFILES ROLE NORMALIZATION
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = 'public.user_role'::regtype) THEN
        ALTER TYPE public.user_role ADD VALUE 'client';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'public.user_role'::regtype) THEN
        ALTER TYPE public.user_role ADD VALUE 'admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'delivery' AND enumtypid = 'public.user_role'::regtype) THEN
        ALTER TYPE public.user_role ADD VALUE 'delivery';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        CREATE TYPE public.user_role AS ENUM ('client', 'admin', 'delivery');
END $$;

UPDATE public.profiles SET role = LOWER(role::text)::public.user_role WHERE role::text IN ('CLIENT', 'ADMIN');
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client'::public.user_role;

-- 2. FOREIGN KEYS AND COLUMNS
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_courier_id_fkey' AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_courier_id_fkey
        FOREIGN KEY (courier_id) REFERENCES public.couriers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_delivery()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text = 'delivery'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_courier_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.couriers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.touch_order_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET updated_at = NOW()
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_touch_order_updated_at ON public.order_items;
CREATE TRIGGER trigger_touch_order_updated_at
AFTER INSERT OR UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.touch_order_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) HARDENING

-- 4.1 Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (public.is_admin());

-- 4.2 Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_admin() 
  OR (public.is_delivery() AND (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') OR courier_id = public.get_courier_id()))
);

CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "orders_update_policy" ON public.orders
FOR UPDATE USING (
  public.is_admin() 
  OR (public.is_delivery() AND courier_id = public.get_courier_id())
);

CREATE POLICY "orders_delete_policy" ON public.orders
FOR DELETE USING (public.is_admin());

-- 4.3 Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients view order items" ON public.order_items;
DROP POLICY IF EXISTS "Clients insert order items" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;

CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (
        o.user_id = auth.uid() 
        OR public.is_admin() 
        OR (public.is_delivery() AND (o.status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') OR o.courier_id = public.get_courier_id()))
      )
  )
);

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "order_items_update_policy" ON public.order_items
FOR UPDATE USING (public.is_admin());

CREATE POLICY "order_items_delete_policy" ON public.order_items
FOR DELETE USING (public.is_admin());

-- 4.4 Restaurants & Menu Items
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Restaurants viewable by everyone" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurants manageable by admin" ON public.restaurants;
DROP POLICY IF EXISTS "Menu items viewable by everyone" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Menu items manageable by admin" ON public.restaurant_menu_items;

CREATE POLICY "restaurants_select_policy" ON public.restaurants
FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "restaurants_write_policy" ON public.restaurants
FOR ALL USING (public.is_admin());

CREATE POLICY "menu_items_select_policy" ON public.restaurant_menu_items
FOR SELECT USING (is_available = true OR public.is_admin());

CREATE POLICY "menu_items_write_policy" ON public.restaurant_menu_items
FOR ALL USING (public.is_admin());

-- 4.5 Couriers
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Couriers viewable by self and admin" ON public.couriers;
DROP POLICY IF EXISTS "Couriers manageable by admin" ON public.couriers;

CREATE POLICY "couriers_select_policy" ON public.couriers
FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "couriers_write_policy" ON public.couriers
FOR ALL USING (public.is_admin());

-- 4.6 Promo Codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes viewable by users" ON public.promo_codes;
DROP POLICY IF EXISTS "Promo codes manageable by admin" ON public.promo_codes;

CREATE POLICY "promo_codes_select_policy" ON public.promo_codes
FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "promo_codes_write_policy" ON public.promo_codes
FOR ALL USING (public.is_admin());

-- 5. ATOMIC RPCs FOR CRITICAL MUTATIONS
CREATE OR REPLACE FUNCTION public.rpc_claim_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_courier_id UUID;
  v_order public.orders;
BEGIN
  IF NOT public.is_delivery() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only delivery drivers or admins can claim orders.';
  END IF;

  v_courier_id := public.get_courier_id();
  IF v_courier_id IS NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Courier record not found for active user.';
  END IF;

  UPDATE public.orders
  SET courier_id = COALESCE(v_courier_id, courier_id),
      status = 'OUT_FOR_DELIVERY',
      updated_at = NOW()
  WHERE id = p_order_id
    AND (courier_id IS NULL OR courier_id = v_courier_id)
    AND status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY')
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order cannot be claimed (already claimed or invalid status).';
  END IF;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_cancel_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized to cancel this order.';
  END IF;

  IF v_order.status IN ('DELIVERED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot cancel an order that is already delivered or cancelled.';
  END IF;

  UPDATE public.orders
  SET status = 'CANCELLED',
      notes = CASE 
                WHEN p_reason IS NOT NULL AND p_reason <> '' THEN COALESCE(notes || ' | ', '') || '[Annulée: ' || p_reason || ']'
                ELSE notes 
              END,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_update_order_status(p_order_id UUID, p_new_status public.order_status)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_courier_id UUID;
BEGIN
  v_courier_id := public.get_courier_id();

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF NOT public.is_admin() THEN
    IF NOT public.is_delivery() OR v_order.courier_id <> v_courier_id THEN
      RAISE EXCEPTION 'Unauthorized to update status of this order.';
    END IF;
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = NOW(),
      estimated_delivery_minutes = CASE WHEN p_new_status = 'DELIVERED' THEN 0 ELSE estimated_delivery_minutes END
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

