-- MealMeow Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE activity_level AS ENUM ('normal', 'inactive', 'active');
CREATE TYPE goal AS ENUM ('maintain', 'lose', 'gain');
CREATE TYPE food_type AS ENUM ('dry', 'wet');
CREATE TYPE life_stage AS ENUM ('kitten', 'adult', 'senior', 'all');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cats table
CREATE TABLE cats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  weight_lbs DECIMAL(5,2) NOT NULL CHECK (weight_lbs > 0 AND weight_lbs <= 50),
  age_months INTEGER NOT NULL CHECK (age_months >= 0 AND age_months <= 360),
  gender gender NOT NULL,
  is_neutered BOOLEAN DEFAULT true,
  breed TEXT NOT NULL,
  activity_level activity_level DEFAULT 'normal',
  goal goal DEFAULT 'maintain',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cats
ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

-- Cats policies
CREATE POLICY "Users can view their own cats"
  ON cats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cats"
  ON cats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cats"
  ON cats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cats"
  ON cats FOR DELETE
  USING (auth.uid() = user_id);

-- Cat foods table
CREATE TABLE cat_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  food_type food_type NOT NULL,
  life_stage life_stage DEFAULT 'all',
  kcal_per_cup DECIMAL(6,2),
  kcal_per_can DECIMAL(6,2),
  can_size_oz DECIMAL(4,2),
  price_per_unit DECIMAL(8,2) NOT NULL CHECK (price_per_unit > 0),
  unit_size TEXT NOT NULL,
  protein_pct DECIMAL(4,1) NOT NULL CHECK (protein_pct >= 0 AND protein_pct <= 100),
  fat_pct DECIMAL(4,1) NOT NULL CHECK (fat_pct >= 0 AND fat_pct <= 100),
  fiber_pct DECIMAL(4,1) NOT NULL CHECK (fiber_pct >= 0 AND fiber_pct <= 100),
  moisture_pct DECIMAL(4,1) DEFAULT 0 CHECK (moisture_pct >= 0 AND moisture_pct <= 100),
  special_benefits TEXT[] DEFAULT '{}',
  is_complete_balanced BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure either kcal_per_cup or kcal_per_can is set based on food_type
  CONSTRAINT valid_kcal CHECK (
    (food_type = 'dry' AND kcal_per_cup IS NOT NULL) OR
    (food_type = 'wet' AND kcal_per_can IS NOT NULL)
  )
);

-- Enable RLS on cat_foods
ALTER TABLE cat_foods ENABLE ROW LEVEL SECURITY;

-- Cat foods policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view cat foods"
  ON cat_foods FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_cats_user_id ON cats(user_id);
CREATE INDEX idx_cat_foods_food_type ON cat_foods(food_type);
CREATE INDEX idx_cat_foods_life_stage ON cat_foods(life_stage);
CREATE INDEX idx_cat_foods_is_complete ON cat_foods(is_complete_balanced);

-- Sample data (optional - uncomment to add sample foods)
/*
INSERT INTO cat_foods (brand, product_name, food_type, life_stage, kcal_per_cup, price_per_unit, unit_size, protein_pct, fat_pct, fiber_pct, moisture_pct, special_benefits, is_complete_balanced)
VALUES
  ('Blue Buffalo', 'Wilderness Chicken', 'dry', 'adult', 416, 54.99, '12 lb bag', 40, 18, 5, 9, ARRAY['High Protein', 'Grain Free'], true),
  ('Purina', 'Pro Plan Complete Essentials', 'dry', 'adult', 476, 42.99, '16 lb bag', 36, 14, 3, 12, ARRAY['Indoor Formula'], true),
  ('Royal Canin', 'Indoor Adult', 'dry', 'adult', 348, 49.99, '15 lb bag', 27, 13, 6, 8, ARRAY['Indoor Formula', 'Hairball Control'], true),
  ('Hills Science Diet', 'Adult Perfect Weight', 'dry', 'adult', 291, 45.99, '15 lb bag', 38, 9, 12, 8, ARRAY['Weight Management'], true),
  ('Iams', 'ProActive Health Indoor', 'dry', 'adult', 368, 29.99, '16 lb bag', 32, 14, 4, 10, ARRAY['Indoor Formula', 'Hairball Control'], true);

INSERT INTO cat_foods (brand, product_name, food_type, life_stage, kcal_per_can, can_size_oz, price_per_unit, unit_size, protein_pct, fat_pct, fiber_pct, moisture_pct, special_benefits, is_complete_balanced)
VALUES
  ('Fancy Feast', 'Classic Pate Chicken', 'wet', 'all', 82, 3.0, 0.89, '3 oz can', 11, 4, 1.5, 78, ARRAY[], true),
  ('Sheba', 'Perfect Portions Salmon', 'wet', 'adult', 37, 1.3, 0.99, '1.3 oz twin pack', 9, 5, 0.5, 82, ARRAY[], true),
  ('Wellness', 'Complete Health Pate Chicken', 'wet', 'adult', 200, 5.5, 2.49, '5.5 oz can', 10, 7, 1, 78, ARRAY['Grain Free'], true),
  ('Purina', 'Friskies Shreds Chicken', 'wet', 'all', 80, 5.5, 0.79, '5.5 oz can', 9, 2.5, 1, 78, ARRAY[], true),
  ('Blue Buffalo', 'Tastefuls Kitten Chicken', 'wet', 'kitten', 98, 3.0, 1.49, '3 oz can', 10, 6, 1.5, 78, ARRAY['High Protein'], true);
*/
