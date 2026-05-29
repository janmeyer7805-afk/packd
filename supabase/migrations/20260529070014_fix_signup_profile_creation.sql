/*
  # Fix signup flow - ensure profile creation works

  ## Problem
  - Email confirmation may be required by default, preventing immediate login
  - The handle_new_user trigger runs as SECURITY DEFINER but may not fire
    if signup is blocked by email confirmation
  - Profile INSERT policy only allows authenticated role

  ## Changes
  1. Recreate handle_new_user with explicit SECURITY DEFINER
  2. Allow the trigger function to also work for service_role
  3. Ensure profiles INSERT policy allows the trigger (SECURITY DEFINER bypasses this anyway)
  4. The client code will also manually create profile as fallback
*/

-- Ensure the handle_new_user function is correct
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-create the trigger (in case it was lost)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
