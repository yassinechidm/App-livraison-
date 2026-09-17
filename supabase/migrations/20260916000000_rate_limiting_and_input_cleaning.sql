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

