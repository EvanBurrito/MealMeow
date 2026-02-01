-- Migration: Add show_details_public to cats table
-- Allows cat owners to control whether cat details (age, weight, activity, goal)
-- are visible to visitors on public profiles. Nutrition Summary remains owner-only.

ALTER TABLE cats ADD COLUMN IF NOT EXISTS show_details_public BOOLEAN DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN cats.show_details_public IS 'When true, cat details (age, weight, breed, activity, goal) are visible to visitors on public profiles. Nutrition Summary is always owner-only.';
