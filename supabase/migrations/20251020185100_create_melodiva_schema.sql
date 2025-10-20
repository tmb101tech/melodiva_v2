/*
  # Melodiva Skincare E-commerce Database Schema

  ## Overview
  Complete database schema for e-commerce platform with user management, products, orders, 
  affiliates, payments, and reviews.

  ## New Tables
  
  ### 1. `users` - Customer accounts
    - `id` (uuid, primary key) - Unique user identifier
    - `full_name` (text) - Customer full name
    - `email` (text, unique) - Email address for login
    - `phone` (text, unique) - Phone number for login/contact
    - `whatsapp` (text) - WhatsApp number
    - `password_hash` (text) - Hashed password
    - `profile_image` (text, nullable) - Profile picture URL
    - `security_question` (text) - For password recovery
    - `security_answer_hash` (text) - Hashed security answer
    - `address` (text) - Street address
    - `state` (text) - State of residence
    - `city` (text) - City of residence
    - `is_affiliate` (boolean, default false) - Affiliate status
    - `affiliate_code` (text, unique, nullable) - 5-character unique code
    - `affiliate_approved` (boolean, default false) - Admin approval status
    - `affiliate_balance` (decimal, default 0) - Withdrawable commission balance
    - `bank_account_name` (text, nullable) - Bank account holder name
    - `bank_account_number` (text, nullable) - Bank account number
    - `bank_name` (text, nullable) - Bank name
    - `status` (text, default 'ACTIVE') - ACTIVE, SUSPENDED, BANNED
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 2. `products` - Product catalog
    - `id` (uuid, primary key)
    - `name` (text) - Product name
    - `description` (text) - Product description
    - `slug` (text, unique) - URL-friendly identifier
    - `images` (jsonb) - Array of image URLs
    - `category` (text) - BLACK_SOAP or KERNEL_OIL
    - `active` (boolean, default true) - Product visibility
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 3. `skus` - Product variants (sizes, prices)
    - `id` (uuid, primary key)
    - `product_id` (uuid, foreign key)
    - `size_label` (text) - e.g., "Small", "Large"
    - `size_unit` (text) - e.g., "kg", "L"
    - `size_value` (decimal) - Numeric size value
    - `price` (decimal) - Price in Naira
    - `stock` (integer, default 0) - Available quantity
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 4. `shipping_info` - Delivery addresses
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key, nullable)
    - `full_name` (text)
    - `phone` (text)
    - `email` (text)
    - `state` (text)
    - `city` (text)
    - `address` (text)
    - `created_at` (timestamptz, default now())

  ### 5. `orders` - Customer orders
    - `id` (uuid, primary key)
    - `order_number` (serial) - Auto-incrementing number
    - `order_id_string` (text) - MEL + order_number
    - `user_id` (uuid, foreign key)
    - `shipping_id` (uuid, foreign key)
    - `subtotal` (decimal) - Product total before discounts
    - `discount` (decimal, default 0) - Affiliate discount amount
    - `delivery_fee` (decimal) - Shipping cost
    - `total` (decimal) - Final amount
    - `affiliate_code` (text, nullable) - Code used for discount
    - `affiliate_id` (uuid, foreign key, nullable) - Referring affiliate
    - `payment_status` (text, default 'PENDING') - PENDING, PAID, FAILED
    - `order_status` (text, default 'PENDING') - PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, COMPLETED
    - `payment_reference` (text, nullable) - Paystack reference
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())

  ### 6. `order_items` - Items in each order
    - `id` (uuid, primary key)
    - `order_id` (uuid, foreign key)
    - `sku_id` (uuid, foreign key)
    - `quantity` (integer)
    - `unit_price` (decimal) - Price at time of order
    - `line_total` (decimal) - quantity * unit_price
    - `created_at` (timestamptz, default now())

  ### 7. `referrals` - Affiliate referral tracking
    - `id` (uuid, primary key)
    - `affiliate_id` (uuid, foreign key)
    - `buyer_email` (text)
    - `order_id` (uuid, foreign key)
    - `commission_amount` (decimal)
    - `created_at` (timestamptz, default now())

  ### 8. `transactions` - Financial transaction log
    - `id` (uuid, primary key)
    - `order_id` (uuid, foreign key, nullable)
    - `user_id` (uuid, foreign key)
    - `type` (text) - PAYMENT, REFUND, COMMISSION, WITHDRAWAL, ADJUSTMENT
    - `amount` (decimal)
    - `reference` (text, nullable) - External reference (Paystack, etc.)
    - `metadata` (jsonb, nullable) - Additional data
    - `status` (text, default 'COMPLETED') - PENDING, COMPLETED, FAILED
    - `created_at` (timestamptz, default now())

  ### 9. `reviews` - Product reviews and ratings
    - `id` (uuid, primary key)
    - `product_id` (uuid, foreign key)
    - `user_id` (uuid, foreign key)
    - `order_id` (uuid, foreign key)
    - `rating` (integer) - 1-5 stars
    - `comment` (text, nullable)
    - `approved` (boolean, default false) - Admin moderation
    - `created_at` (timestamptz, default now())

  ### 10. `settings` - System configuration
    - `id` (uuid, primary key)
    - `key` (text, unique) - Setting identifier
    - `value` (jsonb) - Setting value
    - `description` (text, nullable)
    - `updated_at` (timestamptz, default now())

  ### 11. `admins` - Admin users
    - `id` (uuid, primary key)
    - `username` (text, unique)
    - `password_hash` (text)
    - `created_at` (timestamptz, default now())

  ### 12. `audit_logs` - System audit trail
    - `id` (uuid, primary key)
    - `admin_id` (uuid, foreign key, nullable)
    - `action` (text) - Description of action
    - `entity_type` (text) - Type of entity modified
    - `entity_id` (uuid, nullable) - ID of entity
    - `old_values` (jsonb, nullable)
    - `new_values` (jsonb, nullable)
    - `created_at` (timestamptz, default now())

  ## Security
  - RLS enabled on all tables
  - Users can read/update their own data
  - Public read access to products and reviews
  - Admin-only access to sensitive operations
  - Authenticated users can create orders and reviews
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  whatsapp text,
  password_hash text NOT NULL,
  profile_image text,
  security_question text NOT NULL,
  security_answer_hash text NOT NULL,
  address text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  is_affiliate boolean DEFAULT false,
  affiliate_code text UNIQUE,
  affiliate_approved boolean DEFAULT false,
  affiliate_balance decimal(10,2) DEFAULT 0,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  slug text UNIQUE NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL CHECK (category IN ('BLACK_SOAP', 'KERNEL_OIL')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- SKUs table
CREATE TABLE IF NOT EXISTS skus (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label text NOT NULL,
  size_unit text NOT NULL,
  size_value decimal(10,2) NOT NULL,
  price decimal(10,2) NOT NULL,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shipping info table
CREATE TABLE IF NOT EXISTS shipping_info (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number serial UNIQUE,
  order_id_string text UNIQUE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shipping_id uuid NOT NULL REFERENCES shipping_info(id) ON DELETE RESTRICT,
  subtotal decimal(10,2) NOT NULL,
  discount decimal(10,2) DEFAULT 0,
  delivery_fee decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  affiliate_code text,
  affiliate_id uuid REFERENCES users(id) ON DELETE SET NULL,
  payment_status text DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  order_status text DEFAULT 'PENDING' CHECK (order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED')),
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  line_total decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_email text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  commission_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('PAYMENT', 'REFUND', 'COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT')),
  amount decimal(10,2) NOT NULL,
  reference text,
  metadata jsonb,
  status text DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id, order_id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_skus_product_id ON skus(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can create user account"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for products and skus (public read)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Anyone can view skus"
  ON skus FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for shipping_info
CREATE POLICY "Users can view own shipping info"
  ON shipping_info FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create shipping info"
  ON shipping_info FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- RLS Policies for referrals
CREATE POLICY "Affiliates can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (affiliate_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for settings (public read for certain keys)
CREATE POLICY "Anyone can view public settings"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Trigger to auto-generate order_id_string
CREATE OR REPLACE FUNCTION generate_order_id_string()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_id_string = 'MEL' || NEW.order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_id_string
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_id_string();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skus_updated_at BEFORE UPDATE ON skus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
  ('affiliate_commission_black_soap', '{"amount": 1000, "unit": "kg", "per_unit": 2}'::jsonb, 'Commission for Black Soap: 1000 Naira per 2kg'),
  ('affiliate_commission_kernel_oil', '{"amount": 1000, "unit": "L", "per_unit": 1}'::jsonb, 'Commission for Kernel Oil: 1000 Naira per 1L'),
  ('affiliate_discount_percentage', '5'::jsonb, 'Discount percentage for affiliate codes'),
  ('delivery_fees', '{}'::jsonb, 'Delivery fees by state and city'),
  ('contact_email', '"support@melodiva.com"'::jsonb, 'Customer support email'),
  ('contact_phone', '"+234"'::jsonb, 'Customer support phone'),
  ('contact_whatsapp', '"+234"'::jsonb, 'Customer support WhatsApp')
ON CONFLICT (key) DO NOTHING;
