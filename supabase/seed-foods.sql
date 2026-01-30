-- MealMeow Cat Food Seed Data
-- Run this SQL in your Supabase SQL Editor to populate the cat_foods table

-- First, add the new columns if they don't exist
ALTER TABLE cat_foods ADD COLUMN IF NOT EXISTS servings_per_unit DECIMAL(6,1) DEFAULT 1;
ALTER TABLE cat_foods ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Clear existing data (optional - comment out if you want to keep existing)
-- DELETE FROM cat_foods;

-- =====================
-- DRY FOODS (10 products)
-- Servings = approximate cups per bag (about 4 cups per lb for dry food)
-- =====================

INSERT INTO cat_foods (brand, product_name, food_type, life_stage, kcal_per_cup, price_per_unit, unit_size, servings_per_unit, protein_pct, fat_pct, fiber_pct, moisture_pct, special_benefits, is_complete_balanced, image_url)
VALUES
  -- Premium Options
  ('Blue Buffalo', 'Wilderness Indoor Chicken', 'dry', 'adult', 416, 42.99, '11 lb bag', 44, 40.0, 18.0, 5.0, 9.0, ARRAY['High Protein', 'Grain Free', 'Indoor Formula'], true, NULL),

  ('Wellness', 'Complete Health Indoor', 'dry', 'adult', 355, 48.99, '11.5 lb bag', 46, 32.0, 12.0, 5.0, 10.0, ARRAY['Indoor Formula', 'Hairball Control', 'Weight Management'], true, NULL),

  ('Nutro', 'Wholesome Essentials Indoor', 'dry', 'adult', 344, 36.99, '14 lb bag', 56, 33.0, 14.0, 6.0, 10.0, ARRAY['Indoor Formula', 'Hairball Control'], true, NULL),

  -- Vet-Recommended
  ('Royal Canin', 'Indoor Adult', 'dry', 'adult', 348, 52.99, '15 lb bag', 60, 27.0, 13.0, 6.0, 8.0, ARRAY['Indoor Formula', 'Hairball Control', 'Urinary Health'], true, NULL),

  ('Hills Science Diet', 'Adult Indoor', 'dry', 'adult', 354, 49.99, '15.5 lb bag', 62, 31.0, 15.5, 5.5, 8.0, ARRAY['Indoor Formula', 'Hairball Control'], true, NULL),

  -- Mid-Range
  ('Purina Pro Plan', 'Complete Essentials Indoor', 'dry', 'adult', 476, 44.99, '16 lb bag', 64, 38.0, 12.0, 5.0, 12.0, ARRAY['Indoor Formula', 'Hairball Control'], true, NULL),

  ('Purina ONE', 'Indoor Advantage', 'dry', 'adult', 398, 29.99, '16 lb bag', 64, 34.0, 14.0, 4.0, 12.0, ARRAY['Indoor Formula', 'Hairball Control'], true, NULL),

  ('Iams', 'ProActive Health Indoor Weight & Hairball', 'dry', 'adult', 325, 27.99, '16 lb bag', 64, 30.0, 9.0, 8.0, 10.0, ARRAY['Indoor Formula', 'Hairball Control', 'Weight Management'], true, NULL),

  -- Budget-Friendly
  ('Meow Mix', 'Original Choice', 'dry', 'all', 368, 18.99, '16 lb bag', 64, 30.0, 11.0, 3.0, 12.0, ARRAY[]::text[], true, NULL),

  ('Fancy Feast', 'Gourmet Dry Savory Chicken & Turkey', 'dry', 'adult', 391, 19.99, '12 lb bag', 48, 34.0, 13.0, 3.0, 12.0, ARRAY[]::text[], true, NULL);

-- =====================
-- WET FOODS (8 products)
-- Servings = 1 for single cans, price is per can
-- =====================

INSERT INTO cat_foods (brand, product_name, food_type, life_stage, kcal_per_can, can_size_oz, price_per_unit, unit_size, servings_per_unit, protein_pct, fat_pct, fiber_pct, moisture_pct, special_benefits, is_complete_balanced, image_url)
VALUES
  -- Premium Options
  ('Wellness', 'Complete Health Pate Chicken', 'wet', 'adult', 199, 5.5, 2.49, '5.5 oz can', 1, 10.0, 7.0, 1.0, 78.0, ARRAY['Grain Free'], true, NULL),

  ('Weruva', 'Paw Lickin Chicken', 'wet', 'adult', 72, 3.0, 2.29, '3 oz can', 1, 12.0, 1.5, 0.5, 85.0, ARRAY['Grain Free', 'High Protein'], true, NULL),

  ('Blue Buffalo', 'Tastefuls Adult Chicken Pate', 'wet', 'adult', 112, 3.0, 1.49, '3 oz can', 1, 9.5, 6.0, 1.5, 78.0, ARRAY['Grain Free'], true, NULL),

  -- Vet-Recommended
  ('Royal Canin', 'Adult Instinctive Thin Slices', 'wet', 'adult', 71, 3.0, 2.19, '3 oz can', 1, 9.5, 4.0, 1.5, 81.0, ARRAY['Urinary Health'], true, NULL),

  ('Hills Science Diet', 'Adult Tender Chicken Dinner', 'wet', 'adult', 163, 5.5, 2.79, '5.5 oz can', 1, 7.5, 4.5, 1.0, 80.0, ARRAY[]::text[], true, NULL),

  -- Budget-Friendly
  ('Fancy Feast', 'Classic Pate Chicken Feast', 'wet', 'all', 82, 3.0, 0.89, '3 oz can', 1, 11.0, 4.0, 1.5, 78.0, ARRAY[]::text[], true, NULL),

  ('Sheba', 'Perfect Portions Salmon', 'wet', 'adult', 74, 2.6, 0.99, '2.6 oz twin pack', 2, 9.0, 5.0, 0.5, 82.0, ARRAY[]::text[], true, NULL),

  ('Purina Friskies', 'Shreds Chicken in Gravy', 'wet', 'all', 80, 5.5, 0.79, '5.5 oz can', 1, 9.0, 2.5, 1.0, 78.0, ARRAY[]::text[], true, NULL);

-- Verify the data was inserted
-- SELECT brand, product_name, food_type, servings_per_unit, price_per_unit FROM cat_foods ORDER BY food_type, brand;
