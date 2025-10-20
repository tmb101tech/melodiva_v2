/*
  # Create Helper Functions

  ## Overview
  Creates PostgreSQL functions for common operations like updating balances and stock.

  ## Functions Created
  1. `increment_affiliate_balance` - Safely increments affiliate balance
  2. `decrement_affiliate_balance` - Safely decrements affiliate balance
  3. `decrement_sku_stock` - Safely decrements SKU stock
*/

-- Function to increment affiliate balance
CREATE OR REPLACE FUNCTION increment_affiliate_balance(user_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET affiliate_balance = affiliate_balance + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement affiliate balance
CREATE OR REPLACE FUNCTION decrement_affiliate_balance(user_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET affiliate_balance = affiliate_balance - amount
  WHERE id = user_id AND affiliate_balance >= amount;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement SKU stock
CREATE OR REPLACE FUNCTION decrement_sku_stock(sku_id uuid, quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE skus
  SET stock = stock - quantity
  WHERE id = sku_id AND stock >= quantity;
END;
$$ LANGUAGE plpgsql;
