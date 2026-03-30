-- Add product/variant scope for discounts (promotions)
-- Allows a discount to apply to:
-- - all products (productid NULL, variantid NULL)
-- - a product (productid NOT NULL, variantid NULL)
-- - a specific variant (productid NOT NULL, variantid NOT NULL)

ALTER TABLE discounts
  ADD COLUMN IF NOT EXISTS productid INTEGER REFERENCES products(productid) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variantid INTEGER REFERENCES productvariants(variantid) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'discounts_variant_requires_product'
  ) THEN
    ALTER TABLE discounts
      ADD CONSTRAINT discounts_variant_requires_product
      CHECK (variantid IS NULL OR productid IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_discounts_productid ON discounts(productid);
CREATE INDEX IF NOT EXISTS idx_discounts_variantid ON discounts(variantid);

