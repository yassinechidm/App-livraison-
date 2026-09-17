-- ==============================================================================
-- QUICKLY LIVRAISON — SEED REAL GLOVO OUJDA RESTAURANTS & SNACKS
-- Migration File: supabase/migrations/20260916000002_seed_glovo_oujda_snacks.sql
-- Description: Inserts real restaurants and snacks scraped from Glovo Oujda with
--              authentic categories, menu items, prices in MAD, and HD images.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ------------------------------------------------------------------------------
-- Restaurant 1: Le petit-déjeuner Opheon
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Le petit-déjeuner Opheon',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/6cfa84ad20b826438d079588e461712370c01d0e3c9d1bd1a20a5cfa181e4a5f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/6cfa84ad20b826438d079588e461712370c01d0e3c9d1bd1a20a5cfa181e4a5f',
  92,
  '50+',
  '15-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0001-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 2: Pizza Hut
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Pizza Hut',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cb8e1df426de1830de667658f709e4586a6730284d3664f5327389f3453ed3c8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cb8e1df426de1830de667658f709e4586a6730284d3664f5327389f3453ed3c8',
  92,
  '50+',
  '20-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000003',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000004',
  'a0000000-0000-0000-0000-000000000002',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000005',
  'a0000000-0000-0000-0000-000000000002',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0002-0000-000000000006',
  'a0000000-0000-0000-0000-000000000002',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 3: Pause à Paris Pâtisserie
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Pause à Paris Pâtisserie',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/664ad216f1a0b5865ab9a4afcfa87d30356322f4f0b7f0f3c74cd7bfdf3ae461',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/664ad216f1a0b5865ab9a4afcfa87d30356322f4f0b7f0f3c74cd7bfdf3ae461',
  92,
  '50+',
  '25-40 min',
  15.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000001',
  'a0000000-0000-0000-0000-000000000003',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000004',
  'a0000000-0000-0000-0000-000000000003',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0003-0000-000000000005',
  'a0000000-0000-0000-0000-000000000003',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 4: Etoile Rouge
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'Etoile Rouge',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/aa89d5845e3f829a3ff81b566ab015f8115c0a63c10144a931ccc6d6cafbd2a8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/aa89d5845e3f829a3ff81b566ab015f8115c0a63c10144a931ccc6d6cafbd2a8',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000001',
  'a0000000-0000-0000-0000-000000000004',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000002',
  'a0000000-0000-0000-0000-000000000004',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000005',
  'a0000000-0000-0000-0000-000000000004',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0004-0000-000000000006',
  'a0000000-0000-0000-0000-000000000004',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 5: Pause À Paris
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'Pause À Paris',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/10937ff7e0cf0f0b66a8102292b89839fed4630bc96ad57307a39fc53fa25058',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/10937ff7e0cf0f0b66a8102292b89839fed4630bc96ad57307a39fc53fa25058',
  92,
  '50+',
  '15-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000001',
  'a0000000-0000-0000-0000-000000000005',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000002',
  'a0000000-0000-0000-0000-000000000005',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000003',
  'a0000000-0000-0000-0000-000000000005',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0005-0000-000000000005',
  'a0000000-0000-0000-0000-000000000005',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 6: LE CORDON BLEU
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000006',
  'LE CORDON BLEU',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/535b4aa34c0458bb940b01e72f66d8b98afd35abaac7a47098404ced816d624a',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/535b4aa34c0458bb940b01e72f66d8b98afd35abaac7a47098404ced816d624a',
  92,
  '50+',
  '20-40 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000001',
  'a0000000-0000-0000-0000-000000000006',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000002',
  'a0000000-0000-0000-0000-000000000006',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000003',
  'a0000000-0000-0000-0000-000000000006',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000004',
  'a0000000-0000-0000-0000-000000000006',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0006-0000-000000000006',
  'a0000000-0000-0000-0000-000000000006',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 7: Sweetleaf
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000007',
  'Sweetleaf',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/26f65cb816590e78d724208214b662235311cecd19df77028a329df0cfb5ec92',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/26f65cb816590e78d724208214b662235311cecd19df77028a329df0cfb5ec92',
  92,
  '50+',
  '25-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000001',
  'a0000000-0000-0000-0000-000000000007',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000002',
  'a0000000-0000-0000-0000-000000000007',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000003',
  'a0000000-0000-0000-0000-000000000007',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000004',
  'a0000000-0000-0000-0000-000000000007',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0007-0000-000000000005',
  'a0000000-0000-0000-0000-000000000007',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 8: Breakfast By Espace Al Hanine
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000008',
  'Breakfast By Espace Al Hanine',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef546c1f646aac228514b0107d840545e127e3713c3e0cd65c0e0caaabb9949b',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef546c1f646aac228514b0107d840545e127e3713c3e0cd65c0e0caaabb9949b',
  92,
  '50+',
  '30-35 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000001',
  'a0000000-0000-0000-0000-000000000008',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000002',
  'a0000000-0000-0000-0000-000000000008',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000003',
  'a0000000-0000-0000-0000-000000000008',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000004',
  'a0000000-0000-0000-0000-000000000008',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000005',
  'a0000000-0000-0000-0000-000000000008',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0008-0000-000000000006',
  'a0000000-0000-0000-0000-000000000008',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 9: Aura
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000009',
  'Aura',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/22c0ab7fd1efd2293f82285583efe1d6c06d46cd2774437e569141e82e284071',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/22c0ab7fd1efd2293f82285583efe1d6c06d46cd2774437e569141e82e284071',
  92,
  '50+',
  '15-40 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000001',
  'a0000000-0000-0000-0000-000000000009',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000002',
  'a0000000-0000-0000-0000-000000000009',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000003',
  'a0000000-0000-0000-0000-000000000009',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000004',
  'a0000000-0000-0000-0000-000000000009',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000005',
  'a0000000-0000-0000-0000-000000000009',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0009-0000-000000000006',
  'a0000000-0000-0000-0000-000000000009',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 10: Urban Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000010',
  'Urban Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/078f6a88801f956a0d82d531eff0f49b743287639af57477f3297b9a9cd4edbe',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/078f6a88801f956a0d82d531eff0f49b743287639af57477f3297b9a9cd4edbe',
  92,
  '50+',
  '20-30 min',
  1.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000001',
  'a0000000-0000-0000-0000-000000000010',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000002',
  'a0000000-0000-0000-0000-000000000010',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000003',
  'a0000000-0000-0000-0000-000000000010',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000004',
  'a0000000-0000-0000-0000-000000000010',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000005',
  'a0000000-0000-0000-0000-000000000010',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0010-0000-000000000006',
  'a0000000-0000-0000-0000-000000000010',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 11: Mr chef
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000011',
  'Mr chef',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c554a25f2264ff70898321ac2d3b78539f0737ba0b8edf1a236a3081cea8bcd6',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c554a25f2264ff70898321ac2d3b78539f0737ba0b8edf1a236a3081cea8bcd6',
  92,
  '50+',
  '25-35 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000001',
  'a0000000-0000-0000-0000-000000000011',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000002',
  'a0000000-0000-0000-0000-000000000011',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000003',
  'a0000000-0000-0000-0000-000000000011',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000004',
  'a0000000-0000-0000-0000-000000000011',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000005',
  'a0000000-0000-0000-0000-000000000011',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0011-0000-000000000006',
  'a0000000-0000-0000-0000-000000000011',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 12: Café Restaurant Al Hanine
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000012',
  'Café Restaurant Al Hanine',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f3986a9c8484532a5161d07743738005ea7eada7906f26ab84fe2193edef54c8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f3986a9c8484532a5161d07743738005ea7eada7906f26ab84fe2193edef54c8',
  92,
  '50+',
  '30-40 min',
  1.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000001',
  'a0000000-0000-0000-0000-000000000012',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000002',
  'a0000000-0000-0000-0000-000000000012',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000003',
  'a0000000-0000-0000-0000-000000000012',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000004',
  'a0000000-0000-0000-0000-000000000012',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000005',
  'a0000000-0000-0000-0000-000000000012',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0012-0000-000000000006',
  'a0000000-0000-0000-0000-000000000012',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 13: City Meal
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000013',
  'City Meal',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f53cfd8e36b0e430cf7ff081d046f15dad8aa0a1a9e1297dc3be9e4dbd8c4770',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f53cfd8e36b0e430cf7ff081d046f15dad8aa0a1a9e1297dc3be9e4dbd8c4770',
  92,
  '50+',
  '15-30 min',
  1.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000001',
  'a0000000-0000-0000-0000-000000000013',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000002',
  'a0000000-0000-0000-0000-000000000013',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000003',
  'a0000000-0000-0000-0000-000000000013',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000004',
  'a0000000-0000-0000-0000-000000000013',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000005',
  'a0000000-0000-0000-0000-000000000013',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0013-0000-000000000006',
  'a0000000-0000-0000-0000-000000000013',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 14: Snack Au Regal
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000014',
  'Snack Au Regal',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/88ff4211b6b06d45d53488d213241be34c7520313d9b503d761a2e27f737fd31',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/88ff4211b6b06d45d53488d213241be34c7520313d9b503d761a2e27f737fd31',
  92,
  '50+',
  '20-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000001',
  'a0000000-0000-0000-0000-000000000014',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000002',
  'a0000000-0000-0000-0000-000000000014',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000003',
  'a0000000-0000-0000-0000-000000000014',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000004',
  'a0000000-0000-0000-0000-000000000014',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000005',
  'a0000000-0000-0000-0000-000000000014',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0014-0000-000000000006',
  'a0000000-0000-0000-0000-000000000014',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 15: Brunch's Restaurant
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000015',
  'Brunch''s Restaurant',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ac59fbfd9b81c16a4297551d2016b00b543c30c204820f8196530716848984a7',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ac59fbfd9b81c16a4297551d2016b00b543c30c204820f8196530716848984a7',
  92,
  '50+',
  '25-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000001',
  'a0000000-0000-0000-0000-000000000015',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000002',
  'a0000000-0000-0000-0000-000000000015',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000003',
  'a0000000-0000-0000-0000-000000000015',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000004',
  'a0000000-0000-0000-0000-000000000015',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000005',
  'a0000000-0000-0000-0000-000000000015',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0015-0000-000000000006',
  'a0000000-0000-0000-0000-000000000015',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 16: Mmm Yummy
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000016',
  'Mmm Yummy',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c8a5e0ff71be5657174de0bb038bc9e4d4c3d3bee75a794e52190b8cf4c18931',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/c8a5e0ff71be5657174de0bb038bc9e4d4c3d3bee75a794e52190b8cf4c18931',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000001',
  'a0000000-0000-0000-0000-000000000016',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000002',
  'a0000000-0000-0000-0000-000000000016',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000003',
  'a0000000-0000-0000-0000-000000000016',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000004',
  'a0000000-0000-0000-0000-000000000016',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000005',
  'a0000000-0000-0000-0000-000000000016',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0016-0000-000000000006',
  'a0000000-0000-0000-0000-000000000016',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 17: Brofood
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000017',
  'Brofood',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7c1622982ba9d36602dba2a760d32b6d309c7f08cb39c3f7bf28862ae60dc63e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7c1622982ba9d36602dba2a760d32b6d309c7f08cb39c3f7bf28862ae60dc63e',
  92,
  '50+',
  '15-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000001',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000002',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000003',
  'a0000000-0000-0000-0000-000000000017',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000004',
  'a0000000-0000-0000-0000-000000000017',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000005',
  'a0000000-0000-0000-0000-000000000017',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0017-0000-000000000006',
  'a0000000-0000-0000-0000-000000000017',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 18: Snack Slaoui
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000018',
  'Snack Slaoui',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8778eee61d5710a0fef04546b8ded5e31f9fa7c6e69d7cf676a5cd53f58061b0',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8778eee61d5710a0fef04546b8ded5e31f9fa7c6e69d7cf676a5cd53f58061b0',
  92,
  '50+',
  '20-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000001',
  'a0000000-0000-0000-0000-000000000018',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000002',
  'a0000000-0000-0000-0000-000000000018',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000003',
  'a0000000-0000-0000-0000-000000000018',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000004',
  'a0000000-0000-0000-0000-000000000018',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000005',
  'a0000000-0000-0000-0000-000000000018',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0018-0000-000000000006',
  'a0000000-0000-0000-0000-000000000018',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 19: Drif Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000019',
  'Drif Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/47e2f1cdbcb9313f7facc53e4d06a1f438611e097bb98d10e5e9eeec91c5f103',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/47e2f1cdbcb9313f7facc53e4d06a1f438611e097bb98d10e5e9eeec91c5f103',
  92,
  '50+',
  '25-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000001',
  'a0000000-0000-0000-0000-000000000019',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000002',
  'a0000000-0000-0000-0000-000000000019',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000003',
  'a0000000-0000-0000-0000-000000000019',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000004',
  'a0000000-0000-0000-0000-000000000019',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000005',
  'a0000000-0000-0000-0000-000000000019',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0019-0000-000000000006',
  'a0000000-0000-0000-0000-000000000019',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 20: Snack SLM
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000020',
  'Snack SLM',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/341625dc2a528956b3c84bb6fdc6545e8f922ae774f405dba7cf8809f6fc752e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/341625dc2a528956b3c84bb6fdc6545e8f922ae774f405dba7cf8809f6fc752e',
  92,
  '50+',
  '30-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000001',
  'a0000000-0000-0000-0000-000000000020',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000002',
  'a0000000-0000-0000-0000-000000000020',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000003',
  'a0000000-0000-0000-0000-000000000020',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000004',
  'a0000000-0000-0000-0000-000000000020',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000005',
  'a0000000-0000-0000-0000-000000000020',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0020-0000-000000000006',
  'a0000000-0000-0000-0000-000000000020',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 21: Crêperie Y N N Ice
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000021',
  'Crêperie Y N N Ice',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1e003e38488d5f1219a15be8289c983c0eb779efd35a6ea4759645a4b470e337',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1e003e38488d5f1219a15be8289c983c0eb779efd35a6ea4759645a4b470e337',
  92,
  '50+',
  '15-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000001',
  'a0000000-0000-0000-0000-000000000021',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000002',
  'a0000000-0000-0000-0000-000000000021',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000003',
  'a0000000-0000-0000-0000-000000000021',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000004',
  'a0000000-0000-0000-0000-000000000021',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0021-0000-000000000005',
  'a0000000-0000-0000-0000-000000000021',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 22: Y N N Ice
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000022',
  'Y N N Ice',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef022dad2d9105d00d4433d48923f5108e8ea71d95f077959aaafa795d160c12',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/ef022dad2d9105d00d4433d48923f5108e8ea71d95f077959aaafa795d160c12',
  92,
  '50+',
  '20-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000001',
  'a0000000-0000-0000-0000-000000000022',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000002',
  'a0000000-0000-0000-0000-000000000022',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000003',
  'a0000000-0000-0000-0000-000000000022',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000004',
  'a0000000-0000-0000-0000-000000000022',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000005',
  'a0000000-0000-0000-0000-000000000022',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0022-0000-000000000006',
  'a0000000-0000-0000-0000-000000000022',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 23: Y N N Ice Fast Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000023',
  'Y N N Ice Fast Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8bb2714414c522c7c90b00ebde3fb32a2ac4f2a596ace010ead8f601c80b1285',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8bb2714414c522c7c90b00ebde3fb32a2ac4f2a596ace010ead8f601c80b1285',
  92,
  '50+',
  '25-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000001',
  'a0000000-0000-0000-0000-000000000023',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000002',
  'a0000000-0000-0000-0000-000000000023',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000003',
  'a0000000-0000-0000-0000-000000000023',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000004',
  'a0000000-0000-0000-0000-000000000023',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000005',
  'a0000000-0000-0000-0000-000000000023',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0023-0000-000000000006',
  'a0000000-0000-0000-0000-000000000023',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 24: Snack YNN
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000024',
  'Snack YNN',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cab720226d123e25d4d284b2b2b950dec32b7da5861d0b456d13f3a6d5071142',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cab720226d123e25d4d284b2b2b950dec32b7da5861d0b456d13f3a6d5071142',
  92,
  '50+',
  '30-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000001',
  'a0000000-0000-0000-0000-000000000024',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000002',
  'a0000000-0000-0000-0000-000000000024',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000003',
  'a0000000-0000-0000-0000-000000000024',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000004',
  'a0000000-0000-0000-0000-000000000024',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000005',
  'a0000000-0000-0000-0000-000000000024',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0024-0000-000000000006',
  'a0000000-0000-0000-0000-000000000024',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 25: Regalbuns
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000025',
  'Regalbuns',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f1d2e67fd4277a0fa5824750a58fc5374d0d76bf81b23e27687bdb7a17878d5f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f1d2e67fd4277a0fa5824750a58fc5374d0d76bf81b23e27687bdb7a17878d5f',
  92,
  '50+',
  '15-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000001',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000002',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000003',
  'a0000000-0000-0000-0000-000000000025',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000004',
  'a0000000-0000-0000-0000-000000000025',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000005',
  'a0000000-0000-0000-0000-000000000025',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0025-0000-000000000006',
  'a0000000-0000-0000-0000-000000000025',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 26: Mr Sushi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000026',
  'Mr Sushi',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/d76261ed250e74b67fcedadda6302afe001bdc60086ed6bab641f5943fb24675',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/d76261ed250e74b67fcedadda6302afe001bdc60086ed6bab641f5943fb24675',
  92,
  '50+',
  '20-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000001',
  'a0000000-0000-0000-0000-000000000026',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000002',
  'a0000000-0000-0000-0000-000000000026',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000003',
  'a0000000-0000-0000-0000-000000000026',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000004',
  'a0000000-0000-0000-0000-000000000026',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000005',
  'a0000000-0000-0000-0000-000000000026',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0026-0000-000000000006',
  'a0000000-0000-0000-0000-000000000026',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 27: Champs Elysées
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000027',
  'Champs Elysées',
  'Shawarma Syrien • Tacos Français • Pasticcio',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b31157ecbfcdbc07b1b36f1064e24948697b40724ff36963c4b72227292964c1',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b31157ecbfcdbc07b1b36f1064e24948697b40724ff36963c4b72227292964c1',
  92,
  '50+',
  '25-40 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000001',
  'a0000000-0000-0000-0000-000000000027',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000002',
  'a0000000-0000-0000-0000-000000000027',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000003',
  'a0000000-0000-0000-0000-000000000027',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000004',
  'a0000000-0000-0000-0000-000000000027',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000005',
  'a0000000-0000-0000-0000-000000000027',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0027-0000-000000000006',
  'a0000000-0000-0000-0000-000000000027',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 28: CROUSTY 48
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000028',
  'CROUSTY 48',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/86f1a0fc4d29022616b7a1fb9b6a7a8b7110cf8ed6ed81cd8469e05150422a51',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/86f1a0fc4d29022616b7a1fb9b6a7a8b7110cf8ed6ed81cd8469e05150422a51',
  92,
  '50+',
  '30-30 min',
  2.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000001',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000002',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000003',
  'a0000000-0000-0000-0000-000000000028',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000004',
  'a0000000-0000-0000-0000-000000000028',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000005',
  'a0000000-0000-0000-0000-000000000028',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0028-0000-000000000006',
  'a0000000-0000-0000-0000-000000000028',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 29: Bravo - Univers Gourmand
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000029',
  'Bravo - Univers Gourmand',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b42842aef446612b1e48e9dca5e82ebbb379f319ac1859985a63b22f15173b6c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/b42842aef446612b1e48e9dca5e82ebbb379f319ac1859985a63b22f15173b6c',
  92,
  '50+',
  '15-35 min',
  2.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000001',
  'a0000000-0000-0000-0000-000000000029',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000002',
  'a0000000-0000-0000-0000-000000000029',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000003',
  'a0000000-0000-0000-0000-000000000029',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000004',
  'a0000000-0000-0000-0000-000000000029',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000005',
  'a0000000-0000-0000-0000-000000000029',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0029-0000-000000000006',
  'a0000000-0000-0000-0000-000000000029',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 30: Piri Piri Poulet Braisé
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000030',
  'Piri Piri Poulet Braisé',
  'Poulet Braisé • Grillades • Tajines Marocains',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8ee616cfbd13291f7300af2092c732efed9415017cf8e72d4bfcb4fc9495f7a3',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/8ee616cfbd13291f7300af2092c732efed9415017cf8e72d4bfcb4fc9495f7a3',
  92,
  '50+',
  '20-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000001',
  'a0000000-0000-0000-0000-000000000030',
  'Spécialités Braisées',
  'Demi Poulet Braisé aux Épices',
  'Poulet fermier mariné aux herbes orientales et cuit lentement au feu de braise.',
  42.00,
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000002',
  'a0000000-0000-0000-0000-000000000030',
  'Plats & Tajines',
  'Tajine Veau aux Pruneaux & Amandes',
  'Morceaux tendres de veau mijotés avec pruneaux caramélisés, amandes grillées et cannelle.',
  65.00,
  'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000003',
  'a0000000-0000-0000-0000-000000000030',
  'Spécialités Braisées',
  'Assiette Brochettes de Kefta',
  'Brochettes de bœuf assaisonnées à la menthe et cumin, servies avec frites et salade marocaine.',
  50.00,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000004',
  'a0000000-0000-0000-0000-000000000030',
  'Accompagnements',
  'Salade Marocaine Traditionnelle',
  'Dés de tomates fraîches, concombres, oignons rouges, coriandre et filet d''huile d''olive.',
  18.00,
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0030-0000-000000000005',
  'a0000000-0000-0000-0000-000000000030',
  'Boissons',
  'Eau Minérale Aïn Ifrane 1.5L',
  'Eau pure naturelle de source marocaine.',
  8.00,
  'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 31: Snack En-cas
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000031',
  'Snack En-cas',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/89846c54dca6fbae45ca489af61e8a7f2698c33ddffa76baa0490ea109801f84',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/89846c54dca6fbae45ca489af61e8a7f2698c33ddffa76baa0490ea109801f84',
  92,
  '50+',
  '25-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000001',
  'a0000000-0000-0000-0000-000000000031',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000002',
  'a0000000-0000-0000-0000-000000000031',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000003',
  'a0000000-0000-0000-0000-000000000031',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000004',
  'a0000000-0000-0000-0000-000000000031',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000005',
  'a0000000-0000-0000-0000-000000000031',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0031-0000-000000000006',
  'a0000000-0000-0000-0000-000000000031',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 32: Fée Maison Chez Samah
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000032',
  'Fée Maison Chez Samah',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/4a8bd705b4c1a609e10871c241d221fe4571fc2743e60c043d942b067ae9d0ba',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/4a8bd705b4c1a609e10871c241d221fe4571fc2743e60c043d942b067ae9d0ba',
  92,
  '50+',
  '30-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000001',
  'a0000000-0000-0000-0000-000000000032',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000002',
  'a0000000-0000-0000-0000-000000000032',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000003',
  'a0000000-0000-0000-0000-000000000032',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000004',
  'a0000000-0000-0000-0000-000000000032',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000005',
  'a0000000-0000-0000-0000-000000000032',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0032-0000-000000000006',
  'a0000000-0000-0000-0000-000000000032',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 33: Inyas Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000033',
  'Inyas Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/dbc9916c16ee9bc93a4a2fada5eb758bdd805abb272e743f3823922fd9a9df6c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/dbc9916c16ee9bc93a4a2fada5eb758bdd805abb272e743f3823922fd9a9df6c',
  92,
  '50+',
  '15-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000001',
  'a0000000-0000-0000-0000-000000000033',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000002',
  'a0000000-0000-0000-0000-000000000033',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000003',
  'a0000000-0000-0000-0000-000000000033',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000004',
  'a0000000-0000-0000-0000-000000000033',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000005',
  'a0000000-0000-0000-0000-000000000033',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0033-0000-000000000006',
  'a0000000-0000-0000-0000-000000000033',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 34: Chawarma Bayt Cham
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000034',
  'Chawarma Bayt Cham',
  'Shawarma Syrien • Tacos Français • Pasticcio',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/24f8b8da93b447ee00275731fb803396a2ece809b37a475ce28284047d2401b2',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/24f8b8da93b447ee00275731fb803396a2ece809b37a475ce28284047d2401b2',
  92,
  '50+',
  '20-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000001',
  'a0000000-0000-0000-0000-000000000034',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000002',
  'a0000000-0000-0000-0000-000000000034',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000003',
  'a0000000-0000-0000-0000-000000000034',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000004',
  'a0000000-0000-0000-0000-000000000034',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000005',
  'a0000000-0000-0000-0000-000000000034',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0034-0000-000000000006',
  'a0000000-0000-0000-0000-000000000034',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 35: Palermo’s Snack \u0026 Pizzeria
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000035',
  'Palermo’s Snack \u0026 Pizzeria',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/60c29224e5bc6c76d4add43af86b30eb62e4df5f0c16434cfcf1bdf045de527e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/60c29224e5bc6c76d4add43af86b30eb62e4df5f0c16434cfcf1bdf045de527e',
  92,
  '50+',
  '25-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000001',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000002',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000003',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000004',
  'a0000000-0000-0000-0000-000000000035',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000005',
  'a0000000-0000-0000-0000-000000000035',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0035-0000-000000000006',
  'a0000000-0000-0000-0000-000000000035',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 36: Cafe Palais Trocadero
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000036',
  'Cafe Palais Trocadero',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3f6abb8bcc0670570ae5f23adf894fd6c869e0446a2cd475ad59a82e5b51ca91',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3f6abb8bcc0670570ae5f23adf894fd6c869e0446a2cd475ad59a82e5b51ca91',
  92,
  '50+',
  '30-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000001',
  'a0000000-0000-0000-0000-000000000036',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000002',
  'a0000000-0000-0000-0000-000000000036',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000003',
  'a0000000-0000-0000-0000-000000000036',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000004',
  'a0000000-0000-0000-0000-000000000036',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000005',
  'a0000000-0000-0000-0000-000000000036',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0036-0000-000000000006',
  'a0000000-0000-0000-0000-000000000036',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 37: Chef chaouni
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000037',
  'Chef chaouni',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/08f956a45bc43596a3756cb14b2269231273bd01a24617464c37138850a09337',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/08f956a45bc43596a3756cb14b2269231273bd01a24617464c37138850a09337',
  92,
  '50+',
  '15-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000001',
  'a0000000-0000-0000-0000-000000000037',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000002',
  'a0000000-0000-0000-0000-000000000037',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000003',
  'a0000000-0000-0000-0000-000000000037',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000004',
  'a0000000-0000-0000-0000-000000000037',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000005',
  'a0000000-0000-0000-0000-000000000037',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0037-0000-000000000006',
  'a0000000-0000-0000-0000-000000000037',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 38: Nara Sushi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000038',
  'Nara Sushi',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/9fcce92b1df3d450f805f49c755b526ef58b16265eaa4081ec813b00bca7f3f9',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/9fcce92b1df3d450f805f49c755b526ef58b16265eaa4081ec813b00bca7f3f9',
  92,
  '50+',
  '20-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000001',
  'a0000000-0000-0000-0000-000000000038',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000002',
  'a0000000-0000-0000-0000-000000000038',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000003',
  'a0000000-0000-0000-0000-000000000038',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000004',
  'a0000000-0000-0000-0000-000000000038',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000005',
  'a0000000-0000-0000-0000-000000000038',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0038-0000-000000000006',
  'a0000000-0000-0000-0000-000000000038',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 39: L’ÉMERAUDE
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000039',
  'L’ÉMERAUDE',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/2d0e03ba73cfbc70796d5ec9203c26a2fa114db958c16dbc3e18ebb5ecc5f315',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/2d0e03ba73cfbc70796d5ec9203c26a2fa114db958c16dbc3e18ebb5ecc5f315',
  92,
  '50+',
  '25-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000001',
  'a0000000-0000-0000-0000-000000000039',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000002',
  'a0000000-0000-0000-0000-000000000039',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000003',
  'a0000000-0000-0000-0000-000000000039',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000004',
  'a0000000-0000-0000-0000-000000000039',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000005',
  'a0000000-0000-0000-0000-000000000039',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0039-0000-000000000006',
  'a0000000-0000-0000-0000-000000000039',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 40: Opheon
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000040',
  'Opheon',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f63cb3fb3bfa623602a83520042689777d5454b5819a411a6f449b07eec182c1',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/f63cb3fb3bfa623602a83520042689777d5454b5819a411a6f449b07eec182c1',
  92,
  '50+',
  '30-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000001',
  'a0000000-0000-0000-0000-000000000040',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000002',
  'a0000000-0000-0000-0000-000000000040',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000003',
  'a0000000-0000-0000-0000-000000000040',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000004',
  'a0000000-0000-0000-0000-000000000040',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000005',
  'a0000000-0000-0000-0000-000000000040',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0040-0000-000000000006',
  'a0000000-0000-0000-0000-000000000040',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 41: Blankok Burger
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000041',
  'Blankok Burger',
  'Burgers Gourmet • Crispy Chicken • Frites Maison',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1282018054d5f86ccf41c79ccb882a5e79ffb6de528e6c69934a74ef80e28cc3',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1282018054d5f86ccf41c79ccb882a5e79ffb6de528e6c69934a74ef80e28cc3',
  92,
  '50+',
  '15-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000001',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Burger Bacon & Double Cheddar',
  'Steak de bœuf frais 150g, double cheddar irlandais, bacon de dinde croustillant, sauce secrète.',
  55.00,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000002',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Burger Crispy Chicken Spicy',
  'Filet de poulet croustillant mariné aux épices, salade croquante, pickles, sauce samouraï maison.',
  48.00,
  'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000003',
  'a0000000-0000-0000-0000-000000000041',
  'Burgers Signatures',
  'Smash Burger Double Steak',
  'Deux steaks écrasés à la plancha, croûte caramélisée, oignons fondants et sauce smash.',
  58.00,
  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000004',
  'a0000000-0000-0000-0000-000000000041',
  'Crispy Tenders & Wings',
  'Tenders de Poulet Panés (5 pcs)',
  'Blancs de poulet croustillants enrobés d''une panure dorée et sauce barbecue.',
  35.00,
  'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000005',
  'a0000000-0000-0000-0000-000000000041',
  'Menus & Frites',
  'Grande Barquette Frites Maison',
  'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.',
  15.00,
  'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0041-0000-000000000006',
  'a0000000-0000-0000-0000-000000000041',
  'Boissons',
  'Canette Hawaï Tropical 33cl',
  'Le classique rafraîchissement marocain aux fruits tropicaux.',
  10.00,
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 42: Nigiri House
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000042',
  'Nigiri House',
  'Sushi Japonais • Maki • Poké Bowls',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/15052df211cef1bbd0133b3866efff49bbacc286baa56705e8ac21508c74ac29',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/15052df211cef1bbd0133b3866efff49bbacc286baa56705e8ac21508c74ac29',
  92,
  '50+',
  '20-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000001',
  'a0000000-0000-0000-0000-000000000042',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000002',
  'a0000000-0000-0000-0000-000000000042',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000003',
  'a0000000-0000-0000-0000-000000000042',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000004',
  'a0000000-0000-0000-0000-000000000042',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000005',
  'a0000000-0000-0000-0000-000000000042',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0042-0000-000000000006',
  'a0000000-0000-0000-0000-000000000042',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 43: Tapas
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000043',
  'Tapas',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/0335be065550581fdb786a2ae5bf5a419fc4cca60b09d7d92094c99ee3fc810e',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/0335be065550581fdb786a2ae5bf5a419fc4cca60b09d7d92094c99ee3fc810e',
  92,
  '50+',
  '25-30 min',
  3.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000001',
  'a0000000-0000-0000-0000-000000000043',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000002',
  'a0000000-0000-0000-0000-000000000043',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000003',
  'a0000000-0000-0000-0000-000000000043',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000004',
  'a0000000-0000-0000-0000-000000000043',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000005',
  'a0000000-0000-0000-0000-000000000043',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0043-0000-000000000006',
  'a0000000-0000-0000-0000-000000000043',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 44: Pikala Food
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000044',
  'Pikala Food',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/bc75f2d60cdc1053088f4bf0c1878db81b3a231fc7cb494ad31aa73568740f38',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/bc75f2d60cdc1053088f4bf0c1878db81b3a231fc7cb494ad31aa73568740f38',
  92,
  '50+',
  '30-35 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000001',
  'a0000000-0000-0000-0000-000000000044',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000002',
  'a0000000-0000-0000-0000-000000000044',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000003',
  'a0000000-0000-0000-0000-000000000044',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000004',
  'a0000000-0000-0000-0000-000000000044',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000005',
  'a0000000-0000-0000-0000-000000000044',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0044-0000-000000000006',
  'a0000000-0000-0000-0000-000000000044',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 45: Tajine City
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000045',
  'Tajine City',
  'Poulet Braisé • Grillades • Tajines Marocains',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/91dfb0461f73c2f93d62e922f4dcbfe1cafa1c2290f460152b6afa6a0cd6d523',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/91dfb0461f73c2f93d62e922f4dcbfe1cafa1c2290f460152b6afa6a0cd6d523',
  92,
  '50+',
  '15-40 min',
  3.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000001',
  'a0000000-0000-0000-0000-000000000045',
  'Spécialités Braisées',
  'Demi Poulet Braisé aux Épices',
  'Poulet fermier mariné aux herbes orientales et cuit lentement au feu de braise.',
  42.00,
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000002',
  'a0000000-0000-0000-0000-000000000045',
  'Plats & Tajines',
  'Tajine Veau aux Pruneaux & Amandes',
  'Morceaux tendres de veau mijotés avec pruneaux caramélisés, amandes grillées et cannelle.',
  65.00,
  'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000003',
  'a0000000-0000-0000-0000-000000000045',
  'Spécialités Braisées',
  'Assiette Brochettes de Kefta',
  'Brochettes de bœuf assaisonnées à la menthe et cumin, servies avec frites et salade marocaine.',
  50.00,
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000004',
  'a0000000-0000-0000-0000-000000000045',
  'Accompagnements',
  'Salade Marocaine Traditionnelle',
  'Dés de tomates fraîches, concombres, oignons rouges, coriandre et filet d''huile d''olive.',
  18.00,
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0045-0000-000000000005',
  'a0000000-0000-0000-0000-000000000045',
  'Boissons',
  'Eau Minérale Aïn Ifrane 1.5L',
  'Eau pure naturelle de source marocaine.',
  8.00,
  'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 46: ROMANO
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000046',
  'ROMANO',
  'Pizzas Italiennes • Pâtes • Calzone',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1ebb10158515dc4d2d230974fe9cce0c52c823c1d5955f06e8e23cee99a4bb3f',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/1ebb10158515dc4d2d230974fe9cce0c52c823c1d5955f06e8e23cee99a4bb3f',
  92,
  '50+',
  '20-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000001',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Classiques',
  'Pizza Margherita Royale',
  'Sauce tomate San Marzano, mozzarella fior di latte, basilic frais et huile d''olive extra vierge.',
  45.00,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000002',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza 4 Fromages Fondante',
  'Mozzarella, gorgonzola, parmesan affiné, emmental fondant et origan.',
  60.00,
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000003',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza Barbecue Bœuf Haché',
  'Bœuf haché assaisonné, sauce BBQ fumée, oignons rouges caramélisés et poivrons.',
  65.00,
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000004',
  'a0000000-0000-0000-0000-000000000046',
  'Pizzas Signatures',
  'Pizza Fruits de Mer Oujda',
  'Crevettes royales, calamars tendres, ail, persil et mozzarella gratinée.',
  75.00,
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000005',
  'a0000000-0000-0000-0000-000000000046',
  'Entrées & Pains à l''ail',
  'Pain à l''Ail & Fromage Gratiné',
  'Baguette croustillante dorée au beurre d''ail persillé et mozzarella fondue.',
  25.00,
  'https://images.unsplash.com/photo-1619895092538-128341789043?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0046-0000-000000000006',
  'a0000000-0000-0000-0000-000000000046',
  'Boissons & Desserts',
  'Coca-Cola Canette 33cl',
  'Boisson rafraîchissante servie très fraîche.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 47: Flourish Bubble
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000047',
  'Flourish Bubble',
  'Pâtisserie Fine • Kaak d''Oujda • Crêpes & Glaces',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7527e193c67258f5cf36e7048428333ab5d2191f610b4e99740c9f966d4076a8',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/7527e193c67258f5cf36e7048428333ab5d2191f610b4e99740c9f966d4076a8',
  92,
  '50+',
  '25-35 min',
  15.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000001',
  'a0000000-0000-0000-0000-000000000047',
  'Pâtisseries & Kaak',
  'Kaak d''Oujda Traditionnel (500g)',
  'Le célèbre kaak parfumé à l''anis, fenouil et graines de sésame dorées.',
  35.00,
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000002',
  'a0000000-0000-0000-0000-000000000047',
  'Crêpes & Gaufres',
  'Crêpe Chocolat Nutella Banane',
  'Crêpe moelleuse nappée de Nutella généreux et tranches de bananes fraîches.',
  28.00,
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000003',
  'a0000000-0000-0000-0000-000000000047',
  'Crêpes & Gaufres',
  'Gaufre Liégeoise Caramel Spéculoos',
  'Gaufre caramélisée croustillante avec coulis spéculoos et brisures gourmandes.',
  32.00,
  'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000004',
  'a0000000-0000-0000-0000-000000000047',
  'Boissons & Bubble Tea',
  'Bubble Tea Mangue Passion Boba',
  'Thé vert au jasmin infusé à la mangue et perles de fruits passion explosives.',
  30.00,
  'https://images.unsplash.com/photo-1558857563-b37cf5a228f4?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0047-0000-000000000005',
  'a0000000-0000-0000-0000-000000000047',
  'Cafés & Jus',
  'Jus d''Avocat aux Amandes & Lait',
  'Avocats crémeux mixés au lait entier, fruits secs concassés et pointe de miel.',
  22.00,
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 48: Snack Mehdi
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000048',
  'Snack Mehdi',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cac5d627328f325dfecc6fcade3ff6128bf5109d7bb279c10a4fcbe1de4efad9',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/cac5d627328f325dfecc6fcade3ff6128bf5109d7bb279c10a4fcbe1de4efad9',
  92,
  '50+',
  '30-40 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000001',
  'a0000000-0000-0000-0000-000000000048',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000002',
  'a0000000-0000-0000-0000-000000000048',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000003',
  'a0000000-0000-0000-0000-000000000048',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000004',
  'a0000000-0000-0000-0000-000000000048',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000005',
  'a0000000-0000-0000-0000-000000000048',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0048-0000-000000000006',
  'a0000000-0000-0000-0000-000000000048',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 49: Le best
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000049',
  'Le best',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3309ad2f1f6b763e16684cd41c3db264b222a3350f5d8244d9e174386836046c',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/3309ad2f1f6b763e16684cd41c3db264b222a3350f5d8244d9e174386836046c',
  92,
  '50+',
  '15-30 min',
  4.00,
  100.00,
  'Livraison Offerte dès 80 DH',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000001',
  'a0000000-0000-0000-0000-000000000049',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000002',
  'a0000000-0000-0000-0000-000000000049',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000003',
  'a0000000-0000-0000-0000-000000000049',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000004',
  'a0000000-0000-0000-0000-000000000049',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000005',
  'a0000000-0000-0000-0000-000000000049',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0049-0000-000000000006',
  'a0000000-0000-0000-0000-000000000049',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- ------------------------------------------------------------------------------
