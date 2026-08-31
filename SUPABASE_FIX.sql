-- ==========================================================
-- QUICK LIVRAISON - MIGRATION SUPABASE OBLIGATOIRE
-- Copiez et collez tout ce contenu dans :
-- Supabase Dashboard → SQL Editor → Cliquez sur "Run"
-- ==========================================================

-- 1. MODIFIER LE TYPE DE PAIEMENT POUR ACCEPTER 'TRANSFER'
DO $$
BEGIN
  ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'TRANSFER';
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 2. ASSOUPLIR LA TABLE ORDERS (Permet les commandes sans compte Supabase Auth obligatoire)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 3. AJOUTER LES COLONNES MANQUANTES DANS ORDERS
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'DELIVERY',
  ADD COLUMN IF NOT EXISTS driver_name TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone TEXT,
  ADD COLUMN IF NOT EXISTS courier_id UUID,
  ADD COLUMN IF NOT EXISTS rating INT,
  ADD COLUMN IF NOT EXISTS review_text TEXT;

-- 4. ASSOUPLIR ET METTRE À JOUR ORDER_ITEMS
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items ALTER COLUMN product_id TYPE TEXT;
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS selected_customizations_text TEXT,
  ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- 5. CRÉER LA TABLE COURSIERS (SI NON EXISTANTE)
CREATE TABLE IF NOT EXISTS couriers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT DEFAULT '🛵 Scooter',
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  active_orders_count INT DEFAULT 0 NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 5.0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. CRÉER LA TABLE CODES PROMO (SI NON EXISTANTE)
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'PERCENT',
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  usage_count INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. DÉSACTIVER LES RESTRICTIONS RLS BLOQUANTES POUR ORDERS ET PERMETTRE L'ACCÈS TOTAL
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view and manage all orders" ON orders;
DROP POLICY IF EXISTS "Public order insert" ON orders;
DROP POLICY IF EXISTS "Public order select" ON orders;
DROP POLICY IF EXISTS "Public order update" ON orders;
DROP POLICY IF EXISTS "Public order delete" ON orders;
DROP POLICY IF EXISTS "orders_full_access" ON orders;

-- Politique universelle pour ORDERS : autorise la création et la lecture par le client et l'admin
CREATE POLICY "orders_full_access" ON orders
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Supprimer les anciennes politiques restrictives pour ORDER_ITEMS
DROP POLICY IF EXISTS "Users can view items of their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Public order_items insert" ON order_items;
DROP POLICY IF EXISTS "Public order_items select" ON order_items;
DROP POLICY IF EXISTS "Public order_items delete" ON order_items;
DROP POLICY IF EXISTS "order_items_full_access" ON order_items;

-- Politique universelle pour ORDER_ITEMS
CREATE POLICY "order_items_full_access" ON order_items
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Politiques pour COURIERS
DROP POLICY IF EXISTS "Admins can manage couriers" ON couriers;
DROP POLICY IF EXISTS "Anyone can view couriers" ON couriers;
DROP POLICY IF EXISTS "couriers_full_access" ON couriers;
CREATE POLICY "couriers_full_access" ON couriers
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Politiques pour PROMO_CODES
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
DROP POLICY IF EXISTS "promo_codes_full_access" ON promo_codes;
CREATE POLICY "promo_codes_full_access" ON promo_codes
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- 8. COURSIERS PAR DÉFAUT POUR OUJDA
INSERT INTO couriers (name, phone, vehicle, is_available, rating) VALUES
  ('Mehdi Alami', '+212 6 11 22 33 44', '🛵 Scooter Yamaha', TRUE, 4.9),
  ('Yassine Berrada', '+212 6 55 66 77 88', '🛵 Scooter Honda', TRUE, 4.8),
  ('Omar Mansouri', '+212 6 99 00 11 22', '🚗 Dacia Express', TRUE, 5.0)
ON CONFLICT DO NOTHING;
