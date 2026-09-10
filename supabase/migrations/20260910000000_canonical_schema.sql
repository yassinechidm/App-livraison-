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

