-- Migration: Add saved_meal_plans table
-- Allows users to create and save meal plans without needing a full cat profile

-- Create the saved_meal_plans table
CREATE TABLE IF NOT EXISTS saved_meal_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_name TEXT NOT NULL,
  target_der INTEGER NOT NULL,
  derived_from_weight_lbs DECIMAL(5,2),
  derived_from_age_months INTEGER,
  meals_per_day INTEGER DEFAULT 2 CHECK (meals_per_day >= 1 AND meals_per_day <= 10),
  food_selections JSONB NOT NULL DEFAULT '[]',
  total_kcal INTEGER,
  total_daily_cost DECIMAL(8,2),
  total_monthly_cost DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_user_id ON saved_meal_plans(user_id);

-- Enable RLS
ALTER TABLE saved_meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own plans

-- Allow users to view their own plans
CREATE POLICY "Users can view own saved plans"
  ON saved_meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to create their own plans
CREATE POLICY "Users can create own saved plans"
  ON saved_meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own plans
CREATE POLICY "Users can update own saved plans"
  ON saved_meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own plans
CREATE POLICY "Users can delete own saved plans"
  ON saved_meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_meal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_saved_meal_plans_updated_at
  BEFORE UPDATE ON saved_meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_meal_plans_updated_at();
