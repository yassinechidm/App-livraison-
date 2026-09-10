-- ==============================================================================
-- QUICKLY LIVRAISON — SECURE USER ROLES & RLS POLICIES (PHASE 2)
-- Migration File: supabase/migrations/20260910000001_secure_roles_and_rls.sql
-- Description: Hardens Row Level Security, installs privilege-escalation triggers,
--              atomic courier claiming RPCs, and storage bucket access rules.
-- ==============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_authenticated_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT LOWER(role::text) FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

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
      AND LOWER(role::text) = 'admin'
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
      AND LOWER(role::text) IN ('delivery', 'courier', 'driver')
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

-- 2. PRIVILEGE-ESCALATION PREVENTION TRIGGER
-- Prevents clients from updating their own 'role' column via direct client requests
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed, ensure the executing user is an admin or service_role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() AND (current_setting('request.jwt.claim.role', true) <> 'service_role') THEN
      RAISE EXCEPTION 'Privilege Escalation Blocked: You are not authorized to modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- 3. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ATOMIC STORED PROCEDURES (RPCs) FOR CRITICAL MUTATIONS

-- 4.1 Courier Atomic Order Claiming RPC
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
    RAISE EXCEPTION 'Unauthorized: Only delivery drivers or administrators can claim orders.';
  END IF;

  v_courier_id := public.get_courier_id();
  IF v_courier_id IS NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Courier record not found for the active delivery account.';
  END IF;

  -- Atomic claim with lock & status verification
  UPDATE public.orders
  SET courier_id = COALESCE(v_courier_id, courier_id),
      status = 'OUT_FOR_DELIVERY'::public.order_status,
      updated_at = NOW()
  WHERE id = p_order_id
    AND (courier_id IS NULL OR courier_id = v_courier_id)
    AND status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY')
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order cannot be claimed (it is already claimed or in an invalid status).';
  END IF;

  -- Increment active orders counter for courier if exists
  IF v_courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = active_orders_count + 1
    WHERE id = v_courier_id;
  END IF;

  RETURN v_order;
END;
$$;

-- 4.2 Order Status Transition RPC
CREATE OR REPLACE FUNCTION public.rpc_update_order_status(
  p_order_id UUID,
  p_new_status public.order_status
)
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

  -- Terminal state protection: DELIVERED or CANCELLED orders cannot be modified
  IF v_order.status IN ('DELIVERED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot change status of an order that is already %.', v_order.status;
  END IF;

  -- Authorization check
  IF NOT public.is_admin() THEN
    IF NOT public.is_delivery() OR v_order.courier_id IS DISTINCT FROM v_courier_id THEN
      RAISE EXCEPTION 'Unauthorized: You are not assigned to this order.';
    END IF;
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = NOW(),
      estimated_delivery_minutes = CASE WHEN p_new_status = 'DELIVERED' THEN 0 ELSE estimated_delivery_minutes END
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- Decrement courier active count upon delivery
  IF p_new_status = 'DELIVERED' AND v_order.courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = GREATEST(0, active_orders_count - 1)
    WHERE id = v_order.courier_id;
  END IF;

  RETURN v_order;
END;
$$;

-- 4.3 Order Cancellation RPC
CREATE OR REPLACE FUNCTION public.rpc_cancel_order(
  p_order_id UUID,
  p_reason TEXT DEFAULT NULL
)
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

  -- Only the ordering client or an admin can cancel
  IF v_order.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this order.';
  END IF;

  -- Clients cannot cancel if already out for delivery or delivered
  IF NOT public.is_admin() AND v_order.status IN ('OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot cancel an order that is %.', v_order.status;
  END IF;

  UPDATE public.orders
  SET status = 'CANCELLED'::public.order_status,
      notes = CASE 
                WHEN p_reason IS NOT NULL AND p_reason <> '' THEN COALESCE(notes || ' | ', '') || '[Annulée: ' || p_reason || ']'
                ELSE notes 
              END,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF v_order.courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = GREATEST(0, active_orders_count - 1)
    WHERE id = v_order.courier_id;
  END IF;

  RETURN v_order;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES AUDIT & ENFORCEMENT

-- 5.1 Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_full_access" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE USING (public.is_admin());

-- 5.2 Couriers Table
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "couriers_select_policy" ON public.couriers;
DROP POLICY IF EXISTS "couriers_insert_policy" ON public.couriers;
DROP POLICY IF EXISTS "couriers_update_policy" ON public.couriers;
DROP POLICY IF EXISTS "couriers_delete_policy" ON public.couriers;
DROP POLICY IF EXISTS "couriers_full_access" ON public.couriers;
DROP POLICY IF EXISTS "Anyone can view couriers" ON public.couriers;
DROP POLICY IF EXISTS "Admins can manage couriers" ON public.couriers;

-- Couriers can view own record, Admin can view all, and Clients can view courier assigned to their active order
CREATE POLICY "couriers_select_policy" ON public.couriers
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.courier_id = public.couriers.id
      AND o.user_id = auth.uid()
      AND o.status IN ('OUT_FOR_DELIVERY', 'DELIVERED')
  )
);

