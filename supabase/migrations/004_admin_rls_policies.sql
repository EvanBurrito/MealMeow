-- Admin RLS Policies for Analytics and Feedback
-- Run this in your Supabase SQL Editor

-- =============================================
-- Create tables if they don't exist
-- =============================================

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cat_id UUID REFERENCES cats(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  food_id UUID REFERENCES cat_foods(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics_events (if not already enabled)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_food ON analytics_events(food_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

-- Feedback type enum (create if not exists)
DO $$ BEGIN
  CREATE TYPE feedback_type AS ENUM ('purchased', 'tried', 'interested', 'not_interested');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Recommendation feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cat_id UUID REFERENCES cats(id) ON DELETE CASCADE NOT NULL,
  food_id UUID REFERENCES cat_foods(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type feedback_type NOT NULL,
  comment TEXT,
  cat_liked BOOLEAN,
  would_repurchase BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cat_id, food_id)
);

-- Enable RLS on recommendation_feedback (if not already enabled)
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_food ON recommendation_feedback(food_id);
CREATE INDEX IF NOT EXISTS idx_feedback_cat ON recommendation_feedback(cat_id);

-- Add is_admin column to profiles if it doesn't exist
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- =============================================
-- Create base user policies if they don't exist
-- =============================================

-- Users can insert their own analytics events
DO $$ BEGIN
  CREATE POLICY "Users can insert their own analytics"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users can view their own analytics
DO $$ BEGIN
  CREATE POLICY "Users can view their own analytics"
    ON analytics_events FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users can manage their own feedback
DO $$ BEGIN
  CREATE POLICY "Users can view their own feedback"
    ON recommendation_feedback FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own feedback"
    ON recommendation_feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own feedback"
    ON recommendation_feedback FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own feedback"
    ON recommendation_feedback FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- Admin RLS Policies
-- =============================================

-- Allow admins to view all analytics events
DO $$ BEGIN
  CREATE POLICY "Admins can view all analytics"
    ON analytics_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Allow admins to view all feedback
DO $$ BEGIN
  CREATE POLICY "Admins can view all feedback"
    ON recommendation_feedback FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Allow admins to view all profiles (for feedback user info)
DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Allow admins to insert foods directly
DO $$ BEGIN
  CREATE POLICY "Admins can insert cat foods"
    ON cat_foods FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- Trigger for feedback timestamp updates
-- =============================================

CREATE OR REPLACE FUNCTION update_feedback_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS feedback_updated ON recommendation_feedback;
CREATE TRIGGER feedback_updated
  BEFORE UPDATE ON recommendation_feedback
  FOR EACH ROW EXECUTE FUNCTION update_feedback_timestamp();
