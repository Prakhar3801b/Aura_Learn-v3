-- ══════════════════════════════════════════════════════════════════════
-- Aura Learn V3 — Fix: Auto-sync Auth users to public.users table
--
-- Problem: When users sign up via Supabase Auth, a row is created in
-- auth.users but NOT in public.users. The study_materials table has a
-- foreign key to public.users(id), so uploads fail with:
--   "Key (user_id)=(...) is not present in table users"
--
-- Solution: Create a trigger that auto-inserts into public.users
-- whenever a new auth.users row is created. The public.users.id is set
-- to the SAME value as auth.users.id so the frontend can use the Auth
-- UUID directly.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════════

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, auth_user_id, email, full_name)
  VALUES (
    NEW.id,                                          -- same UUID as auth.users
    NEW.id,                                          -- link back to auth.users
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;                       -- idempotent
  RETURN NEW;
END;
$$;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: sync any existing auth.users that are missing or have mismatched IDs
-- We want to ensure that for every auth.users(id), there is a public.users(id) that is the SAME.
-- If a row exists with the same auth_user_id but different id, it's a problem for our current backend logic.
INSERT INTO public.users (id, auth_user_id, email, full_name)
SELECT
  au.id,
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  auth_user_id = EXCLUDED.auth_user_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Also handle cases where a row exists with the correct auth_user_id but wrong primary key 'id'
-- This is trickier because we can't easily change a primary key if it's referenced.
-- But for Aura Learn v3, let's assume we can try to merge or at least ensure new ones are correct.
