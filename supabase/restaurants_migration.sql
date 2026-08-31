-- ==============================================================================
-- MIGRATION SUPABASE : RESTAURANTS & PLATS (SNACKS OUJDA)
-- À exécuter dans : https://supabase.com/dashboard/project/srgzjplfzunkgjqmgtub/sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine_type TEXT NOT NULL,
  logo_url TEXT,
  cover_image TEXT,
  rating_percent INT DEFAULT 95,
  rating_count TEXT DEFAULT '500+',
  delivery_time TEXT DEFAULT '20-35 min',
  delivery_fee NUMERIC(10, 2) DEFAULT 15.00 NOT NULL,
  free_delivery_threshold NUMERIC(10, 2) DEFAULT 100.00,
  promo_badge TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Top des ventes',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_popular BOOLEAN DEFAULT TRUE NOT NULL,
  order_count_badge TEXT,
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Activation RLS & Politiques d'accès public
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;
CREATE POLICY "Public can view active restaurants" ON restaurants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view menu items" ON restaurant_menu_items;
CREATE POLICY "Public can view menu items" ON restaurant_menu_items FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admin can manage restaurants" ON restaurants;
CREATE POLICY "Admin can manage restaurants" ON restaurants FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Admin can manage menu items" ON restaurant_menu_items;
CREATE POLICY "Admin can manage menu items" ON restaurant_menu_items FOR ALL USING (TRUE);
