-- Migration: Ensure health_conditions column exists on cats table
-- Run this in the Supabase SQL Editor if you get the error:
-- "Could not find the 'health_conditions' column of 'cats' in the schema cache"

-- First, create the health_condition enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE health_condition AS ENUM (
    'weight_management',
    'sensitive_stomach',
    'urinary_health',
    'hairball_control',
    'dental_health',
    'skin_coat',
    'joint_support',
    'kidney_support',
    'diabetic'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add the health_conditions column if it doesn't exist
DO $$ BEGIN
  ALTER TABLE cats ADD COLUMN health_conditions health_condition[] DEFAULT '{}';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create index for health_conditions if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_cats_health_conditions ON cats USING GIN (health_conditions);

-- Also add profile_image_url column if it doesn't exist (commonly needed)
DO $$ BEGIN
  ALTER TABLE cats ADD COLUMN profile_image_url TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;
