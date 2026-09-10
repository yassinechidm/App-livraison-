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
