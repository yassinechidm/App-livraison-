-- ==========================================================
-- QUICK LIVRAISON - SCHÉMA DE BASE DE DONNÉES SUPABASE POSTGRESQL
-- Application de commande et livraison style Glovo (Client + Admin)
-- ==========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPES ENUM
CREATE TYPE user_role AS ENUM ('CLIENT', 'ADMIN');

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'CARD');

-- 3. TABLE DES PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'CLIENT'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLE DES CATÉGORIES DE PRODUITS
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  emoji TEXT DEFAULT '📦',
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABLE DES PRODUITS SUPERMARCHÉ
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INT DEFAULT 100 NOT NULL CHECK (stock >= 0),
  is_available BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5B. TABLE DES RESTAURANTS & SNACKS (MODULE GLOVO)
CREATE TABLE IF NOT EXISTS restaurants (
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

-- 5C. TABLE DES PLATS & ARTICLES DE MENU
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

-- 6. TABLE DES ADRESSES CLIENTS
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT 'Maison', -- 'Maison', 'Travail', 'Autre'
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Oujda' NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TABLE DES COMMANDES
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE, -- ex: CMD-2026-001025
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  delivery_address_text TEXT NOT NULL,
  status order_status DEFAULT 'PENDING'::order_status NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) DEFAULT 15.00 NOT NULL CHECK (delivery_fee >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  payment_method payment_method DEFAULT 'CASH'::payment_method NOT NULL,
  notes TEXT,
  estimated_delivery_minutes INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. TABLE DES ARTICLES DE COMMANDE (Prix figé au moment de l'achat)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0)
);

-- 9. ACTIVATION DE ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 10. POLITIQUES DE SÉCURITÉ (RLS POLICIES)

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Categories
CREATE POLICY "Anyone can view active categories" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Products
CREATE POLICY "Anyone can view available products" ON products
  FOR SELECT USING (is_available = TRUE);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Addresses
CREATE POLICY "Users can manage their own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Order Items
CREATE POLICY "Users can view items of their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- 11. DONNÉES INITIALES (SEED DATA - OUJDA)

INSERT INTO categories (id, name, description, emoji, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Food & Resto', 'Burgers, Pizzas, Plats marocains et Sandwichs à Oujda', '🍔', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Supermarché & Courses', 'Produits frais, épicerie, boissons et produits ménagers', '🛒', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Pharmacie & Soins', 'Médicaments sans ordonnance, hygiène et soins bébé', '💊', TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Boulangerie & Pâtisserie', 'Pains traditionnels, viennoiseries et gâteaux d''Oujda', '🥐', TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Colis & Coursier Express', 'Envoi de plis, documents et petits colis d''un point A à B', '📦', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (category_id, name, description, price, stock, is_available) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Menu Burger Double Cheese Oujda', 'Double steak pur bœuf grillé, cheddar fondu, sauce maison et frites croustillantes', 55.00, 50, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'Pizza Royale Fruits de Mer', 'Sauce tomate basilic, mozzarella di bufala, crevettes, calamars et olives', 70.00, 30, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'Tajine Traditionnel Viande & Pruneaux', 'Tajine mijoté à l''orientale avec amandes grillées et pain maison', 65.00, 20, TRUE),
  ('11111111-1111-1111-1111-111111111111', 'Tacos Spécial Oujda Maxi XL', 'Viande hachée, poulet mariné, cordon bleu, frites et sauce fromagère', 48.00, 45, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Pack Eau Minérale Ain Ifrane (6x1.5L)', 'Pack de 6 bouteilles d''eau minérale naturelle', 32.00, 100, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Lait Centrale Danone Demi-Écrémé (1L)', 'Brique de lait frais pasteurisé', 10.00, 150, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Huile d''Olive Vierge Berkane (1L)', 'Huile d''olive de première pression à froid de la région de l''Oriental', 85.00, 40, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Doliprane 1000mg (Boîte de 8)', 'Paracétamol pour douleurs et fièvre', 18.00, 80, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Gel Hydroalcoolique 500ml', 'Gel désinfectant pour les mains aux extraits d''aloès', 25.00, 60, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Assortiment Kaak d''Oujda (500g)', 'Les célèbres Kaak traditionnels d''Oujda aux graines d''anis et sésame', 35.00, 50, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Croissant Beurre Pur (Lot de 4)', 'Viennoiserie artisanale dorée au four', 16.00, 60, TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Course Express Coursier Intra-Oujda', 'Livraison de document ou paquet urgent sous 30 minutes', 20.00, 200, TRUE);
