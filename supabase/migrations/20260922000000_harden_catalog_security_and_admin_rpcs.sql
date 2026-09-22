-- ==============================================================================
-- QUICKLY LIVRAISON — PRODUCTION CATALOG HARDENING & SECURITY REMEDIATION
-- File: supabase/migrations/20260922000000_harden_catalog_security_and_admin_rpcs.sql
-- Description: Completely purges permissive RLS bypass policies, revokes anon
--              mutation grants, enforces strict is_admin() checks inside
--              SECURITY DEFINER RPCs, and configures realtime publications.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. DEFENSIVE TABLE EXTENSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT DEFAULT '11:30 - 02:00';


-- ==============================================================================
-- 2. RESTAURANT MENU ITEMS — CLEANUP, POLICIES & GRANTS
-- ==============================================================================
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

-- 2.1 Drop all existing legacy, permissive, and redundant policies
DROP POLICY IF EXISTS "menu_items_all_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_write_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_insert" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_update" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_delete" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_select" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_select_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.restaurant_menu_items;
DROP POLICY IF EXISTS "Admin can manage menu items" ON public.restaurant_menu_items;

-- 2.2 Create canonical hardened RLS policies
CREATE POLICY "menu_items_select_policy" ON public.restaurant_menu_items
FOR SELECT USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "menu_items_insert_policy" ON public.restaurant_menu_items
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "menu_items_update_policy" ON public.restaurant_menu_items
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "menu_items_delete_policy" ON public.restaurant_menu_items
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

-- 2.3 Table Grants
REVOKE ALL ON TABLE public.restaurant_menu_items FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.restaurant_menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.restaurant_menu_items TO authenticated;
GRANT ALL ON TABLE public.restaurant_menu_items TO service_role;


-- ==============================================================================
-- 3. RESTAURANTS — CLEANUP, POLICIES & GRANTS
-- ==============================================================================
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 3.1 Drop all existing legacy, permissive, and redundant policies
DROP POLICY IF EXISTS "restaurants_all_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_write_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_select" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Admin can manage restaurants" ON public.restaurants;

-- 3.2 Create canonical hardened RLS policies
CREATE POLICY "restaurants_select_policy" ON public.restaurants
FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "restaurants_insert_policy" ON public.restaurants
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "restaurants_update_policy" ON public.restaurants
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "restaurants_delete_policy" ON public.restaurants
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

-- 3.3 Table Grants
REVOKE ALL ON TABLE public.restaurants FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.restaurants TO authenticated;
GRANT ALL ON TABLE public.restaurants TO service_role;


-- ==============================================================================
-- 4. PRODUCTS — CLEANUP, POLICIES & GRANTS
-- ==============================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4.1 Drop all existing legacy, permissive, and redundant policies
DROP POLICY IF EXISTS "products_all_policy" ON public.products;
DROP POLICY IF EXISTS "products_write_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- 4.2 Create canonical hardened RLS policies
CREATE POLICY "products_select_policy" ON public.products
FOR SELECT USING (is_available = TRUE OR public.is_admin());

CREATE POLICY "products_insert_policy" ON public.products
FOR INSERT WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "products_update_policy" ON public.products
FOR UPDATE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'))
WITH CHECK (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

CREATE POLICY "products_delete_policy" ON public.products
FOR DELETE USING (public.is_admin() OR (current_setting('request.jwt.claim.role', true) = 'service_role'));

-- 4.3 Table Grants
REVOKE ALL ON TABLE public.products FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


-- ==============================================================================
-- 5. HARDENED SECURITY DEFINER RPCs (WITH INTERNAL AUTHORIZATION)
-- ==============================================================================

-- 5.1 Update Restaurant Menu Item
DROP FUNCTION IF EXISTS public.rpc_update_menu_item(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_menu_item(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN);

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

-- 5.2 Update Product
DROP FUNCTION IF EXISTS public.rpc_update_product(UUID, TEXT, NUMERIC, TEXT, INT, UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.rpc_update_product(TEXT, TEXT, NUMERIC, TEXT, INT, TEXT, TEXT, BOOLEAN);

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

-- 5.3 Update Restaurant
DROP FUNCTION IF EXISTS public.rpc_update_restaurant(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.rpc_update_restaurant(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT);

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

-- 5.4 Revoke execute from PUBLIC and anon roles
REVOKE EXECUTE ON FUNCTION public.rpc_update_restaurant(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_update_menu_item(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_update_product(TEXT, TEXT, NUMERIC, TEXT, INT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;

-- 5.5 Grant execute strictly to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.rpc_update_restaurant(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_menu_item(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_update_product(TEXT, TEXT, NUMERIC, TEXT, INT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;


-- ==============================================================================
-- 6. REALTIME PUBLICATION CONFIGURATION
-- ==============================================================================
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

COMMIT;

-- 7. NOTIFY POSTGREST SCHEMA CACHE TO RELOAD IMMEDIATELY
NOTIFY pgrst, 'reload schema';

