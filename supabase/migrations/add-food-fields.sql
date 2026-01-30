-- Migration: Add flavour and purchase_url columns to food tables
-- Run this in the Supabase SQL Editor

-- Add columns to cat_foods table
ALTER TABLE cat_foods ADD COLUMN IF NOT EXISTS flavour VARCHAR(255);
ALTER TABLE cat_foods ADD COLUMN IF NOT EXISTS purchase_url TEXT;

-- Add columns to user_submitted_foods table (only if the table exists)
-- Uncomment these lines if you have the user_submitted_foods table:
-- ALTER TABLE user_submitted_foods ADD COLUMN IF NOT EXISTS flavour VARCHAR(255);
-- ALTER TABLE user_submitted_foods ADD COLUMN IF NOT EXISTS purchase_url TEXT;
