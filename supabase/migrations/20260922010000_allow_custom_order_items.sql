-- ==============================================================================
-- QUICKLY LIVRAISON — ALLOW CUSTOM ORDER ITEMS (PRESCRIPTIONS, GROCERIES, PARCELS)
-- File: supabase/migrations/20260922010000_allow_custom_order_items.sql
-- Description: Drops NOT NULL constraint on order_items.product_id so custom
--              order requests (pharmacy prescriptions, direct groceries, parcels)
--              can be created cleanly without referencing catalog products.
-- ==============================================================================

BEGIN;

-- 1. Make product_id in order_items nullable while preserving foreign key integrity
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;

-- 2. Ensure menu_item_id is also nullable if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'menu_item_id'
  ) THEN
    ALTER TABLE public.order_items ALTER COLUMN menu_item_id DROP NOT NULL;
  END IF;
END $$;

COMMIT;

-- 3. Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';

