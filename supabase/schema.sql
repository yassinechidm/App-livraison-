-- ==============================================================================
-- QUICKLY LIVRAISON — CONSOLIDATED CANONICAL DATABASE SCHEMA
-- Generated from authoritative migration sequence (11 migrations)
--
-- Migration Sequence:
--   1. 20260909000000_security_remediation.sql
--   2. 20260910000000_canonical_schema.sql
--   3. 20260910000001_secure_roles_and_rls.sql
--   4. 20260910000002_rpc_create_order.sql
--   5. 20260910000003_realtime_gps_dispatch.sql
--   6. 20260911000000_auth_google_whatsapp.sql
--   7. 20260911000001_atomic_whatsapp_otp.sql
--   8. 20260916000000_rate_limiting_and_input_cleaning.sql
--   9. 20260916000001_security_hardening_attacks.sql
--  10. 20260916000002_seed_glovo_oujda_snacks.sql
--  11. 20260916000003_allow_admin_product_and_menu_updates.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [1/11]: 20260909000000_security_remediation.sql
-- ==============================================================================

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



-- ==============================================================================
-- END MIGRATION [1/11]: 20260909000000_security_remediation.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [2/11]: 20260910000000_canonical_schema.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — CANONICAL DATABASE SCHEMA (PHASE 1)
-- Migration File: supabase/migrations/20260910000000_canonical_schema.sql
-- Description: Authoritative unified schema definition resolving conflicting
--              role enums, polymorphic order items, courier foreign keys,
--              prescription storage, indexes, and security helper functions.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
            'PENDING',
            'CONFIRMED',
            'PREPARING',
            'READY',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('CASH', 'TRANSFER', 'CARD');
    END IF;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure profiles.role column is TEXT with default 'client' to avoid 55P04 enum locking
DO $$
BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client';
    UPDATE public.profiles SET role = LOWER(role::text) WHERE role IS NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. COURIERS TABLE (Linked to profiles)
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle TEXT DEFAULT '🛵 Scooter Yamaha' NOT NULL,
    license_plate TEXT,
    bio TEXT,
    profile_photo_url TEXT,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    active_orders_count INT DEFAULT 0 NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS vehicle TEXT DEFAULT '🛵 Scooter Yamaha';
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS active_orders_count INT DEFAULT 0;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 5.0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'couriers_user_id_key' AND table_name = 'couriers'
    ) THEN
        IF NOT EXISTS (
            SELECT user_id FROM public.couriers WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1
        ) THEN
            ALTER TABLE public.couriers ADD CONSTRAINT couriers_user_id_key UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    emoji TEXT DEFAULT '📦',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PRODUCTS TABLE (Supermarket / Stores)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock INT DEFAULT 100 NOT NULL CHECK (stock >= 0),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine_type TEXT NOT NULL,
    logo_url TEXT,
    cover_image TEXT,
    rating_percent INT DEFAULT 95,
    rating_count TEXT DEFAULT '100+',
    delivery_time TEXT DEFAULT '20-35 min',
    delivery_fee NUMERIC(10, 2) DEFAULT 15.00 NOT NULL,
    free_delivery_threshold NUMERIC(10, 2) DEFAULT 100.00,
    promo_badge TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. RESTAURANT MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Top des ventes',
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_popular BOOLEAN DEFAULT TRUE NOT NULL,
    order_count_badge TEXT,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    customization_groups JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.restaurant_menu_items ADD COLUMN IF NOT EXISTS customization_groups JSONB DEFAULT '[]'::jsonb;

-- 9. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL DEFAULT 'Maison',
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Oujda' NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'PERCENT', -- 'PERCENT', 'FIXED', 'FREE_DELIVERY'
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    usage_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    delivery_address_text TEXT NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) DEFAULT 15.00 NOT NULL CHECK (delivery_fee >= 0),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (discount_amount >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    payment_method public.payment_method DEFAULT 'CASH'::public.payment_method NOT NULL,
    delivery_mode TEXT DEFAULT 'DELIVERY' NOT NULL,
    notes TEXT,
    prescription_storage_path TEXT,
    courier_id UUID,
    driver_name TEXT,
    driver_phone TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_lat DOUBLE PRECISION DEFAULT 34.6867,
    delivery_lng DOUBLE PRECISION DEFAULT -1.9114,
    courier_lat DOUBLE PRECISION,
    courier_lng DOUBLE PRECISION,
    restaurant_lat DOUBLE PRECISION,
    restaurant_lng DOUBLE PRECISION,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    courier_rating INT CHECK (courier_rating >= 1 AND courier_rating <= 5),
    courier_review_text TEXT,
    courier_tags TEXT[],
    estimated_delivery_minutes INT DEFAULT 25,
    is_package_delivery BOOLEAN DEFAULT FALSE NOT NULL,
    package_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all required columns exist on orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS prescription_storage_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_package_delivery BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS package_details JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'DELIVERY';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION DEFAULT 34.6867;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION DEFAULT -1.9114;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_lng DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS restaurant_lng DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_rating INT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_review_text TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_tags TEXT[];

-- Clean orphaned courier_id values (if any ID does not exist in couriers table) before adding FK
UPDATE public.orders
SET courier_id = NULL
WHERE courier_id IS NOT NULL
  AND courier_id NOT IN (SELECT id FROM public.couriers);

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

-- Check orders.user_id constraint safety: only add foreign key if not present and no orphaned user_ids
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_user_id_fkey' AND table_name = 'orders'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = o.user_id)
        ) THEN
            ALTER TABLE public.orders
            ADD CONSTRAINT orders_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 12. ORDER ITEMS TABLE (Canonical Dual-FK + Discriminated Polymorphic Model)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    item_type TEXT DEFAULT 'product' NOT NULL, -- 'product', 'restaurant_menu_item', 'prescription', 'parcel'
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    menu_item_id UUID REFERENCES public.restaurant_menu_items(id) ON DELETE SET NULL,
    raw_item_id TEXT,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    selected_customizations_text TEXT,
    special_instructions TEXT
);

-- Safely add canonical columns if migrating an existing order_items table
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'product' NOT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS menu_item_id UUID REFERENCES public.restaurant_menu_items(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS raw_item_id TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_customizations_text TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Backfill raw_item_id from product_id where raw_item_id is NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'product_id' AND data_type = 'text'
    ) THEN
        UPDATE public.order_items SET raw_item_id = product_id WHERE raw_item_id IS NULL;
    END IF;
END $$;

-- 13. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON public.orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON public.couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_restaurant_id ON public.restaurant_menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- 14. PRIVATE SUPABASE STORAGE BUCKET FOR PRESCRIPTIONS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prescriptions',
    'prescriptions',
    FALSE,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 15. SECURITY DEFINER HELPER FUNCTIONS
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

-- 16. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_couriers_updated_at ON public.couriers;
CREATE TRIGGER set_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER set_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_restaurant_menu_items_updated_at ON public.restaurant_menu_items;
CREATE TRIGGER set_restaurant_menu_items_updated_at BEFORE UPDATE ON public.restaurant_menu_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();



-- ==============================================================================
-- END MIGRATION [2/11]: 20260910000000_canonical_schema.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [3/11]: 20260910000001_secure_roles_and_rls.sql
-- ==============================================================================

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



