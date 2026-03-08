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

-- 3. Backfill: sync any existing auth.users that are missing from public.users
INSERT INTO public.users (id, auth_user_id, email, full_name)
SELECT
  au.id,
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;
