/*
  # Allow anon access to deals for public feed

  ## Changes
  - The deals SELECT policy already allows `anon, authenticated` (checked - good)
  - Update profiles SELECT policy to also allow anon access
    (needed when joining deals with profile data on public feed)
  - Add anon read access to deal_joins for showing participant counts

  ## Security
  - Only SELECT is allowed for anon users
  - All write operations still require authentication
*/

-- Allow anon to read profiles (needed for deal card display)
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anon to read deal_joins (needed for participant counts)
DROP POLICY IF EXISTS "Authenticated users can view joins" ON deal_joins;
CREATE POLICY "Anyone can view joins"
  ON deal_joins FOR SELECT
  TO anon, authenticated
  USING (true);
