-- Migration: Community Foundation (Phase 1)
-- Adds social community features where cats are the identity

-- =============================================
-- 1. Add columns to cats table for public profiles
-- =============================================

ALTER TABLE cats ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE cats ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE cats ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- Index for finding public cats
CREATE INDEX IF NOT EXISTS idx_cats_is_public ON cats(is_public) WHERE is_public = true;

-- Update cats RLS to allow viewing public cats
CREATE POLICY "Anyone can view public cats"
  ON cats FOR SELECT
  USING (is_public = true);

-- =============================================
-- 2. Create meal plan category enum
-- =============================================

CREATE TYPE meal_plan_category AS ENUM (
  'indoor',
  'outdoor',
  'weight_loss',
  'weight_gain',
  'senior',
  'kitten',
  'health'
);

-- =============================================
-- 3. Add columns to saved_meal_plans for sharing
-- =============================================

ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS cat_id UUID REFERENCES cats(id) ON DELETE SET NULL;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS category meal_plan_category;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS health_focus health_condition[] DEFAULT '{}';
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS uses_count INTEGER DEFAULT 0;
ALTER TABLE saved_meal_plans ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP WITH TIME ZONE;

-- Index for finding shared plans
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_is_shared ON saved_meal_plans(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_category ON saved_meal_plans(category);
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_cat_id ON saved_meal_plans(cat_id);

-- Update RLS to allow viewing shared plans
CREATE POLICY "Anyone can view shared plans"
  ON saved_meal_plans FOR SELECT
  USING (is_shared = true);

-- =============================================
-- 4. Create cat_follows table
-- =============================================

CREATE TABLE IF NOT EXISTS cat_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  followed_cat_id UUID REFERENCES cats(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_user_id, followed_cat_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cat_follows_follower ON cat_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_cat_follows_followed ON cat_follows(followed_cat_id);

-- Enable RLS
ALTER TABLE cat_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own follows"
  ON cat_follows FOR SELECT
  USING (auth.uid() = follower_user_id);

CREATE POLICY "Users can follow public cats"
  ON cat_follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_user_id
    AND EXISTS (
      SELECT 1 FROM cats WHERE id = followed_cat_id AND is_public = true
    )
  );

CREATE POLICY "Users can unfollow cats"
  ON cat_follows FOR DELETE
  USING (auth.uid() = follower_user_id);

-- =============================================
-- 5. Create plan_likes table
-- =============================================

CREATE TABLE IF NOT EXISTS plan_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES saved_meal_plans(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_likes_user ON plan_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_likes_plan ON plan_likes(plan_id);

-- Enable RLS
ALTER TABLE plan_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own likes"
  ON plan_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can like shared plans"
  ON plan_likes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM saved_meal_plans WHERE id = plan_id AND is_shared = true
    )
  );

CREATE POLICY "Users can unlike plans"
  ON plan_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 6. Create plan_saves table (bookmarks)
-- =============================================

CREATE TABLE IF NOT EXISTS plan_saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES saved_meal_plans(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plan_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_saves_user ON plan_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_saves_plan ON plan_saves(plan_id);

-- Enable RLS
ALTER TABLE plan_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saves"
  ON plan_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save shared plans"
  ON plan_saves FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM saved_meal_plans WHERE id = plan_id AND is_shared = true
    )
  );

CREATE POLICY "Users can unsave plans"
  ON plan_saves FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 7. Trigger functions for counter updates
-- =============================================

-- Update followers_count on cats when follows change
CREATE OR REPLACE FUNCTION update_cat_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cats SET followers_count = followers_count + 1 WHERE id = NEW.followed_cat_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cats SET followers_count = followers_count - 1 WHERE id = OLD.followed_cat_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_followers_count
  AFTER INSERT OR DELETE ON cat_follows
  FOR EACH ROW EXECUTE FUNCTION update_cat_followers_count();

-- Update likes_count on saved_meal_plans when likes change
CREATE OR REPLACE FUNCTION update_plan_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE saved_meal_plans SET likes_count = likes_count + 1 WHERE id = NEW.plan_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE saved_meal_plans SET likes_count = likes_count - 1 WHERE id = OLD.plan_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON plan_likes
  FOR EACH ROW EXECUTE FUNCTION update_plan_likes_count();

-- Update saves_count on saved_meal_plans when saves change
CREATE OR REPLACE FUNCTION update_plan_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE saved_meal_plans SET saves_count = saves_count + 1 WHERE id = NEW.plan_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE saved_meal_plans SET saves_count = saves_count - 1 WHERE id = OLD.plan_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_saves_count
  AFTER INSERT OR DELETE ON plan_saves
  FOR EACH ROW EXECUTE FUNCTION update_plan_saves_count();
