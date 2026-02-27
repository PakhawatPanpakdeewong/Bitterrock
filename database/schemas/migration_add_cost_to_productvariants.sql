-- Migration: Add cost column to productvariants table
-- Cost represents the cost of the product (ต้นทุน) for margin calculation
-- Run this script if the cost column does not exist

-- Add cost column if it does not exist (PostgreSQL 9.6+)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'productvariants' 
        AND column_name = 'cost'
    ) THEN
        ALTER TABLE productvariants ADD COLUMN cost NUMERIC(10, 2);
        COMMENT ON COLUMN productvariants.cost IS 'ต้นทุนสินค้า (Product cost) - nullable for backward compatibility';
    END IF;
END $$;