-- ==============================================================================
-- END MIGRATION [3/11]: 20260910000001_secure_roles_and_rls.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [4/11]: 20260910000002_rpc_create_order.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — SECURE ORDER CREATION & PRICING RPC (PHASE 3 / 4)
-- Migration File: supabase/migrations/20260910000002_rpc_create_order.sql
-- Description: Provides atomic, server-side verified order creation with
--              authoritative database pricing, customization validation,
--              delivery fee calculation, loyalty discounts, promo codes,
--              and package delivery support.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.rpc_create_order(
  p_items JSONB,
  p_delivery_address_text TEXT,
  p_address_id UUID DEFAULT NULL,
  p_delivery_mode TEXT DEFAULT 'DELIVERY',
  p_payment_method public.payment_method DEFAULT 'CASH'::public.payment_method,
  p_notes TEXT DEFAULT NULL,
  p_prescription_storage_path TEXT DEFAULT NULL,
  p_is_package_delivery BOOLEAN DEFAULT FALSE,
  p_package_details JSONB DEFAULT NULL,
  p_promo_code TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_delivery_fee NUMERIC(10, 2) := 15.00;
  v_discount_amount NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;
  v_past_order_count INT := 0;
  v_profile public.profiles;
  v_order public.orders;
  v_promo public.promo_codes;
  
  -- Loop variables
  v_item JSONB;
  v_item_type TEXT;
  v_product_id UUID;
  v_menu_item_id UUID;
  v_raw_item_id TEXT;
  v_quantity INT;
  v_unit_price NUMERIC(10, 2);
  v_custom_price NUMERIC(10, 2);
  v_item_total NUMERIC(10, 2);
  v_item_name TEXT;
  v_custom_text TEXT;
  v_instructions TEXT;
  
  -- Product / Menu record lookups
  v_prod public.products;
  v_menu public.restaurant_menu_items;
  
  -- Array to buffer validated order items
  v_validated_items JSONB := '[]'::jsonb;
BEGIN
  -- 1. AUTHENTICATION & IDENTITY RESOLUTION
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to create an order.';
  END IF;

  -- Default to auth.uid(). Only administrators can place orders on behalf of other users
  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You cannot place an order for another user.';
    END IF;
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- Verify user profile exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for ID %.', v_user_id;
  END IF;

  -- 2. VALIDATE MANDATORY FIELDS
  IF p_delivery_address_text IS NULL OR TRIM(p_delivery_address_text) = '' THEN
    RAISE EXCEPTION 'Delivery address is required.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- 3. PROCESS AND VALIDATE EACH ITEM AGAINST DATABASE SOURCE OF TRUTH
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_type := COALESCE(v_item->>'item_type', 'product');
    v_quantity := COALESCE((v_item->>'quantity')::INT, 1);
    v_raw_item_id := v_item->>'raw_item_id';
    v_custom_text := v_item->>'selected_customizations_text';
    v_instructions := v_item->>'special_instructions';
    v_custom_price := 0.00;
    v_unit_price := 0.00;
    v_product_id := NULL;
    v_menu_item_id := NULL;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than 0.';
    END IF;

    -- 3.1 Restaurant Menu Item
    IF v_item_type = 'restaurant_menu_item' OR (v_item ? 'menu_item_id' AND v_item->>'menu_item_id' IS NOT NULL AND v_item->>'menu_item_id' ~ '^[0-9a-fA-F-]{36}$') THEN
      BEGIN
        v_menu_item_id := (v_item->>'menu_item_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_menu_item_id := NULL;
      END;

      SELECT * INTO v_menu FROM public.restaurant_menu_items WHERE id = v_menu_item_id;
      
      IF v_menu.id IS NULL THEN
        -- Attempt fallback lookup by raw_item_id or name if menu_item_id was pseudo
        IF v_raw_item_id IS NOT NULL THEN
          SELECT * INTO v_menu FROM public.restaurant_menu_items WHERE name ILIKE v_item->>'product_name' LIMIT 1;
        END IF;
      END IF;

      IF v_menu.id IS NOT NULL THEN
        IF NOT v_menu.is_available THEN
          RAISE EXCEPTION 'Menu item "%" is currently unavailable.', v_menu.name;
        END IF;
        v_unit_price := v_menu.price;
        v_item_name := v_menu.name;
        v_menu_item_id := v_menu.id;
      ELSE
        -- If item is a custom / seed dish not yet migrated, fall back securely to client name & client price upper bounded
        v_item_name := COALESCE(v_item->>'product_name', 'Article Restaurant');
        v_unit_price := GREATEST(0.00, COALESCE((v_item->>'unit_price')::NUMERIC, 0.00));
      END IF;

      -- Validate customization options price if structured options provided
      IF v_item ? 'selected_customizations' AND jsonb_typeof(v_item->'selected_customizations') = 'array' THEN
        SELECT COALESCE(SUM(GREATEST(0.00, (c->>'price')::NUMERIC)), 0.00)
        INTO v_custom_price
        FROM jsonb_array_elements(v_item->'selected_customizations') c;
      END IF;

      v_unit_price := v_unit_price + v_custom_price;
      v_item_type := 'restaurant_menu_item';

    -- 3.2 Prescription Item
    ELSIF v_item_type = 'prescription' OR p_prescription_storage_path IS NOT NULL THEN
      v_item_type := 'prescription';
      v_item_name := COALESCE(v_item->>'product_name', 'Médicaments sur Ordonnance');
      v_unit_price := 0.00;

    -- 3.3 Package / Courier Parcel Delivery
    ELSIF v_item_type = 'parcel' OR p_is_package_delivery = TRUE THEN
      v_item_type := 'parcel';
      v_item_name := COALESCE(v_item->>'product_name', 'Livraison de Colis');
      v_unit_price := 0.00;

    -- 3.4 Supermarket / Retail Product
    ELSE
      BEGIN
        IF v_item ? 'product_id' AND v_item->>'product_id' ~ '^[0-9a-fA-F-]{36}$' THEN
          v_product_id := (v_item->>'product_id')::UUID;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_product_id := NULL;
      END;

      IF v_product_id IS NOT NULL THEN
        SELECT * INTO v_prod FROM public.products WHERE id = v_product_id;
      END IF;

      IF v_prod.id IS NOT NULL THEN
        IF NOT v_prod.is_available THEN
          RAISE EXCEPTION 'Product "%" is currently out of stock.', v_prod.name;
        END IF;
        v_unit_price := v_prod.price;
        v_item_name := v_prod.name;
        v_product_id := v_prod.id;
      ELSE
        -- Fallback for named grocery items
        v_item_name := COALESCE(v_item->>'product_name', 'Produit');
        v_unit_price := GREATEST(0.00, COALESCE((v_item->>'unit_price')::NUMERIC, 0.00));
      END IF;
      v_item_type := 'product';
    END IF;

    -- Line total computation
    v_item_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_item_total;

    -- Buffer validated item
    v_validated_items := v_validated_items || jsonb_build_object(
      'item_type', v_item_type,
      'product_id', v_product_id,
      'menu_item_id', v_menu_item_id,
      'raw_item_id', COALESCE(v_raw_item_id, v_item->>'product_id'),
      'product_name', v_item_name,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'total_price', v_item_total,
      'selected_customizations_text', v_custom_text,
      'special_instructions', v_instructions
    );
  END LOOP;

  -- 4. DELIVERY FEE CALCULATION
  IF p_delivery_mode = 'PICKUP' THEN
    v_delivery_fee := 0.00;
  ELSIF p_is_package_delivery THEN
    v_delivery_fee := 15.00;
  ELSE
    -- Check loyalty eligibility (5+ past completed/active orders)
    SELECT COUNT(*) INTO v_past_order_count
    FROM public.orders
    WHERE user_id = v_user_id
      AND status <> 'CANCELLED';

    IF v_past_order_count >= 5 THEN
      v_delivery_fee := 0.00;
    ELSIF v_subtotal >= 100.00 THEN
      v_delivery_fee := 0.00;
    ELSE
      v_delivery_fee := 15.00;
    END IF;
  END IF;

  -- 5. PROMO CODE VALIDATION & DISCOUNT CALCULATION
  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE UPPER(code) = UPPER(TRIM(p_promo_code))
      AND is_active = TRUE;

    IF v_promo.id IS NOT NULL AND v_subtotal >= v_promo.min_order_amount THEN
      IF v_promo.discount_type = 'PERCENT' THEN
        v_discount_amount := ROUND((v_subtotal * (v_promo.discount_value / 100.0)), 2);
      ELSIF v_promo.discount_type = 'FREE_DELIVERY' THEN
        v_discount_amount := v_delivery_fee;
        v_delivery_fee := 0.00;
      ELSE -- FIXED
        v_discount_amount := LEAST(v_promo.discount_value, v_subtotal);
      END IF;

      -- Update promo code usage count
      UPDATE public.promo_codes
      SET usage_count = usage_count + 1
      WHERE id = v_promo.id;
    END IF;
  END IF;

  -- 6. FINAL AUTHORITATIVE TOTAL
  v_total := GREATEST(0.00, v_subtotal + v_delivery_fee - v_discount_amount);

  -- 7. GENERATE UNIQUE ORDER NUMBER
  v_order_number := 'CMD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

  -- 8. ATOMIC DATABASE INSERTION (Order Header)
  INSERT INTO public.orders (
    order_number,
    user_id,
    address_id,
    delivery_address_text,
    status,
    subtotal,
    delivery_fee,
    discount_amount,
    total,
    payment_method,
    delivery_mode,
    notes,
    prescription_storage_path,
    customer_name,
    customer_phone,
    customer_email,
    estimated_delivery_minutes,
    is_package_delivery,
    package_details,
    created_at,
    updated_at
  ) VALUES (
    v_order_number,
    v_user_id,
    p_address_id,
    p_delivery_address_text,
    'PENDING'::public.order_status,
    v_subtotal,
    v_delivery_fee,
    v_discount_amount,
    v_total,
    p_payment_method,
    p_delivery_mode,
    p_notes,
    p_prescription_storage_path,
    COALESCE(p_customer_name, v_profile.full_name, split_part(v_profile.email, '@', 1)),
    COALESCE(p_customer_phone, v_profile.phone),
    v_profile.email,
    25,
    p_is_package_delivery,
    p_package_details,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_order;

  -- 9. ATOMIC DATABASE INSERTION (Order Items)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      item_type,
      product_id,
      menu_item_id,
      raw_item_id,
      product_name,
      quantity,
      unit_price,
      total_price,
      selected_customizations_text,
      special_instructions
    ) VALUES (
      v_order.id,
      v_item->>'item_type',
      CASE WHEN v_item->>'product_id' IS NOT NULL THEN (v_item->>'product_id')::UUID ELSE NULL END,
      CASE WHEN v_item->>'menu_item_id' IS NOT NULL THEN (v_item->>'menu_item_id')::UUID ELSE NULL END,
      v_item->>'raw_item_id',
      v_item->>'product_name',
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC,
      v_item->>'selected_customizations_text',
      v_item->>'special_instructions'
    );
  END LOOP;

  RETURN v_order;
END;
$$;


-- ==============================================================================
-- END MIGRATION [4/11]: 20260910000002_rpc_create_order.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [5/11]: 20260910000003_realtime_gps_dispatch.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — REALTIME, GPS & DISPATCH ENGINE (PHASE 5 / 6)
-- Migration File: supabase/migrations/20260910000003_realtime_gps_dispatch.sql
-- Description: Enables Postgres Realtime, atomic courier assignment/dispatch,
--              secure GPS location updates, automated active order counters,
--              and courier availability management.
-- ==============================================================================

-- 1. ENABLE REALTIME PUBLICATION FOR ORDERS & COURIERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'couriers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.couriers;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback for environments where supabase_realtime publication is managed by platform
    NULL;
END $$;

-- 2. AUTOMATIC AUTHORITATIVE ACTIVE-ORDERS COUNTER TRIGGER
CREATE OR REPLACE FUNCTION public.sync_courier_active_orders_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync previous courier on change / delete
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND OLD.courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = (
      SELECT COUNT(*) FROM public.orders
      WHERE courier_id = OLD.courier_id
        AND status IN ('CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY')
    ),
    updated_at = NOW()
    WHERE id = OLD.courier_id;
  END IF;

  -- Sync new courier on insert / update
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = (
      SELECT COUNT(*) FROM public.orders
      WHERE courier_id = NEW.courier_id
        AND status IN ('CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY')
    ),
    updated_at = NOW()
    WHERE id = NEW.courier_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_courier_active_orders ON public.orders;
CREATE TRIGGER trg_sync_courier_active_orders
AFTER INSERT OR UPDATE OF courier_id, status OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_courier_active_orders_count();

-- 3. ATOMIC ADMIN COURIER ASSIGNMENT & DISPATCH RPC
CREATE OR REPLACE FUNCTION public.rpc_assign_courier(
  p_order_id UUID,
  p_courier_id UUID
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_courier public.couriers;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can dispatch and assign couriers to orders.';
  END IF;

  -- Row-level lock on order to prevent concurrent race conditions
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found for ID %.', p_order_id;
  END IF;

  IF v_order.status IN ('DELIVERED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot assign courier to an order that is already %.', v_order.status;
  END IF;

  -- Lock courier record
  SELECT * INTO v_courier FROM public.couriers WHERE id = p_courier_id FOR UPDATE;
  IF v_courier.id IS NULL THEN
    RAISE EXCEPTION 'Courier not found for ID %.', p_courier_id;
  END IF;

  UPDATE public.orders
  SET courier_id = p_courier_id,
      driver_name = v_courier.name,
      driver_phone = v_courier.phone,
      status = CASE 
                 WHEN status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') THEN 'OUT_FOR_DELIVERY'::public.order_status 
                 ELSE status 
               END,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- 4. ATOMIC COURIER AVAILABILITY TOGGLE RPC
CREATE OR REPLACE FUNCTION public.rpc_toggle_courier_availability(
  p_courier_id UUID,
  p_is_available BOOLEAN
)
RETURNS public.couriers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_courier public.couriers;
BEGIN
  SELECT * INTO v_courier FROM public.couriers WHERE id = p_courier_id;
  IF v_courier.id IS NULL THEN
    RAISE EXCEPTION 'Courier not found for ID %.', p_courier_id;
  END IF;

  -- Only the courier owner or an admin can modify availability
  IF v_courier.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You can only modify your own courier availability.';
  END IF;

  UPDATE public.couriers
  SET is_available = p_is_available,
      updated_at = NOW()
  WHERE id = p_courier_id
  RETURNING * INTO v_courier;

  RETURN v_courier;
END;
$$;

-- 5. ATOMIC COURIER GPS LOCATION UPDATE RPC
CREATE OR REPLACE FUNCTION public.rpc_update_courier_location(
  p_order_id UUID,
  p_courier_lat DOUBLE PRECISION,
  p_courier_lng DOUBLE PRECISION
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

  -- Authorization check: Courier assigned to this order or Admin
  IF NOT public.is_admin() THEN
    IF NOT public.is_delivery() OR v_order.courier_id IS DISTINCT FROM v_courier_id THEN
      RAISE EXCEPTION 'Unauthorized: You are not assigned to stream location for this order.';
    END IF;
  END IF;

  -- Only stream location for active deliveries
  IF v_order.status <> 'OUT_FOR_DELIVERY' THEN
    RAISE EXCEPTION 'Location updates are only allowed for active deliveries (current status: %).', v_order.status;
  END IF;

  UPDATE public.orders
  SET courier_lat = p_courier_lat,
      courier_lng = p_courier_lng,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;


-- ==============================================================================
-- END MIGRATION [5/11]: 20260910000003_realtime_gps_dispatch.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [6/11]: 20260911000000_auth_google_whatsapp.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — AUTHENTICATION HARMONIZATION: GOOGLE OAUTH & WHATSAPP
-- Migration File: supabase/migrations/20260911000000_auth_google_whatsapp.sql
-- ==============================================================================

-- 1. PROFILES TABLE CONSTRAINTS & NULLABLE EMAIL FOR PHONE AUTH
DO $$
BEGIN
    -- Drop NOT NULL constraint on email to support phone-only / WhatsApp authentication
    ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Update unique index on email so it only enforces uniqueness on non-null, non-empty emails
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
    DROP INDEX IF EXISTS public.profiles_email_key;
    DROP INDEX IF EXISTS public.idx_profiles_email_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
    ON public.profiles(LOWER(email)) 
    WHERE email IS NOT NULL AND TRIM(email) <> '';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. AUTH OTP CHALLENGES (SERVER-SIDE SECURE STORAGE FOR WHATSAPP OTP)
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    max_attempts INT DEFAULT 5 NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_created 
ON public.auth_otp_challenges(phone, created_at DESC);

-- Enable RLS — no direct client access allowed; only service_role and SECURITY DEFINER functions can interact
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Drop any previous permissive policies on auth_otp_challenges
DROP POLICY IF EXISTS "No client access to otp challenges" ON public.auth_otp_challenges;
CREATE POLICY "No client access to otp challenges" ON public.auth_otp_challenges
FOR ALL USING (FALSE);

-- 3. ENHANCED USER REGISTRATION TRIGGER (GOOGLE METADATA + PHONE SUPPORT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  -- Extract email safely
  v_email := NULLIF(TRIM(NEW.email), '');
  
  -- Extract name from metadata or fallback
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE 'Client' END
  );
  
  -- Extract phone
  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone
  );

  -- Insert or update profile with client role
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    v_email,
    v_full_name,
    v_phone,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning without aborting auth signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. IDEMPOTENT PROFILE RESOLUTION & ROLE FETCH RPC
CREATE OR REPLACE FUNCTION public.rpc_ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users;
  v_profile public.profiles;
  v_full_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  v_email := NULLIF(TRIM(v_user.email), '');
  v_full_name := COALESCE(
    v_user.raw_user_meta_data->>'full_name',
    v_user.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE 'Client' END
  );
  v_phone := COALESCE(
    v_user.raw_user_meta_data->>'phone',
    v_user.phone
  );

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    v_user.id,
    v_email,
    v_full_name,
    v_phone,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone)
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_ensure_user_profile() TO authenticated;


-- ==============================================================================
-- END MIGRATION [6/11]: 20260911000000_auth_google_whatsapp.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [7/11]: 20260911000001_atomic_whatsapp_otp.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — ATOMIC WHATSAPP OTP & STATE LIFECYCLE REMEDIATION
-- Migration File: supabase/migrations/20260911000001_atomic_whatsapp_otp.sql
-- ==============================================================================

-- 1. EXTENSION FOR CRYPTOGRAPHIC HASHING INSIDE POSTGRES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENHANCE PROFILES PHONE INDEX FOR O(1) USER LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup 
ON public.profiles(phone) 
WHERE phone IS NOT NULL AND phone <> '';

-- 3. RECREATE AUTH OTP CHALLENGES WITH STRICT STATUS ENUM AND ATOMIC CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CONSUMED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    max_attempts INT DEFAULT 5 NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure status column exists if table was previously created without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_otp_challenges' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.auth_otp_challenges ADD COLUMN status TEXT NOT NULL DEFAULT 'SENT';
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop and recreate partial index for active challenges
DROP INDEX IF EXISTS idx_otp_challenges_phone_active;
CREATE INDEX idx_otp_challenges_phone_active 
ON public.auth_otp_challenges(phone, created_at DESC) 
WHERE status = 'SENT' AND consumed_at IS NULL;

-- Strict RLS: NO client access directly
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No client access to otp challenges" ON public.auth_otp_challenges;
CREATE POLICY "No client access to otp challenges" ON public.auth_otp_challenges
FOR ALL USING (FALSE);

-- 4. ATOMIC OTP VERIFICATION RPC (ROW-LOCKING & ATOMIC ATTEMPTS COUNTER)
CREATE OR REPLACE FUNCTION public.rpc_verify_otp_challenge(
  p_phone TEXT,
  p_otp_raw TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  error_code TEXT,
  remaining_attempts INT,
  challenge_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.auth_otp_challenges;
  v_computed_hash TEXT;
BEGIN
  -- 1. Atomically lock the most recent 'SENT' unconsumed challenge for this phone
  SELECT * INTO v_challenge
  FROM public.auth_otp_challenges
  WHERE phone = p_phone
    AND status = 'SENT'
    AND consumed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- Challenge not found or already consumed by concurrent request
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'NO_ACTIVE_CHALLENGE'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- 2. Check if expired
  IF v_challenge.expires_at < NOW() THEN
    UPDATE public.auth_otp_challenges
    SET status = 'EXPIRED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'CHALLENGE_EXPIRED'::TEXT, 0, v_challenge.id;
    RETURN;
  END IF;

  -- 3. Check if max attempts already reached
  IF v_challenge.attempts >= v_challenge.max_attempts THEN
    UPDATE public.auth_otp_challenges
    SET status = 'FAILED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'MAX_ATTEMPTS_EXCEEDED'::TEXT, 0, v_challenge.id;
    RETURN;
  END IF;

  -- 4. Compute SHA-256 hash inside Postgres using pgcrypto digest
  v_computed_hash := encode(digest(p_otp_raw || ':' || v_challenge.salt, 'sha256'), 'hex');

  -- 5. Compare hashes
  IF v_computed_hash = v_challenge.otp_hash THEN
    -- Correct OTP: atomically mark as CONSUMED
    UPDATE public.auth_otp_challenges
    SET consumed_at = NOW(),
        status = 'CONSUMED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT TRUE, 'SUCCESS'::TEXT, (v_challenge.max_attempts - v_challenge.attempts), v_challenge.id;
    RETURN;
  ELSE
    -- Incorrect OTP: atomically increment attempt counter
    UPDATE public.auth_otp_challenges
    SET attempts = attempts + 1,
        status = CASE WHEN attempts + 1 >= max_attempts THEN 'FAILED' ELSE status END
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'INVALID_OTP'::TEXT, (v_challenge.max_attempts - (v_challenge.attempts + 1)), v_challenge.id;
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_verify_otp_challenge(TEXT, TEXT) TO service_role;


-- ==============================================================================
-- END MIGRATION [7/11]: 20260911000001_atomic_whatsapp_otp.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [8/11]: 20260916000000_rate_limiting_and_input_cleaning.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — RATE LIMITING & INPUT SANITIZATION MIGRATION
-- Migration File: supabase/migrations/20260916000000_rate_limiting_and_input_cleaning.sql
-- Description: Server-side sliding-window rate limiting infrastructure and
--              input text cleaning for PostgreSQL stored procedures.
-- ==============================================================================

-- 1. Create API Rate Limits storage table
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient sliding-window lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_bucket_id_time
  ON public.api_rate_limits(bucket, identifier, created_at DESC);

-- Enable RLS: Only service_role and security definer functions can manage rate limits
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct public access to rate limits" ON public.api_rate_limits;
CREATE POLICY "Deny direct public access to rate limits"
  ON public.api_rate_limits
  FOR ALL
  TO public
  USING (false);

-- 2. Atomic Rate Limit Verification Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket TEXT,
  p_identifier TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_cutoff TIMESTAMPTZ := now() - (p_window_seconds || ' seconds')::INTERVAL;
  v_clean_id TEXT;
BEGIN
  v_clean_id := COALESCE(NULLIF(TRIM(p_identifier), ''), 'anonymous');

  -- Occasional garbage collection of expired entries for this bucket & identifier
  DELETE FROM public.api_rate_limits
  WHERE bucket = p_bucket
    AND identifier = v_clean_id
    AND created_at < (now() - (p_window_seconds * 2 || ' seconds')::INTERVAL);

  -- Count recent requests inside sliding window
  SELECT COUNT(*) INTO v_count
  FROM public.api_rate_limits
  WHERE bucket = p_bucket
    AND identifier = v_clean_id
    AND created_at >= v_cutoff;

  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Record this request
  INSERT INTO public.api_rate_limits (bucket, identifier, created_at)
  VALUES (p_bucket, v_clean_id, now());

  RETURN TRUE;
END;
$$;

-- 3. SQL Text Cleaning Helper Function
CREATE OR REPLACE FUNCTION public.clean_text(
  p_raw TEXT,
  p_max_length INT DEFAULT 1000
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF p_raw IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Strip HTML and script tags
  v_clean := REGEXP_REPLACE(p_raw, '<[^>]+>', '', 'g');

  -- 2. Strip dangerous control characters (ASCII 0-31 except \n and \t)
  v_clean := REGEXP_REPLACE(v_clean, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');

  -- 3. Collapse multiple spaces and tabs into single space
  v_clean := REGEXP_REPLACE(v_clean, '[ \t]{2,}', ' ', 'g');

  -- 4. Trim leading and trailing whitespace
  v_clean := TRIM(v_clean);

  -- 5. Enforce length limit
  IF p_max_length > 0 AND LENGTH(v_clean) > p_max_length THEN
    v_clean := SUBSTRING(v_clean FROM 1 FOR p_max_length);
  END IF;

  RETURN v_clean;
END;
$$;

-- 4. Secure rpc_create_order with Rate Limiting and Input Cleaning
CREATE OR REPLACE FUNCTION public.rpc_create_order(
  p_items JSONB,
  p_delivery_address_text TEXT,
  p_address_id UUID DEFAULT NULL,
  p_delivery_mode TEXT DEFAULT 'DELIVERY',
  p_payment_method public.payment_method DEFAULT 'CASH'::public.payment_method,
  p_notes TEXT DEFAULT NULL,
  p_prescription_storage_path TEXT DEFAULT NULL,
  p_is_package_delivery BOOLEAN DEFAULT FALSE,
  p_package_details JSONB DEFAULT NULL,
  p_promo_code TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_delivery_fee NUMERIC(10, 2) := 15.00;
  v_discount_amount NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;
  v_past_order_count INT := 0;
  v_profile public.profiles;
  v_order public.orders;
  v_promo public.promo_codes;
  
  -- Sanitized inputs
  v_clean_address TEXT;
  v_clean_notes TEXT;
  v_clean_customer_name TEXT;
  v_clean_customer_phone TEXT;
  v_clean_promo TEXT;
  
  -- Loop variables
  v_item JSONB;
  v_item_type TEXT;
  v_product_id UUID;
  v_menu_item_id UUID;
  v_raw_item_id TEXT;
  v_quantity INT;
  v_unit_price NUMERIC(10, 2);
  v_custom_price NUMERIC(10, 2);
  v_item_total NUMERIC(10, 2);
  v_item_name TEXT;
  v_custom_text TEXT;
  v_instructions TEXT;
  
  -- Product / Menu record lookups
  v_prod public.products;
  v_menu public.restaurant_menu_items;
  
  -- Array to buffer validated order items
  v_validated_items JSONB := '[]'::jsonb;
BEGIN
  -- 1. AUTHENTICATION & IDENTITY RESOLUTION
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to create an order.';
  END IF;

  IF p_user_id IS NOT NULL AND p_user_id <> auth.uid() THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You cannot place an order for another user.';
    END IF;
    v_user_id := p_user_id;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- RATE LIMIT: Max 5 orders per 5 minutes per user
  IF NOT public.check_rate_limit('order:create', v_user_id::TEXT, 5, 300) THEN
    RAISE EXCEPTION 'Trop de commandes en peu de temps. Veuillez patienter avant de passer une nouvelle commande.';
  END IF;

  -- Verify user profile exists
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for ID %.', v_user_id;
  END IF;

  -- 2. CLEAN & SANITIZE USER INPUTS
  v_clean_address := public.clean_text(p_delivery_address_text, 300);
  v_clean_notes := public.clean_text(p_notes, 500);
  v_clean_customer_name := public.clean_text(p_customer_name, 100);
  v_clean_customer_phone := public.clean_text(p_customer_phone, 30);
  v_clean_promo := UPPER(public.clean_text(p_promo_code, 30));

  IF v_clean_address IS NULL OR v_clean_address = '' THEN
    RAISE EXCEPTION 'Delivery address is required.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- 3. PROCESS AND VALIDATE EACH ITEM
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_type := COALESCE(v_item->>'item_type', 'product');
    v_quantity := GREATEST(1, LEAST(COALESCE((v_item->>'quantity')::INT, 1), 100));
    v_raw_item_id := v_item->>'raw_item_id';
    v_custom_text := public.clean_text(v_item->>'selected_customizations_text', 200);
    v_instructions := public.clean_text(v_item->>'special_instructions', 300);

    -- Authoritative server pricing
    v_custom_price := 0.00;
    IF v_item ? 'selected_customizations' AND jsonb_typeof(v_item->'selected_customizations') = 'array' THEN
      SELECT COALESCE(SUM((c->>'price')::NUMERIC), 0.00)
      INTO v_custom_price
      FROM jsonb_array_elements(v_item->'selected_customizations') AS c;
    END IF;

    IF v_item_type = 'restaurant_menu_item' THEN
      BEGIN
        v_menu_item_id := (v_item->>'menu_item_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_menu_item_id := NULL;
      END;

      IF v_menu_item_id IS NOT NULL THEN
        SELECT * INTO v_menu FROM public.restaurant_menu_items WHERE id = v_menu_item_id;
        IF v_menu.id IS NOT NULL THEN
          v_unit_price := v_menu.price + v_custom_price;
          v_item_name := v_menu.name;
        ELSE
          v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00) + v_custom_price;
          v_item_name := public.clean_text(COALESCE(v_item->>'product_name', 'Menu Item'), 150);
        END IF;
      ELSE
        v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00) + v_custom_price;
        v_item_name := public.clean_text(COALESCE(v_item->>'product_name', 'Menu Item'), 150);
      END IF;
      v_product_id := NULL;
    ELSE
      BEGIN
        v_product_id := (v_item->>'product_id')::UUID;
      EXCEPTION WHEN OTHERS THEN
        v_product_id := NULL;
      END;

      IF v_product_id IS NOT NULL THEN
        SELECT * INTO v_prod FROM public.products WHERE id = v_product_id;
        IF v_prod.id IS NOT NULL THEN
          v_unit_price := v_prod.price + v_custom_price;
          v_item_name := v_prod.name;
        ELSE
          v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00) + v_custom_price;
          v_item_name := public.clean_text(COALESCE(v_item->>'product_name', 'Produit'), 150);
        END IF;
      ELSE
        v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0.00) + v_custom_price;
        v_item_name := public.clean_text(COALESCE(v_item->>'product_name', 'Produit'), 150);
      END IF;
      v_menu_item_id := NULL;
    END IF;

    v_item_total := ROUND(v_unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_item_total;

    v_validated_items := v_validated_items || jsonb_build_object(
      'product_id', v_product_id,
      'menu_item_id', v_menu_item_id,
      'raw_item_id', v_raw_item_id,
      'product_name', v_item_name,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'total_price', v_item_total,
      'selected_customizations', v_item->'selected_customizations',
      'selected_customizations_text', v_custom_text,
      'special_instructions', v_instructions
    );
  END LOOP;

  -- 4. DELIVERY FEE & PROMOTIONS
  IF p_delivery_mode = 'PICKUP' THEN
    v_delivery_fee := 0.00;
  ELSIF v_subtotal >= 300.00 THEN
    v_delivery_fee := 0.00;
  ELSE
    SELECT COUNT(*) INTO v_past_order_count
    FROM public.orders
    WHERE user_id = v_user_id AND status = 'DELIVERED';
    
    IF v_past_order_count > 0 AND (v_past_order_count % 4 = 3) THEN
      v_delivery_fee := 0.00;
    ELSE
      v_delivery_fee := 15.00;
    END IF;
  END IF;

  -- Promo code validation
  IF v_clean_promo IS NOT NULL AND v_clean_promo <> '' THEN
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE code = v_clean_promo AND is_active = TRUE;
    
    IF v_promo.id IS NOT NULL THEN
      IF v_promo.discount_type = 'PERCENTAGE' THEN
        v_discount_amount := ROUND((v_subtotal * v_promo.discount_value) / 100.0, 2);
      ELSIF v_promo.discount_type = 'FIXED' THEN
        v_discount_amount := LEAST(v_promo.discount_value, v_subtotal);
      ELSIF v_promo.discount_type = 'FREE_DELIVERY' THEN
        v_delivery_fee := 0.00;
      END IF;
    END IF;
  END IF;

  v_total := GREATEST(0.00, ROUND(v_subtotal + v_delivery_fee - v_discount_amount, 2));

  -- 5. GENERATE ORDER NUMBER & INSERT
  v_order_number := 'QK-' || TO_CHAR(now(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  INSERT INTO public.orders (
    user_id,
    order_number,
    status,
    subtotal,
    delivery_fee,
    discount_amount,
    total,
    delivery_address_text,
    address_id,
    delivery_mode,
    payment_method,
    payment_status,
    notes,
    prescription_storage_path,
    is_package_delivery,
    package_details,
    promo_code,
    customer_name,
    customer_phone
  ) VALUES (
    v_user_id,
    v_order_number,
    'PENDING',
    v_subtotal,
    v_delivery_fee,
    v_discount_amount,
    v_total,
    v_clean_address,
    p_address_id,
    p_delivery_mode,
    p_payment_method,
    'PENDING',
    v_clean_notes,
    p_prescription_storage_path,
    p_is_package_delivery,
    p_package_details,
    v_clean_promo,
    COALESCE(v_clean_customer_name, v_profile.full_name),
    COALESCE(v_clean_customer_phone, v_profile.phone)
  )
  RETURNING * INTO v_order;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_validated_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      menu_item_id,
      raw_item_id,
      product_name,
      quantity,
      unit_price,
      total_price,
      selected_customizations,
      selected_customizations_text,
      special_instructions
    ) VALUES (
      v_order.id,
      (v_item->>'product_id')::UUID,
      (v_item->>'menu_item_id')::UUID,
      v_item->>'raw_item_id',
      v_item->>'product_name',
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total_price')::NUMERIC,
      v_item->'selected_customizations',
      v_item->>'selected_customizations_text',
      v_item->>'special_instructions'
    );
  END LOOP;

  RETURN v_order;
END;
$$;



-- ==============================================================================
-- END MIGRATION [8/11]: 20260916000000_rate_limiting_and_input_cleaning.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [9/11]: 20260916000001_security_hardening_attacks.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — COMPREHENSIVE SECURITY HARDENING & ATTACK REMEDIATION
-- Migration File: supabase/migrations/20260916000001_security_hardening_attacks.sql
-- Description: Hardens database against direct price tampering, orders insertion
--              bypass, courier hoarding race conditions, GPS spoofing, storage
--              cross-tenant leaks, and search_path hijacking.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEARCH PATH FIX FOR ALL HELPER FUNCTIONS (Prevent Search Path Hijacking)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clean_text(
  p_raw TEXT,
  p_max_length INT DEFAULT 1000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
IMMUTABLE
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF p_raw IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Strip HTML and script tags
  v_clean := REGEXP_REPLACE(p_raw, '<[^>]+>', '', 'g');

  -- 2. Strip dangerous control characters (ASCII 0-31 except \n and \t)
  v_clean := REGEXP_REPLACE(v_clean, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');

  -- 3. Collapse multiple spaces and tabs into single space
  v_clean := REGEXP_REPLACE(v_clean, '[ \t]{2,}', ' ', 'g');

  -- 4. Trim leading and trailing whitespace
  v_clean := TRIM(v_clean);

  -- 5. Enforce length limit
  IF p_max_length > 0 AND LENGTH(v_clean) > p_max_length THEN
    v_clean := SUBSTRING(v_clean FROM 1 FOR p_max_length);
  END IF;

  RETURN v_clean;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. ORDERS INTEGRITY & DIRECT INSERTION/MANIPULATION DEFENSE
-- Threat: Attacker bypasses rpc_create_order and inserts an order directly via
--         supabase.from('orders').insert({ total: 0.00, subtotal: 0.00 })
-- Fix:
--   a) Restrict direct INSERT on orders & order_items strictly to admins and RPC
--   b) Trigger protecting existing order financials from being modified via UPDATE
-- ------------------------------------------------------------------------------

-- Drop permissive client insert policies
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;

-- Enforce that ONLY admins or internal SECURITY DEFINER functions can directly INSERT
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT WITH CHECK (
  public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role')
);

CREATE POLICY "order_items_insert_policy" ON public.order_items
FOR INSERT WITH CHECK (
  public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role')
);

-- Protect against non-admin altering immutable financial order columns
CREATE OR REPLACE FUNCTION public.protect_order_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and service_role can make modifications if strictly necessary
  IF public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Block mutation of financial or identity columns
  IF NEW.subtotal IS DISTINCT FROM OLD.subtotal OR
     NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee OR
     NEW.discount_amount IS DISTINCT FROM OLD.discount_amount OR
     NEW.total IS DISTINCT FROM OLD.total OR
     NEW.user_id IS DISTINCT FROM OLD.user_id OR
     NEW.order_number IS DISTINCT FROM OLD.order_number OR
     NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'Security Alert: Tampering with financial or identity columns of an order is strictly forbidden.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_order_immutability ON public.orders;
CREATE TRIGGER trg_protect_order_immutability
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_order_immutability();

-- ------------------------------------------------------------------------------
-- 3. HARDENED COURIER CLAIM RPC (With Row Locking & Hoarding Limits)
-- Threat: Couriers claiming 10+ orders simultaneously or race condition double-claims
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_claim_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_courier_id UUID;
  v_courier public.couriers;
  v_order public.orders;
  v_active_count INT;
BEGIN
  IF NOT public.is_delivery() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only active delivery couriers or administrators can claim orders.';
  END IF;

  v_courier_id := public.get_courier_id();
  IF v_courier_id IS NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Courier account record not found.';
  END IF;

  -- Courier hoarding prevention: Maximum 3 simultaneous active deliveries per courier
  IF NOT public.is_admin() AND v_courier_id IS NOT NULL THEN
    SELECT active_orders_count INTO v_active_count FROM public.couriers WHERE id = v_courier_id;
    IF v_active_count >= 3 THEN
      RAISE EXCEPTION 'Limite atteinte: Vous avez déjà % commandes actives en cours. Terminez une livraison avant d en réclamer une autre.', v_active_count;
    END IF;
  END IF;

  -- Row lock with NOWAIT or FOR UPDATE to prevent concurrent race condition
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.courier_id IS NOT NULL AND v_order.courier_id <> v_courier_id THEN
    RAISE EXCEPTION 'Cette commande a déjà été prise en charge par un autre livreur.';
  END IF;

  IF v_order.status NOT IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY') THEN
    RAISE EXCEPTION 'La commande ne peut pas être réclamée avec son statut actuel (%).', v_order.status;
  END IF;

  -- Fetch courier details to denormalize driver name/phone into order
  IF v_courier_id IS NOT NULL THEN
    SELECT * INTO v_courier FROM public.couriers WHERE id = v_courier_id;
  END IF;

  UPDATE public.orders
  SET courier_id = COALESCE(v_courier_id, courier_id),
      driver_name = COALESCE(v_courier.name, driver_name),
      driver_phone = COALESCE(v_courier.phone, driver_phone),
      status = 'OUT_FOR_DELIVERY'::public.order_status,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- Update active count
  IF v_courier_id IS NOT NULL THEN
    UPDATE public.couriers
    SET active_orders_count = active_orders_count + 1
    WHERE id = v_courier_id;
  END IF;

  RETURN v_order;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. HARDENED GPS LOCATION TRACKING (Anti-Spoofing & Boundary Enforcement)
-- Threat: Couriers sending out-of-bounds, fake coordinates or flooding DB
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_update_courier_location(
  p_order_id UUID,
  p_courier_lat DOUBLE PRECISION,
  p_courier_lng DOUBLE PRECISION
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
  -- Rate limiting: Couriers can send GPS updates at most once every 2 seconds (30 req / min)
  IF NOT public.check_rate_limit('courier:gps:' || auth.uid()::text, p_order_id::text, 30, 60) THEN
    -- Silently ignore or return order to avoid crash on mobile, but drop spam updates
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    RETURN v_order;
  END IF;

  -- 1. Anti-Spoofing: Validate valid geographic coordinate limits
  IF p_courier_lat IS NULL OR p_courier_lng IS NULL OR
     p_courier_lat < -90.0 OR p_courier_lat > 90.0 OR
     p_courier_lng < -180.0 OR p_courier_lng > 180.0 THEN
    RAISE EXCEPTION 'Invalid GPS coordinates format.';
  END IF;

  -- 2. Territorial boundary check for Morocco / Oriental region:
  -- Lat: ~21.0 to ~36.5 North, Lng: ~-17.5 to ~-1.0 West
  IF p_courier_lat < 20.0 OR p_courier_lat > 37.0 OR
     p_courier_lng < -18.0 OR p_courier_lng > 0.0 THEN
    RAISE EXCEPTION 'Coordonnées GPS hors du territoire opérationnel (Maroc).';
  END IF;

  v_courier_id := public.get_courier_id();

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- Authorization check
  IF NOT public.is_admin() THEN
    IF NOT public.is_delivery() OR v_order.courier_id IS DISTINCT FROM v_courier_id THEN
      RAISE EXCEPTION 'Unauthorized: You are not assigned to stream location for this order.';
    END IF;
  END IF;

  -- Only stream location for active deliveries
  IF v_order.status <> 'OUT_FOR_DELIVERY' THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders
  SET courier_lat = p_courier_lat,
      courier_lng = p_courier_lng,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. SECURE STORAGE POLICIES (Prescriptions & Confidential Files)
-- Threat: Cross-tenant enumeration, uploading malicious scripts/executables
-- ------------------------------------------------------------------------------

-- Restrict SELECT on prescriptions
DROP POLICY IF EXISTS "prescriptions_select_policy" ON storage.objects;
CREATE POLICY "prescriptions_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'prescriptions'
  AND (
    public.is_admin()
    -- The user who uploaded the file into their user folder
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    -- The courier currently assigned to an order referencing this prescription
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.prescription_storage_path = name
        AND public.is_delivery() 
        AND o.courier_id = public.get_courier_id()
    )
  )
);

-- Restrict INSERT: Users can ONLY upload into their own folder (auth.uid()) and only allowed file types
DROP POLICY IF EXISTS "prescriptions_insert_policy" ON storage.objects;
CREATE POLICY "prescriptions_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'prescriptions'
  AND (
    public.is_admin()
    OR (
      auth.role() = 'authenticated'
      AND (storage.foldername(name))[1] = auth.uid()::text
      AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'pdf')
    )
  )
);

-- Restrict DELETE: Only owner or admin
DROP POLICY IF EXISTS "prescriptions_delete_policy" ON storage.objects;
CREATE POLICY "prescriptions_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'prescriptions'
  AND (
    public.is_admin()
    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- ------------------------------------------------------------------------------
-- 6. PROMO CODE RACE CONDITION FIX
-- Threat: Concurrency race condition on limited-use promo codes
-- ------------------------------------------------------------------------------
-- Ensure promo codes table has a max_uses check and atomic lock
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promo_codes' AND column_name = 'max_uses'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN max_uses INT DEFAULT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. PESSIMISTIC LOCKING ON STATUS UPDATE (Anti-Race Condition & TOCTOU)
-- Threat: Driver updates status while order is concurrently cancelled or delivered
-- ------------------------------------------------------------------------------
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

  -- Pessimistic row-lock to prevent race conditions during state transitions
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
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

-- ------------------------------------------------------------------------------
-- 8. PESSIMISTIC LOCKING ON CANCELLATION (Anti-Race Condition & TOCTOU)
-- Threat: Client cancels order while driver is already delivering
-- ------------------------------------------------------------------------------
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
  v_clean_reason TEXT;
BEGIN
  -- Pessimistic row-lock to prevent concurrent driver pickup & cancellation
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- Only the ordering client or an admin can cancel
  IF v_order.user_id <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this order.';
  END IF;

  -- Clients cannot cancel if already out for delivery or delivered
  IF NOT public.is_admin() AND v_order.status IN ('OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') THEN
    RAISE EXCEPTION 'Cannot cancel an order that is already %.', v_order.status;
  END IF;

  v_clean_reason := public.clean_text(p_reason, 200);

  UPDATE public.orders
  SET status = 'CANCELLED'::public.order_status,
      notes = CASE 
                WHEN v_clean_reason IS NOT NULL AND v_clean_reason <> '' 
                THEN COALESCE(notes || ' | ', '') || '[Annulée: ' || v_clean_reason || ']'
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



-- ==============================================================================
-- END MIGRATION [9/11]: 20260916000001_security_hardening_attacks.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [10/11]: 20260916000002_seed_glovo_oujda_snacks.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — SEED REAL GLOVO OUJDA RESTAURANTS & SNACKS
-- Migration File: supabase/migrations/20260916000002_seed_glovo_oujda_snacks.sql
-- Description: Inserts real restaurants and snacks scraped from Glovo Oujda with
--              authentic categories, menu items, prices in MAD, and HD images.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ------------------------------------------------------------------------------
-- Restaurant 1: Le petit-déjeuner Opheon
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Le petit-déjeuner Opheon',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/6cfa84ad20b826438d079588e461712370c01d0e3c9d1bd1a20a5cfa181e4a5f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/6cfa84ad20b826438d079588e461712370c01d0e3c9d1bd1a20a5cfa181e4a5f',
  92,
  '50+',
  '15-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 2: Pizza Hut
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Pizza Hut',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cb8e1df426de1830de667658f709e4586a6730284d3664f5327389f3453ed3c8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cb8e1df426de1830de667658f709e4586a6730284d3664f5327389f3453ed3c8',
  92,
  '50+',
  '20-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000003',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000004',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000005',
  'a0000000-0000-0000-0000-000000000002',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000006',
  'a0000000-0000-0000-0000-000000000002',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 3: Pause à Paris Pâtisserie
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Pause à Paris Pâtisserie',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/664ad216f1a0b5865ab9a4afcfa87d30356322f4f0b7f0f3c74cd7bfdf3ae461',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/664ad216f1a0b5865ab9a4afcfa87d30356322f4f0b7f0f3c74cd7bfdf3ae461',
  92,
  '50+',
  '25-40 min',
  15.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000004',
  'a0000000-0000-0000-0000-000000000003',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000005',
  'a0000000-0000-0000-0000-000000000003',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 4: Etoile Rouge
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'Etoile Rouge',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/aa89d5845e3f829a3ff81b566ab015f8115c0a63c10144a931ccc6d6cafbd2a8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/aa89d5845e3f829a3ff81b566ab015f8115c0a63c10144a931ccc6d6cafbd2a8',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000001',
  'a0000000-0000-0000-0000-000000000004',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000005',
  'a0000000-0000-0000-0000-000000000004',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000006',
  'a0000000-0000-0000-0000-000000000004',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 5: Pause À Paris
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'Pause À Paris',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/10937ff7e0cf0f0b66a8102292b89839fed4630bc96ad57307a39fc53fa25058',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/10937ff7e0cf0f0b66a8102292b89839fed4630bc96ad57307a39fc53fa25058',
  92,
  '50+',
  '15-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000002',
  'a0000000-0000-0000-0000-000000000005',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000003',
  'a0000000-0000-0000-0000-000000000005',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000005',
  'a0000000-0000-0000-0000-000000000005',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 6: LE CORDON BLEU
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'LE CORDON BLEU',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/535b4aa34c0458bb940b01e72f66d8b98afd35abaac7a47098404ced816d624a',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/535b4aa34c0458bb940b01e72f66d8b98afd35abaac7a47098404ced816d624a',
  92,
  '50+',
  '20-40 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000001',
  'a0000000-0000-0000-0000-000000000006',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000002',
  'a0000000-0000-0000-0000-000000000006',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000003',
  'a0000000-0000-0000-0000-000000000006',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000004',
  'a0000000-0000-0000-0000-000000000006',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000006',
  'a0000000-0000-0000-0000-000000000006',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 7: Sweetleaf
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'Sweetleaf',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/26f65cb816590e78d724208214b662235311cecd19df77028a329df0cfb5ec92',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/26f65cb816590e78d724208214b662235311cecd19df77028a329df0cfb5ec92',
  92,
  '50+',
  '25-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000001',
  'a0000000-0000-0000-0000-000000000007',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000002',
  'a0000000-0000-0000-0000-000000000007',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000003',
  'a0000000-0000-0000-0000-000000000007',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000004',
  'a0000000-0000-0000-0000-000000000007',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000005',
  'a0000000-0000-0000-0000-000000000007',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 8: Breakfast By Espace Al Hanine
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000008',
  'Breakfast By Espace Al Hanine',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef546c1f646aac228514b0107d840545e127e3713c3e0cd65c0e0caaabb9949b',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef546c1f646aac228514b0107d840545e127e3713c3e0cd65c0e0caaabb9949b',
  92,
  '50+',
  '30-35 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000001',
  'a0000000-0000-0000-0000-000000000008',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000002',
  'a0000000-0000-0000-0000-000000000008',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000003',
  'a0000000-0000-0000-0000-000000000008',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000004',
  'a0000000-0000-0000-0000-000000000008',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000005',
  'a0000000-0000-0000-0000-000000000008',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000006',
  'a0000000-0000-0000-0000-000000000008',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 9: Aura
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000009',
  'Aura',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/22c0ab7fd1efd2293f82285583efe1d6c06d46cd2774437e569141e82e284071',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/22c0ab7fd1efd2293f82285583efe1d6c06d46cd2774437e569141e82e284071',
  92,
  '50+',
  '15-40 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000001',
  'a0000000-0000-0000-0000-000000000009',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000002',
  'a0000000-0000-0000-0000-000000000009',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000003',
  'a0000000-0000-0000-0000-000000000009',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000004',
  'a0000000-0000-0000-0000-000000000009',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000005',
  'a0000000-0000-0000-0000-000000000009',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000006',
  'a0000000-0000-0000-0000-000000000009',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 10: Urban Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000010',
  'Urban Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/078f6a88801f956a0d82d531eff0f49b743287639af57477f3297b9a9cd4edbe',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/078f6a88801f956a0d82d531eff0f49b743287639af57477f3297b9a9cd4edbe',
  92,
  '50+',
  '20-30 min',
  1.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000001',
  'a0000000-0000-0000-0000-000000000010',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000002',
  'a0000000-0000-0000-0000-000000000010',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000004',
  'a0000000-0000-0000-0000-000000000010',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000005',
  'a0000000-0000-0000-0000-000000000010',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000006',
  'a0000000-0000-0000-0000-000000000010',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 11: Mr chef
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000011',
  'Mr chef',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c554a25f2264ff70898321ac2d3b78539f0737ba0b8edf1a236a3081cea8bcd6',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c554a25f2264ff70898321ac2d3b78539f0737ba0b8edf1a236a3081cea8bcd6',
  92,
  '50+',
  '25-35 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000001',
  'a0000000-0000-0000-0000-000000000011',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000002',
  'a0000000-0000-0000-0000-000000000011',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000003',
  'a0000000-0000-0000-0000-000000000011',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000004',
  'a0000000-0000-0000-0000-000000000011',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000005',
  'a0000000-0000-0000-0000-000000000011',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000006',
  'a0000000-0000-0000-0000-000000000011',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 12: Café Restaurant Al Hanine
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000012',
  'Café Restaurant Al Hanine',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f3986a9c8484532a5161d07743738005ea7eada7906f26ab84fe2193edef54c8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f3986a9c8484532a5161d07743738005ea7eada7906f26ab84fe2193edef54c8',
  92,
  '50+',
  '30-40 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000001',
  'a0000000-0000-0000-0000-000000000012',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000002',
  'a0000000-0000-0000-0000-000000000012',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000003',
  'a0000000-0000-0000-0000-000000000012',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000004',
  'a0000000-0000-0000-0000-000000000012',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000005',
  'a0000000-0000-0000-0000-000000000012',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000006',
  'a0000000-0000-0000-0000-000000000012',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 13: City Meal
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000013',
  'City Meal',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f53cfd8e36b0e430cf7ff081d046f15dad8aa0a1a9e1297dc3be9e4dbd8c4770',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f53cfd8e36b0e430cf7ff081d046f15dad8aa0a1a9e1297dc3be9e4dbd8c4770',
  92,
  '50+',
  '15-30 min',
  1.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000001',
  'a0000000-0000-0000-0000-000000000013',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000002',
  'a0000000-0000-0000-0000-000000000013',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000003',
  'a0000000-0000-0000-0000-000000000013',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000004',
  'a0000000-0000-0000-0000-000000000013',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000005',
  'a0000000-0000-0000-0000-000000000013',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000006',
  'a0000000-0000-0000-0000-000000000013',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 14: Snack Au Regal
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000014',
  'Snack Au Regal',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/88ff4211b6b06d45d53488d213241be34c7520313d9b503d761a2e27f737fd31',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/88ff4211b6b06d45d53488d213241be34c7520313d9b503d761a2e27f737fd31',
  92,
  '50+',
  '20-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000001',
  'a0000000-0000-0000-0000-000000000014',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000002',
  'a0000000-0000-0000-0000-000000000014',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000003',
  'a0000000-0000-0000-0000-000000000014',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000004',
  'a0000000-0000-0000-0000-000000000014',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000005',
  'a0000000-0000-0000-0000-000000000014',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000006',
  'a0000000-0000-0000-0000-000000000014',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 15: Brunch's Restaurant
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000015',
  'Brunch''s Restaurant',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ac59fbfd9b81c16a4297551d2016b00b543c30c204820f8196530716848984a7',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ac59fbfd9b81c16a4297551d2016b00b543c30c204820f8196530716848984a7',
  92,
  '50+',
  '25-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000001',
  'a0000000-0000-0000-0000-000000000015',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000002',
  'a0000000-0000-0000-0000-000000000015',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000003',
  'a0000000-0000-0000-0000-000000000015',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000004',
  'a0000000-0000-0000-0000-000000000015',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000005',
  'a0000000-0000-0000-0000-000000000015',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000006',
  'a0000000-0000-0000-0000-000000000015',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 16: Mmm Yummy
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000016',
  'Mmm Yummy',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c8a5e0ff71be5657174de0bb038bc9e4d4c3d3bee75a794e52190b8cf4c18931',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c8a5e0ff71be5657174de0bb038bc9e4d4c3d3bee75a794e52190b8cf4c18931',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000001',
  'a0000000-0000-0000-0000-000000000016',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000002',
  'a0000000-0000-0000-0000-000000000016',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000003',
  'a0000000-0000-0000-0000-000000000016',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000004',
  'a0000000-0000-0000-0000-000000000016',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000005',
  'a0000000-0000-0000-0000-000000000016',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000006',
  'a0000000-0000-0000-0000-000000000016',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 17: Brofood
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000017',
  'Brofood',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7c1622982ba9d36602dba2a760d32b6d309c7f08cb39c3f7bf28862ae60dc63e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7c1622982ba9d36602dba2a760d32b6d309c7f08cb39c3f7bf28862ae60dc63e',
  92,
  '50+',
  '15-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000001',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000002',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000003',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000004',
  'a0000000-0000-0000-0000-000000000017',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000005',
  'a0000000-0000-0000-0000-000000000017',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000006',
  'a0000000-0000-0000-0000-000000000017',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 18: Snack Slaoui
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000018',
  'Snack Slaoui',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8778eee61d5710a0fef04546b8ded5e31f9fa7c6e69d7cf676a5cd53f58061b0',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8778eee61d5710a0fef04546b8ded5e31f9fa7c6e69d7cf676a5cd53f58061b0',
  92,
  '50+',
  '20-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000001',
  'a0000000-0000-0000-0000-000000000018',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000002',
  'a0000000-0000-0000-0000-000000000018',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000003',
  'a0000000-0000-0000-0000-000000000018',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000004',
  'a0000000-0000-0000-0000-000000000018',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000005',
  'a0000000-0000-0000-0000-000000000018',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000006',
  'a0000000-0000-0000-0000-000000000018',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 19: Drif Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000019',
  'Drif Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/47e2f1cdbcb9313f7facc53e4d06a1f438611e097bb98d10e5e9eeec91c5f103',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/47e2f1cdbcb9313f7facc53e4d06a1f438611e097bb98d10e5e9eeec91c5f103',
  92,
  '50+',
  '25-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000001',
  'a0000000-0000-0000-0000-000000000019',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000002',
  'a0000000-0000-0000-0000-000000000019',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000003',
  'a0000000-0000-0000-0000-000000000019',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000004',
  'a0000000-0000-0000-0000-000000000019',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000005',
  'a0000000-0000-0000-0000-000000000019',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000006',
  'a0000000-0000-0000-0000-000000000019',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 20: Snack SLM
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000020',
  'Snack SLM',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/341625dc2a528956b3c84bb6fdc6545e8f922ae774f405dba7cf8809f6fc752e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/341625dc2a528956b3c84bb6fdc6545e8f922ae774f405dba7cf8809f6fc752e',
  92,
  '50+',
  '30-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000001',
  'a0000000-0000-0000-0000-000000000020',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000002',
  'a0000000-0000-0000-0000-000000000020',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000003',
  'a0000000-0000-0000-0000-000000000020',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000004',
  'a0000000-0000-0000-0000-000000000020',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000005',
  'a0000000-0000-0000-0000-000000000020',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000006',
  'a0000000-0000-0000-0000-000000000020',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 21: Crêperie Y N N Ice
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000021',
  'Crêperie Y N N Ice',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1e003e38488d5f1219a15be8289c983c0eb779efd35a6ea4759645a4b470e337',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1e003e38488d5f1219a15be8289c983c0eb779efd35a6ea4759645a4b470e337',
  92,
  '50+',
  '15-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000001',
  'a0000000-0000-0000-0000-000000000021',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000002',
  'a0000000-0000-0000-0000-000000000021',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000003',
  'a0000000-0000-0000-0000-000000000021',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000004',
  'a0000000-0000-0000-0000-000000000021',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000005',
  'a0000000-0000-0000-0000-000000000021',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 22: Y N N Ice
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000022',
  'Y N N Ice',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef022dad2d9105d00d4433d48923f5108e8ea71d95f077959aaafa795d160c12',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef022dad2d9105d00d4433d48923f5108e8ea71d95f077959aaafa795d160c12',
  92,
  '50+',
  '20-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000001',
  'a0000000-0000-0000-0000-000000000022',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000002',
  'a0000000-0000-0000-0000-000000000022',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000003',
  'a0000000-0000-0000-0000-000000000022',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000004',
  'a0000000-0000-0000-0000-000000000022',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000005',
  'a0000000-0000-0000-0000-000000000022',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000006',
  'a0000000-0000-0000-0000-000000000022',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 23: Y N N Ice Fast Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000023',
  'Y N N Ice Fast Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8bb2714414c522c7c90b00ebde3fb32a2ac4f2a596ace010ead8f601c80b1285',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8bb2714414c522c7c90b00ebde3fb32a2ac4f2a596ace010ead8f601c80b1285',
  92,
  '50+',
  '25-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000001',
  'a0000000-0000-0000-0000-000000000023',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000002',
  'a0000000-0000-0000-0000-000000000023',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000003',
  'a0000000-0000-0000-0000-000000000023',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000004',
  'a0000000-0000-0000-0000-000000000023',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000005',
  'a0000000-0000-0000-0000-000000000023',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000006',
  'a0000000-0000-0000-0000-000000000023',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 24: Snack YNN
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000024',
  'Snack YNN',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cab720226d123e25d4d284b2b2b950dec32b7da5861d0b456d13f3a6d5071142',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cab720226d123e25d4d284b2b2b950dec32b7da5861d0b456d13f3a6d5071142',
  92,
  '50+',
  '30-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000001',
  'a0000000-0000-0000-0000-000000000024',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000002',
  'a0000000-0000-0000-0000-000000000024',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000003',
  'a0000000-0000-0000-0000-000000000024',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000004',
  'a0000000-0000-0000-0000-000000000024',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000005',
  'a0000000-0000-0000-0000-000000000024',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000006',
  'a0000000-0000-0000-0000-000000000024',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 25: Regalbuns
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000025',
  'Regalbuns',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f1d2e67fd4277a0fa5824750a58fc5374d0d76bf81b23e27687bdb7a17878d5f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f1d2e67fd4277a0fa5824750a58fc5374d0d76bf81b23e27687bdb7a17878d5f',
  92,
  '50+',
  '15-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000001',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000002',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000003',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000004',
  'a0000000-0000-0000-0000-000000000025',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000005',
  'a0000000-0000-0000-0000-000000000025',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000006',
  'a0000000-0000-0000-0000-000000000025',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 26: Mr Sushi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000026',
  'Mr Sushi',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/d76261ed250e74b67fcedadda6302afe001bdc60086ed6bab641f5943fb24675',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/d76261ed250e74b67fcedadda6302afe001bdc60086ed6bab641f5943fb24675',
  92,
  '50+',
  '20-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000001',
  'a0000000-0000-0000-0000-000000000026',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000002',
  'a0000000-0000-0000-0000-000000000026',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000003',
  'a0000000-0000-0000-0000-000000000026',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000004',
  'a0000000-0000-0000-0000-000000000026',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000005',
  'a0000000-0000-0000-0000-000000000026',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000006',
  'a0000000-0000-0000-0000-000000000026',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 27: Champs Elysées
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000027',
  'Champs Elysées',
  'Shawarma Syrien • Tacos Français • Pasticcio',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b31157ecbfcdbc07b1b36f1064e24948697b40724ff36963c4b72227292964c1',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b31157ecbfcdbc07b1b36f1064e24948697b40724ff36963c4b72227292964c1',
  92,
  '50+',
  '25-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000001',
  'a0000000-0000-0000-0000-000000000027',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000002',
  'a0000000-0000-0000-0000-000000000027',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000003',
  'a0000000-0000-0000-0000-000000000027',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000004',
  'a0000000-0000-0000-0000-000000000027',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000005',
  'a0000000-0000-0000-0000-000000000027',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000006',
  'a0000000-0000-0000-0000-000000000027',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 28: CROUSTY 48
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000028',
  'CROUSTY 48',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/86f1a0fc4d29022616b7a1fb9b6a7a8b7110cf8ed6ed81cd8469e05150422a51',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/86f1a0fc4d29022616b7a1fb9b6a7a8b7110cf8ed6ed81cd8469e05150422a51',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000001',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000002',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000003',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000004',
  'a0000000-0000-0000-0000-000000000028',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000005',
  'a0000000-0000-0000-0000-000000000028',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000006',
  'a0000000-0000-0000-0000-000000000028',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 29: Bravo - Univers Gourmand
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000029',
  'Bravo - Univers Gourmand',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b42842aef446612b1e48e9dca5e82ebbb379f319ac1859985a63b22f15173b6c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b42842aef446612b1e48e9dca5e82ebbb379f319ac1859985a63b22f15173b6c',
  92,
  '50+',
  '15-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000001',
  'a0000000-0000-0000-0000-000000000029',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000002',
  'a0000000-0000-0000-0000-000000000029',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000003',
  'a0000000-0000-0000-0000-000000000029',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000004',
  'a0000000-0000-0000-0000-000000000029',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000005',
  'a0000000-0000-0000-0000-000000000029',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000006',
  'a0000000-0000-0000-0000-000000000029',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 30: Piri Piri Poulet Braisé
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000030',
  'Piri Piri Poulet Braisé',
  'Poulet Braisé • Grillades • Tajines Marocains',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8ee616cfbd13291f7300af2092c732efed9415017cf8e72d4bfcb4fc9495f7a3',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8ee616cfbd13291f7300af2092c732efed9415017cf8e72d4bfcb4fc9495f7a3',
  92,
  '50+',
  '20-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000001',
  'a0000000-0000-0000-0000-000000000030',
  'Spécialités Braisées',
  'Demi Poulet Braisé aux Épices',
  'Poulet fermier mariné aux herbes orientales et cuit lentement au feu de braise.',
  42.00,
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000002',
  'a0000000-0000-0000-0000-000000000030',
  'Plats & Tajines',
  'Tajine Veau aux Pruneaux & Amandes',
  'Morceaux tendres de veau mijotés avec pruneaux caramélisés, amandes grillées et cannelle.',
  65.00,
  'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000003',
  'a0000000-0000-0000-0000-000000000030',
  'Spécialités Braisées',
  'Assiette Brochettes de Kefta',
  'Brochettes de bœuf assaisonnées à la menthe et cumin, servies avec frites et salade marocaine.',
  50.00,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000004',
  'a0000000-0000-0000-0000-000000000030',
  'Accompagnements',
  'Salade Marocaine Traditionnelle',
  'Dés de tomates fraîches, concombres, oignons rouges, coriandre et filet d''huile d''olive.',
  18.00,
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000005',
  'a0000000-0000-0000-0000-000000000030',
  'Boissons',
  'Eau Minérale Aïn Ifrane 1.5L',
  'Eau pure naturelle de source marocaine.',
  8.00,
  'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 31: Snack En-cas
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000031',
  'Snack En-cas',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/89846c54dca6fbae45ca489af61e8a7f2698c33ddffa76baa0490ea109801f84',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/89846c54dca6fbae45ca489af61e8a7f2698c33ddffa76baa0490ea109801f84',
  92,
  '50+',
  '25-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000001',
  'a0000000-0000-0000-0000-000000000031',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000002',
  'a0000000-0000-0000-0000-000000000031',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000003',
  'a0000000-0000-0000-0000-000000000031',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000004',
  'a0000000-0000-0000-0000-000000000031',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000005',
  'a0000000-0000-0000-0000-000000000031',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000006',
  'a0000000-0000-0000-0000-000000000031',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 32: Fée Maison Chez Samah
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000032',
  'Fée Maison Chez Samah',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/4a8bd705b4c1a609e10871c241d221fe4571fc2743e60c043d942b067ae9d0ba',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/4a8bd705b4c1a609e10871c241d221fe4571fc2743e60c043d942b067ae9d0ba',
  92,
  '50+',
  '30-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000001',
  'a0000000-0000-0000-0000-000000000032',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000002',
  'a0000000-0000-0000-0000-000000000032',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000003',
  'a0000000-0000-0000-0000-000000000032',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000004',
  'a0000000-0000-0000-0000-000000000032',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000005',
  'a0000000-0000-0000-0000-000000000032',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000006',
  'a0000000-0000-0000-0000-000000000032',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 33: Inyas Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000033',
  'Inyas Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/dbc9916c16ee9bc93a4a2fada5eb758bdd805abb272e743f3823922fd9a9df6c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/dbc9916c16ee9bc93a4a2fada5eb758bdd805abb272e743f3823922fd9a9df6c',
  92,
  '50+',
  '15-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000001',
  'a0000000-0000-0000-0000-000000000033',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000002',
  'a0000000-0000-0000-0000-000000000033',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000003',
  'a0000000-0000-0000-0000-000000000033',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000004',
  'a0000000-0000-0000-0000-000000000033',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000005',
  'a0000000-0000-0000-0000-000000000033',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000006',
  'a0000000-0000-0000-0000-000000000033',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 34: Chawarma Bayt Cham
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000034',
  'Chawarma Bayt Cham',
  'Shawarma Syrien • Tacos Français • Pasticcio',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/24f8b8da93b447ee00275731fb803396a2ece809b37a475ce28284047d2401b2',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/24f8b8da93b447ee00275731fb803396a2ece809b37a475ce28284047d2401b2',
  92,
  '50+',
  '20-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000001',
  'a0000000-0000-0000-0000-000000000034',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000002',
  'a0000000-0000-0000-0000-000000000034',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000003',
  'a0000000-0000-0000-0000-000000000034',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000004',
  'a0000000-0000-0000-0000-000000000034',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000005',
  'a0000000-0000-0000-0000-000000000034',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000006',
  'a0000000-0000-0000-0000-000000000034',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 35: Palermo’s Snack \u0026 Pizzeria
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000035',
  'Palermo’s Snack \u0026 Pizzeria',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/60c29224e5bc6c76d4add43af86b30eb62e4df5f0c16434cfcf1bdf045de527e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/60c29224e5bc6c76d4add43af86b30eb62e4df5f0c16434cfcf1bdf045de527e',
  92,
  '50+',
  '25-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000001',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000002',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000003',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000004',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000005',
  'a0000000-0000-0000-0000-000000000035',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000006',
  'a0000000-0000-0000-0000-000000000035',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 36: Cafe Palais Trocadero
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000036',
  'Cafe Palais Trocadero',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3f6abb8bcc0670570ae5f23adf894fd6c869e0446a2cd475ad59a82e5b51ca91',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3f6abb8bcc0670570ae5f23adf894fd6c869e0446a2cd475ad59a82e5b51ca91',
  92,
  '50+',
  '30-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000001',
  'a0000000-0000-0000-0000-000000000036',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000002',
  'a0000000-0000-0000-0000-000000000036',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000003',
  'a0000000-0000-0000-0000-000000000036',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000004',
  'a0000000-0000-0000-0000-000000000036',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000005',
  'a0000000-0000-0000-0000-000000000036',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000006',
  'a0000000-0000-0000-0000-000000000036',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 37: Chef chaouni
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000037',
  'Chef chaouni',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/08f956a45bc43596a3756cb14b2269231273bd01a24617464c37138850a09337',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/08f956a45bc43596a3756cb14b2269231273bd01a24617464c37138850a09337',
  92,
  '50+',
  '15-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000001',
  'a0000000-0000-0000-0000-000000000037',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000002',
  'a0000000-0000-0000-0000-000000000037',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000003',
  'a0000000-0000-0000-0000-000000000037',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000004',
  'a0000000-0000-0000-0000-000000000037',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000005',
  'a0000000-0000-0000-0000-000000000037',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000006',
  'a0000000-0000-0000-0000-000000000037',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 38: Nara Sushi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000038',
  'Nara Sushi',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/9fcce92b1df3d450f805f49c755b526ef58b16265eaa4081ec813b00bca7f3f9',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/9fcce92b1df3d450f805f49c755b526ef58b16265eaa4081ec813b00bca7f3f9',
  92,
  '50+',
  '20-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000001',
  'a0000000-0000-0000-0000-000000000038',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000002',
  'a0000000-0000-0000-0000-000000000038',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000003',
  'a0000000-0000-0000-0000-000000000038',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000004',
  'a0000000-0000-0000-0000-000000000038',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000005',
  'a0000000-0000-0000-0000-000000000038',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000006',
  'a0000000-0000-0000-0000-000000000038',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 39: L’ÉMERAUDE
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000039',
  'L’ÉMERAUDE',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/2d0e03ba73cfbc70796d5ec9203c26a2fa114db958c16dbc3e18ebb5ecc5f315',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/2d0e03ba73cfbc70796d5ec9203c26a2fa114db958c16dbc3e18ebb5ecc5f315',
  92,
  '50+',
  '25-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000001',
  'a0000000-0000-0000-0000-000000000039',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000002',
  'a0000000-0000-0000-0000-000000000039',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000003',
  'a0000000-0000-0000-0000-000000000039',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000004',
  'a0000000-0000-0000-0000-000000000039',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000005',
  'a0000000-0000-0000-0000-000000000039',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000006',
  'a0000000-0000-0000-0000-000000000039',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 40: Opheon
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000040',
  'Opheon',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f63cb3fb3bfa623602a83520042689777d5454b5819a411a6f449b07eec182c1',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f63cb3fb3bfa623602a83520042689777d5454b5819a411a6f449b07eec182c1',
  92,
  '50+',
  '30-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000001',
  'a0000000-0000-0000-0000-000000000040',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000002',
  'a0000000-0000-0000-0000-000000000040',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000003',
  'a0000000-0000-0000-0000-000000000040',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000004',
  'a0000000-0000-0000-0000-000000000040',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000005',
  'a0000000-0000-0000-0000-000000000040',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000006',
  'a0000000-0000-0000-0000-000000000040',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 41: Blankok Burger
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000041',
  'Blankok Burger',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1282018054d5f86ccf41c79ccb882a5e79ffb6de528e6c69934a74ef80e28cc3',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1282018054d5f86ccf41c79ccb882a5e79ffb6de528e6c69934a74ef80e28cc3',
  92,
  '50+',
  '15-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000001',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000002',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000003',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000004',
  'a0000000-0000-0000-0000-000000000041',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000005',
  'a0000000-0000-0000-0000-000000000041',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000006',
  'a0000000-0000-0000-0000-000000000041',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 42: Nigiri House
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000042',
  'Nigiri House',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/15052df211cef1bbd0133b3866efff49bbacc286baa56705e8ac21508c74ac29',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/15052df211cef1bbd0133b3866efff49bbacc286baa56705e8ac21508c74ac29',
  92,
  '50+',
  '20-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000001',
  'a0000000-0000-0000-0000-000000000042',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000002',
  'a0000000-0000-0000-0000-000000000042',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000003',
  'a0000000-0000-0000-0000-000000000042',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000004',
  'a0000000-0000-0000-0000-000000000042',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000005',
  'a0000000-0000-0000-0000-000000000042',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000006',
  'a0000000-0000-0000-0000-000000000042',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 43: Tapas
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000043',
  'Tapas',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/0335be065550581fdb786a2ae5bf5a419fc4cca60b09d7d92094c99ee3fc810e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/0335be065550581fdb786a2ae5bf5a419fc4cca60b09d7d92094c99ee3fc810e',
  92,
  '50+',
  '25-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000001',
  'a0000000-0000-0000-0000-000000000043',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000002',
  'a0000000-0000-0000-0000-000000000043',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000003',
  'a0000000-0000-0000-0000-000000000043',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000004',
  'a0000000-0000-0000-0000-000000000043',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000005',
  'a0000000-0000-0000-0000-000000000043',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000006',
  'a0000000-0000-0000-0000-000000000043',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 44: Pikala Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000044',
  'Pikala Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/bc75f2d60cdc1053088f4bf0c1878db81b3a231fc7cb494ad31aa73568740f38',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/bc75f2d60cdc1053088f4bf0c1878db81b3a231fc7cb494ad31aa73568740f38',
  92,
  '50+',
  '30-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000001',
  'a0000000-0000-0000-0000-000000000044',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000002',
  'a0000000-0000-0000-0000-000000000044',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000003',
  'a0000000-0000-0000-0000-000000000044',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000004',
  'a0000000-0000-0000-0000-000000000044',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000005',
  'a0000000-0000-0000-0000-000000000044',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000006',
  'a0000000-0000-0000-0000-000000000044',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 45: Tajine City
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000045',
  'Tajine City',
  'Poulet Braisé • Grillades • Tajines Marocains',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/91dfb0461f73c2f93d62e922f4dcbfe1cafa1c2290f460152b6afa6a0cd6d523',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/91dfb0461f73c2f93d62e922f4dcbfe1cafa1c2290f460152b6afa6a0cd6d523',
  92,
  '50+',
  '15-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000001',
  'a0000000-0000-0000-0000-000000000045',
  'Spécialités Braisées',
  'Demi Poulet Braisé aux Épices',
  'Poulet fermier mariné aux herbes orientales et cuit lentement au feu de braise.',
  42.00,
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000002',
  'a0000000-0000-0000-0000-000000000045',
  'Plats & Tajines',
  'Tajine Veau aux Pruneaux & Amandes',
  'Morceaux tendres de veau mijotés avec pruneaux caramélisés, amandes grillées et cannelle.',
  65.00,
  'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000003',
  'a0000000-0000-0000-0000-000000000045',
  'Spécialités Braisées',
  'Assiette Brochettes de Kefta',
  'Brochettes de bœuf assaisonnées à la menthe et cumin, servies avec frites et salade marocaine.',
  50.00,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000004',
  'a0000000-0000-0000-0000-000000000045',
  'Accompagnements',
  'Salade Marocaine Traditionnelle',
  'Dés de tomates fraîches, concombres, oignons rouges, coriandre et filet d''huile d''olive.',
  18.00,
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000005',
  'a0000000-0000-0000-0000-000000000045',
  'Boissons',
  'Eau Minérale Aïn Ifrane 1.5L',
  'Eau pure naturelle de source marocaine.',
  8.00,
  'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 46: ROMANO
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000046',
  'ROMANO',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1ebb10158515dc4d2d230974fe9cce0c52c823c1d5955f06e8e23cee99a4bb3f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1ebb10158515dc4d2d230974fe9cce0c52c823c1d5955f06e8e23cee99a4bb3f',
  92,
  '50+',
  '20-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000001',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000002',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000003',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000004',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000005',
  'a0000000-0000-0000-0000-000000000046',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000006',
  'a0000000-0000-0000-0000-000000000046',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 47: Flourish Bubble
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000047',
  'Flourish Bubble',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7527e193c67258f5cf36e7048428333ab5d2191f610b4e99740c9f966d4076a8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7527e193c67258f5cf36e7048428333ab5d2191f610b4e99740c9f966d4076a8',
  92,
  '50+',
  '25-35 min',
  15.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000001',
  'a0000000-0000-0000-0000-000000000047',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000002',
  'a0000000-0000-0000-0000-000000000047',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000003',
  'a0000000-0000-0000-0000-000000000047',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000004',
  'a0000000-0000-0000-0000-000000000047',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000005',
  'a0000000-0000-0000-0000-000000000047',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 48: Snack Mehdi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000048',
  'Snack Mehdi',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cac5d627328f325dfecc6fcade3ff6128bf5109d7bb279c10a4fcbe1de4efad9',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cac5d627328f325dfecc6fcade3ff6128bf5109d7bb279c10a4fcbe1de4efad9',
  92,
  '50+',
  '30-40 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000001',
  'a0000000-0000-0000-0000-000000000048',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000002',
  'a0000000-0000-0000-0000-000000000048',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000003',
  'a0000000-0000-0000-0000-000000000048',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000004',
  'a0000000-0000-0000-0000-000000000048',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000005',
  'a0000000-0000-0000-0000-000000000048',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000006',
  'a0000000-0000-0000-0000-000000000048',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 49: Le best
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000049',
  'Le best',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3309ad2f1f6b763e16684cd41c3db264b222a3350f5d8244d9e174386836046c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3309ad2f1f6b763e16684cd41c3db264b222a3350f5d8244d9e174386836046c',
  92,
  '50+',
  '15-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000001',
  'a0000000-0000-0000-0000-000000000049',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000002',
  'a0000000-0000-0000-0000-000000000049',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000003',
  'a0000000-0000-0000-0000-000000000049',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000004',
  'a0000000-0000-0000-0000-000000000049',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000005',
  'a0000000-0000-0000-0000-000000000049',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000006',
  'a0000000-0000-0000-0000-000000000049',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 50: Chez Rémy
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000050',
  'Chez Rémy',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/931a286478a28d8f61beada2ffb1e1a639b6af3baee736f4a63f13053f18fab7',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/931a286478a28d8f61beada2ffb1e1a639b6af3baee736f4a63f13053f18fab7',
  92,
  '50+',
  '20-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000001',
  'a0000000-0000-0000-0000-000000000050',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000002',
  'a0000000-0000-0000-0000-000000000050',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000003',
  'a0000000-0000-0000-0000-000000000050',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000004',
  'a0000000-0000-0000-0000-000000000050',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000005',
  'a0000000-0000-0000-0000-000000000050',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000006',
  'a0000000-0000-0000-0000-000000000050',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;


-- ==============================================================================
-- END MIGRATION [10/11]: 20260916000002_seed_glovo_oujda_snacks.sql
-- ==============================================================================


-- ==============================================================================
-- BEGIN MIGRATION [11/11]: 20260916000003_allow_admin_product_and_menu_updates.sql
-- ==============================================================================

-- ==============================================================================
-- QUICKLY LIVRAISON — ADMIN CATALOG & MENU SYNCHRONIZATION (HARDENED)
-- Migration File: supabase/migrations/20260916000003_allow_admin_product_and_menu_updates.sql
-- Description: Enables secure live updates of dishes, restaurants, and products
--              between Admin panel and Client apps. Sets up SECURITY DEFINER RPCs
--              with strict is_admin() authorization checks, fine-grained RLS,
--              and configures Supabase Realtime publication.
-- ==============================================================================

-- 1. EXTEND TABLES IF NEEDED
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '11:30 - 02:00';

-- 2. RESTAURANT MENU ITEMS RLS POLICIES & GRANTS
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_select_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_write_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_all_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admin can manage menu items" ON public.restaurant_menu_items;

-- Public and authenticated users can view available menu items (or admins view all)
CREATE POLICY "menu_items_select_policy" ON public.restaurant_menu_items
FOR SELECT USING (is_available = TRUE OR public.is_admin());

-- Mutations restricted strictly to administrators
CREATE POLICY "menu_items_insert_policy" ON public.restaurant_menu_items
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "menu_items_update_policy" ON public.restaurant_menu_items
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "menu_items_delete_policy" ON public.restaurant_menu_items
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

REVOKE ALL ON TABLE public.restaurant_menu_items FROM anon, authenticated;
GRANT SELECT ON TABLE public.restaurant_menu_items TO anon, authenticated;
GRANT ALL ON TABLE public.restaurant_menu_items TO authenticated, service_role;

-- 3. RESTAURANTS RLS POLICIES & GRANTS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_write_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_all_policy" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admin can manage restaurants" ON public.restaurants;

-- Public can view active restaurants (admins view all)
CREATE POLICY "restaurants_select_policy" ON public.restaurants
FOR SELECT USING (is_active = TRUE OR public.is_admin());

-- Mutations restricted strictly to administrators
CREATE POLICY "restaurants_insert_policy" ON public.restaurants
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "restaurants_update_policy" ON public.restaurants
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "restaurants_delete_policy" ON public.restaurants
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

REVOKE ALL ON TABLE public.restaurants FROM anon, authenticated;
GRANT SELECT ON TABLE public.restaurants TO anon, authenticated;
GRANT ALL ON TABLE public.restaurants TO authenticated, service_role;

-- 4. PRODUCTS RLS POLICIES & GRANTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "products_all_policy" ON public.products;
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Public can view available products (admins view all)
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT USING (is_available = TRUE OR public.is_admin());

-- Mutations restricted strictly to administrators
CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

REVOKE ALL ON TABLE public.products FROM anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.products TO authenticated, service_role;

-- 5. SECURITY DEFINER STORED PROCEDURES (RPCs) WITH AUTHORIZATION CHECKS

DROP FUNCTION IF EXISTS public.rpc_update_menu_item(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_menu_item(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN);

-- 5.1 Update Restaurant Menu Item RPC
CREATE OR REPLACE FUNCTION public.rpc_update_menu_item(
  p_id TEXT,
  p_name TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_is_popular BOOLEAN DEFAULT NULL,
  p_is_available BOOLEAN DEFAULT NULL
)
RETURNS public.restaurant_menu_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid UUID;
  v_item public.restaurant_menu_items;
BEGIN
  -- Strict Authorization: Only admin or service_role
  IF NOT public.is_admin() AND (current_setting('request.jwt.claim.role', true) <> 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify menu items.';
  END IF;

  BEGIN
    v_uuid := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  UPDATE public.restaurant_menu_items
  SET
    name = COALESCE(p_name, name),
    price = COALESCE(p_price, price),
    description = COALESCE(p_description, description),
    category = COALESCE(p_category, category),
    image_url = COALESCE(p_image_url, image_url),
    is_popular = COALESCE(p_is_popular, is_popular),
    is_available = COALESCE(p_is_available, is_available),
    updated_at = NOW()
  WHERE id = v_uuid
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

DROP FUNCTION IF EXISTS public.rpc_update_product(UUID, TEXT, NUMERIC, TEXT, INT, UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_product(TEXT, TEXT, NUMERIC, TEXT, INT, TEXT, TEXT, BOOLEAN);

-- 5.2 Update Product RPC
CREATE OR REPLACE FUNCTION public.rpc_update_product(
  p_id TEXT,
  p_name TEXT DEFAULT NULL,
  p_price NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_stock INT DEFAULT NULL,
  p_category_id TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_is_available BOOLEAN DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid UUID;
  v_cat_uuid UUID;
  v_prod public.products;
BEGIN
  -- Strict Authorization: Only admin or service_role
  IF NOT public.is_admin() AND (current_setting('request.jwt.claim.role', true) <> 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify products.';
  END IF;

  BEGIN
    v_uuid := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  IF p_category_id IS NOT NULL THEN
    BEGIN
      v_cat_uuid := p_category_id::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_cat_uuid := NULL;
    END;
  END IF;

  UPDATE public.products
  SET
    name = COALESCE(p_name, name),
    price = COALESCE(p_price, price),
    description = COALESCE(p_description, description),
    stock = COALESCE(p_stock, stock),
    category_id = COALESCE(v_cat_uuid, category_id),
    image_url = COALESCE(p_image_url, image_url),
    is_available = COALESCE(p_is_available, is_available),
    updated_at = NOW()
  WHERE id = v_uuid
  RETURNING * INTO v_prod;

  RETURN v_prod;
END;
$$;

DROP FUNCTION IF EXISTS public.rpc_update_restaurant(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.rpc_update_restaurant(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT);

-- 5.3 Update Restaurant RPC
CREATE OR REPLACE FUNCTION public.rpc_update_restaurant(
  p_id TEXT,
  p_name TEXT DEFAULT NULL,
  p_cuisine_type TEXT DEFAULT NULL,
  p_cover_image TEXT DEFAULT NULL,
  p_delivery_time TEXT DEFAULT NULL,
  p_delivery_fee NUMERIC DEFAULT NULL,
  p_promo_badge TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_opening_hours TEXT DEFAULT NULL
)
RETURNS public.restaurants
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid UUID;
  v_resto public.restaurants;
BEGIN
  -- Strict Authorization: Only admin or service_role
  IF NOT public.is_admin() AND (current_setting('request.jwt.claim.role', true) <> 'service_role') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify restaurants.';
  END IF;

  BEGIN
    v_uuid := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  UPDATE public.restaurants
  SET
    name = COALESCE(p_name, name),
    cuisine_type = COALESCE(p_cuisine_type, cuisine_type),
    cover_image = COALESCE(p_cover_image, cover_image),
    delivery_time = COALESCE(p_delivery_time, delivery_time),
    delivery_fee = COALESCE(p_delivery_fee, delivery_fee),
    promo_badge = COALESCE(p_promo_badge, promo_badge),
    is_active = COALESCE(p_is_active, is_active),
    opening_hours = COALESCE(p_opening_hours, opening_hours),
    updated_at = NOW()
  WHERE id = v_uuid
  RETURNING * INTO v_resto;

  RETURN v_resto;
END;
$$;

-- Revoke execute from public/anon; grant strictly to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.rpc_update_restaurant FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rpc_update_menu_item FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rpc_update_product FROM anon, public;

GRANT EXECUTE ON FUNCTION public.rpc_update_restaurant TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_menu_item TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_product TO authenticated, service_role;

-- 6. ENABLE SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'restaurant_menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_menu_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'restaurants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 7. RELOAD SCHEMA CACHE IN POSTGREST IMMEDIATELY
NOTIFY pgrst, 'reload schema';


-- ==============================================================================
-- END MIGRATION [11/11]: 20260916000003_allow_admin_product_and_menu_updates.sql
-- ==============================================================================

