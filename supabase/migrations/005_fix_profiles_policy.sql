-- Fix infinite recursion in profiles policy
-- Run this in your Supabase SQL Editor

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Instead, modify the existing user policy to also allow admins
-- First drop the old policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create a new policy that allows users to view their own profile
-- AND allows admins to view all profiles (using a security definer function to avoid recursion)

-- Create a function to check if user is admin (avoids recursion by using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create a combined policy for viewing profiles
CREATE POLICY "Users can view own profile and admins can view all"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR is_admin(auth.uid())
  );
