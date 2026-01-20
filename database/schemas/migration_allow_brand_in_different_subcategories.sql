-- Migration: Allow brands with same name/code in different subcategories
-- This migration changes the unique constraints on Brands table from global to per-subcategory
-- Run this script on your existing database to update the constraints

-- Step 1: Drop existing unique constraints
-- Note: Constraint names may vary, so we'll try common variations
DO $$ 
BEGIN
    -- Drop constraints if they exist (PostgreSQL will ignore if they don't exist)
    ALTER TABLE Brands DROP CONSTRAINT IF EXISTS brands_brandnameth_key;
    ALTER TABLE Brands DROP CONSTRAINT IF EXISTS brands_brandnameen_key;
    ALTER TABLE Brands DROP CONSTRAINT IF EXISTS brands_brandcode_key;
    ALTER TABLE Brands DROP CONSTRAINT IF EXISTS brands_brandcode_key1;
    
    -- Try alternative constraint names (PostgreSQL sometimes uses different naming)
    BEGIN
        ALTER TABLE Brands DROP CONSTRAINT brands_brandnameth_key CASCADE;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE Brands DROP CONSTRAINT brands_brandnameen_key CASCADE;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE Brands DROP CONSTRAINT brands_brandcode_key CASCADE;
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
END $$;

-- Step 2: Add composite unique constraints that include SubCategoryID
-- This allows the same brand name/code to exist in different subcategories
ALTER TABLE Brands 
    ADD CONSTRAINT brands_subcategoryid_brandnameth_unique UNIQUE(SubCategoryID, BrandNameTH);

ALTER TABLE Brands 
    ADD CONSTRAINT brands_subcategoryid_brandnameen_unique UNIQUE(SubCategoryID, BrandNameEN);

ALTER TABLE Brands 
    ADD CONSTRAINT brands_subcategoryid_brandcode_unique UNIQUE(SubCategoryID, BrandCode);

-- Verify the constraints were created
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'brands'::regclass
    AND contype = 'u'
ORDER BY conname;

