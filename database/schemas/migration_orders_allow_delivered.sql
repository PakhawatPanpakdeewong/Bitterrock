-- Migration: Allow 'delivered' status in orders table
-- Fix: orders_orderstatus_check constraint violation
-- Run this if you get: "new row for relation "orders" violates check constraint "orders_orderstatus_check""

-- Drop existing constraint and add new one that includes 'delivered'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_orderstatus_check;
ALTER TABLE orders ADD CONSTRAINT orders_orderstatus_check 
  CHECK (orderstatus IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));
