-- Add food plan selection fields to cats table
-- This allows users to select a food plan for their cat

-- Add selected food reference
ALTER TABLE cats ADD COLUMN selected_food_id UUID REFERENCES cat_foods(id) ON DELETE SET NULL;

-- Add meals per day (default to 2, can be 2-6)
ALTER TABLE cats ADD COLUMN meals_per_day INTEGER DEFAULT 2 CHECK (meals_per_day >= 1 AND meals_per_day <= 10);

-- Add timestamp for when the food plan was selected
ALTER TABLE cats ADD COLUMN food_plan_selected_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX idx_cats_selected_food ON cats(selected_food_id);

-- Comment on columns
COMMENT ON COLUMN cats.selected_food_id IS 'The selected food for this cat''s feeding plan';
COMMENT ON COLUMN cats.meals_per_day IS 'Number of meals per day (typically 2-6)';
COMMENT ON COLUMN cats.food_plan_selected_at IS 'When the food plan was selected/updated';