-- Restaurant 50: Chez Rémy
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (
  id, name, cuisine_type, logo_url, cover_image, rating_percent, rating_count,
  delivery_time, delivery_fee, free_delivery_threshold, promo_badge, is_active
) VALUES (
  'a0000000-0000-0000-0000-000000000050',
  'Chez Rémy',
  'Fast Food • Sandwichs Oujdis • Tacos & Paninis',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/931a286478a28d8f61beada2ffb1e1a639b6af3baee736f4a63f13053f18fab7',
  'https://glovo.dhmedia.io/image/stores-glovo/stores/931a286478a28d8f61beada2ffb1e1a639b6af3baee736f4a63f13053f18fab7',
  92,
  '50+',
  '20-35 min',
  4.00,
  100.00,
  'Populaire à Oujda 🔥',
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cuisine_type = EXCLUDED.cuisine_type,
  cover_image = EXCLUDED.cover_image,
  logo_url = EXCLUDED.logo_url,
  rating_percent = EXCLUDED.rating_percent,
  delivery_time = EXCLUDED.delivery_time,
  delivery_fee = EXCLUDED.delivery_fee,
  promo_badge = EXCLUDED.promo_badge;

INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000001',
  'a0000000-0000-0000-0000-000000000050',
  'Tacos & Paninis',
  'Tacos Français Double Viande (L)',
  'Poulet mariné et viande hachée, frites croustillantes à l''intérieur, sauce fromagère maison fondante.',
  45.00,
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000002',
  'a0000000-0000-0000-0000-000000000050',
  'Shawarmas Traditionnels',
  'Shawarma Arabe Roulé Spécial',
  'Émincé de poulet doré à la broche, crème d''ail toum libanaise, cornichons libanais dans un pain saj grillé.',
  38.00,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000003',
  'a0000000-0000-0000-0000-000000000050',
  'Pasticcios Gourmands',
  'Pasticcio Poulet & Fromage Gratiné',
  'Barquette généreuse de frites, morceaux de poulet rôti, sauce blanche crémeuse et couche épaisse de mozzarella gratinée.',
  42.00,
  'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80',
  TRUE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000004',
  'a0000000-0000-0000-0000-000000000050',
  'Sandwichs Best-Sellers',
  'Sandwich Bocadillo Oujdi Mixte',
  'Baguette fraîche garnie de kefta, saucisse, œuf dur, frites, tomates et mayonnaise harissa.',
  28.00,
  'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000005',
  'a0000000-0000-0000-0000-000000000050',
  'Tacos & Paninis',
  'Panini Cordon Bleu Fromage',
  'Pain panini toasté croustillant, escalope cordon bleu fondante et tranche d''emmental.',
  26.00,
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
INSERT INTO public.restaurant_menu_items (
  id, restaurant_id, category, name, description, price, image_url, is_popular, is_available
) VALUES (
  'b0000000-0000-0050-0000-000000000006',
  'a0000000-0000-0000-0000-000000000050',
  'Boissons & Sauces',
  'Canette Poms Pomme 33cl',
  'Boisson pétillante saveur pomme acidulée.',
  10.00,
  'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80',
  FALSE,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;