CREATE POLICY "couriers_insert_policy" ON public.couriers
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "couriers_update_policy" ON public.couriers
FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "couriers_delete_policy" ON public.couriers
FOR DELETE USING (public.is_admin());

-- 5.3 Addresses Table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addresses_select_policy" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_policy" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_policy" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_policy" ON public.addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "addresses_select" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete" ON public.addresses;

CREATE POLICY "addresses_select_policy" ON public.addresses
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_insert_policy" ON public.addresses
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_update_policy" ON public.addresses
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "addresses_delete_policy" ON public.addresses
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 5.4 Categories Table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_write_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "categories_select_policy" ON public.categories
FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "categories_insert_policy" ON public.categories
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "categories_update_policy" ON public.categories
FOR UPDATE USING (public.is_admin());

CREATE POLICY "categories_delete_policy" ON public.categories
FOR DELETE USING (public.is_admin());

-- 5.5 Products Table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "products_select_policy" ON public.products
FOR SELECT USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE USING (public.is_admin());

CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE USING (public.is_admin());

-- 5.6 Restaurants & Menu Items Tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_write_policy" ON public.restaurants;
DROP POLICY IF EXISTS "menu_items_select_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_write_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can view menu items" ON restaurant_menu_items;
DROP POLICY IF EXISTS "Admin can manage restaurants" ON restaurants;
DROP POLICY IF EXISTS "Admin can manage menu items" ON restaurant_menu_items;

CREATE POLICY "restaurants_select_policy" ON public.restaurants
FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "restaurants_write_policy" ON public.restaurants
FOR ALL USING (public.is_admin());

CREATE POLICY "menu_items_select_policy" ON public.restaurant_menu_items
FOR SELECT USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "menu_items_write_policy" ON public.restaurant_menu_items
FOR ALL USING (public.is_admin());

-- 5.7 Promo Codes Table
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_select_policy" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_write_policy" ON public.promo_codes;
DROP POLICY IF EXISTS "promo_codes_full_access" ON public.promo_codes;
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;

CREATE POLICY "promo_codes_select_policy" ON public.promo_codes
FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "promo_codes_write_policy" ON public.promo_codes
FOR ALL USING (public.is_admin());

-- 5.8 Orders Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_full_access" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view and manage all orders" ON orders;

CREATE POLICY "orders_select_policy" ON public.orders
FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_admin() 
  OR (
    public.is_delivery() 
    AND (
      (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') AND courier_id IS NULL)
      OR courier_id = public.get_courier_id()
    )
  )
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

-- 5.9 Order Items Table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_full_access" ON public.order_items;
DROP POLICY IF EXISTS "Users can view items of their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "order_items_select_policy" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        o.user_id = auth.uid() 
        OR public.is_admin() 
        OR (
          public.is_delivery() 
          AND (
            (o.status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') AND o.courier_id IS NULL)
            OR o.courier_id = public.get_courier_id()
          )
        )
      )
  )
);

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "order_items_update_policy" ON public.order_items
FOR UPDATE USING (public.is_admin());

CREATE POLICY "order_items_delete_policy" ON public.order_items
FOR DELETE USING (public.is_admin());

-- 5.10 Storage Objects Table (Prescriptions Bucket)
DROP POLICY IF EXISTS "prescriptions_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "prescriptions_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "prescriptions_delete_policy" ON storage.objects;

CREATE POLICY "prescriptions_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'prescriptions'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.prescription_storage_path = name
        AND (
          o.user_id = auth.uid()
          OR (public.is_delivery() AND o.courier_id = public.get_courier_id())
        )
    )
  )
);

CREATE POLICY "prescriptions_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'prescriptions'
  AND (auth.role() = 'authenticated' OR public.is_admin())
);

CREATE POLICY "prescriptions_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'prescriptions'
  AND public.is_admin()
);

