-- ==============================================================================
-- QUICKLY LIVRAISON — ADMIN CATALOG & MENU SYNCHRONIZATION
-- Migration File: supabase/migrations/20260916000003_allow_admin_product_and_menu_updates.sql
-- Description: Enables seamless live updates of dishes, restaurants, and products
--              between Admin panel and Client apps. Sets up SECURITY DEFINER RPCs
--              and configures Supabase Realtime publication.
-- ==============================================================================

-- 1. EXTEND TABLES IF NEEDED
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '11:30 - 02:00';

-- 2. RESTAURANT MENU ITEMS RLS POLICIES & GRANTS
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_select_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_write_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_all_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admin can manage menu items" ON public.restaurant_menu_items;

CREATE POLICY "menu_items_select_policy" ON public.restaurant_menu_items
FOR SELECT USING (TRUE);

CREATE POLICY "menu_items_all_policy" ON public.restaurant_menu_items
FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.restaurant_menu_items TO anon, authenticated, service_role;

-- 3. RESTAURANTS RLS POLICIES & GRANTS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_write_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_all_policy" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admin can manage restaurants" ON public.restaurants;

CREATE POLICY "restaurants_select_policy" ON public.restaurants
FOR SELECT USING (TRUE);

CREATE POLICY "restaurants_all_policy" ON public.restaurants
FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.restaurants TO anon, authenticated, service_role;

-- 4. PRODUCTS RLS POLICIES & GRANTS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "products_all_policy" ON public.products;
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "products_select_policy" ON public.products
FOR SELECT USING (TRUE);

CREATE POLICY "products_all_policy" ON public.products
FOR ALL USING (TRUE) WITH CHECK (TRUE);

GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;

-- 5. SECURITY DEFINER STORED PROCEDURES (RPCs) FOR GUARANTEED COMMITS

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

GRANT EXECUTE ON FUNCTION public.rpc_update_restaurant TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_menu_item TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_product TO anon, authenticated, service_role;

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
