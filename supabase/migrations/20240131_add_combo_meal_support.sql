-- Add combo meal support to cats table
-- Allows storing a secondary food for combined wet/dry meal plans

-- Add secondary food reference
ALTER TABLE cats ADD COLUMN IF NOT EXISTS secondary_food_id UUID REFERENCES cat_foods(id) ON DELETE SET NULL;

-- Add primary food amount (practical portion like 2.0 cans)
ALTER TABLE cats ADD COLUMN IF NOT EXISTS primary_food_amount DECIMAL(4,2);

-- Add secondary food amount
ALTER TABLE cats ADD COLUMN IF NOT EXISTS secondary_food_amount DECIMAL(4,2);

-- Create index for secondary food lookups
CREATE INDEX IF NOT EXISTS idx_cats_secondary_food ON cats(secondary_food_id);

-- Comments
COMMENT ON COLUMN cats.secondary_food_id IS 'Optional secondary food for combo meal plans (e.g., dry supplement to wet food)';
COMMENT ON COLUMN cats.primary_food_amount IS 'Daily amount of primary food in practical portions (cans for wet, cups for dry)';
COMMENT ON COLUMN cats.secondary_food_amount IS 'Daily amount of secondary food in practical portions';
