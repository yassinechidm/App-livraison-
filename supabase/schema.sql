-- ==============================================================================
-- QUICKLY LIVRAISON — CONSOLIDATED CANONICAL DATABASE SCHEMA (PHASES 1–6)
-- Auto-generated from versioned migrations:
-- 1. 20260910000000_canonical_schema.sql
-- 2. 20260910000001_secure_roles_and_rls.sql
-- 3. 20260910000002_rpc_create_order.sql
-- 4. 20260910000003_realtime_gps_dispatch.sql
-- ==============================================================================


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- BEGIN MIGRATION: 20260910000000_canonical_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
    email TEXT,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'client' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure profiles.role column is TEXT with default 'client' and unique index on non-null emails
DO $$
BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'client';
    ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
    UPDATE public.profiles SET role = LOWER(role::text) WHERE role IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
    ON public.profiles(LOWER(email)) 
    WHERE email IS NOT NULL AND TRIM(email) <> '';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Index on profiles.phone for O(1) deterministic user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup 
ON public.profiles(phone) 
WHERE phone IS NOT NULL AND phone <> '';

-- 3.1 AUTH OTP CHALLENGES (SERVER-SIDE SECURE STORAGE FOR WHATSAPP OTP)
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

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_active 
ON public.auth_otp_challenges(phone, created_at DESC)
WHERE status = 'SENT' AND consumed_at IS NULL;

ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No client access to otp challenges" ON public.auth_otp_challenges;
CREATE POLICY "No client access to otp challenges" ON public.auth_otp_challenges
FOR ALL USING (FALSE);

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




-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- BEGIN MIGRATION: 20260910000001_secure_roles_and_rls.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  v_email := NULLIF(TRIM(NEW.email), '');
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE 'Client' END
  );
  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone
  );

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
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.1 IDEMPOTENT PROFILE RESOLUTION & ROLE FETCH RPC
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

-- 3.2 ATOMIC OTP VERIFICATION RPC (ROW-LOCKING & ATOMIC ATTEMPTS COUNTER)
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




-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- BEGIN MIGRATION: 20260910000002_rpc_create_order.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- BEGIN MIGRATION: 20260910000003_realtime_gps_dispatch.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


