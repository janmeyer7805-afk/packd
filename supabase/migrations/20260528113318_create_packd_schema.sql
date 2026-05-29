/*
  # Packd - Group Buying App Schema

  ## Overview
  Creates the core schema for the Packd group buying platform for Germany.

  ## New Tables

  ### profiles
  - `id` (uuid, PK, references auth.users) - User ID from auth
  - `email` (text) - User email
  - `name` (text) - Display name
  - `avatar_url` (text) - Avatar image URL
  - `created_at` (timestamptz) - When the profile was created

  ### deals
  - `id` (uuid, PK) - Deal ID
  - `title` (text) - Product/deal title
  - `photo_url` (text) - Product photo URL
  - `original_price` (numeric) - Original price in EUR
  - `deal_price` (numeric) - Discounted group price in EUR
  - `min_people` (int) - Minimum people needed (3-10)
  - `current_count` (int) - Current number of joined users
  - `category` (text) - Category: Supplements, Streetwear, Beauty, Sport
  - `status` (text) - open | success | failed
  - `expires_at` (timestamptz) - 48h deadline
  - `created_by` (uuid, FK profiles) - Deal creator
  - `created_at` (timestamptz) - Creation timestamp

  ### deal_joins
  - `id` (uuid, PK) - Join record ID
  - `deal_id` (uuid, FK deals) - Which deal
  - `user_id` (uuid, FK profiles) - Which user
  - `joined_at` (timestamptz) - When they joined

  ## Security
  - RLS enabled on all tables
  - Profiles: users can read all, update/insert own
  - Deals: all can read open deals, authenticated users create
  - Deal joins: authenticated users read, insert own joins
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  photo_url text DEFAULT '',
  original_price numeric(10,2) NOT NULL DEFAULT 0,
  deal_price numeric(10,2) NOT NULL DEFAULT 0,
  min_people int NOT NULL DEFAULT 3,
  current_count int NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Sport',
  status text NOT NULL DEFAULT 'open',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view deals"
  ON deals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Deal creators can update their deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Deal joins table
CREATE TABLE IF NOT EXISTS deal_joins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

ALTER TABLE deal_joins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view joins"
  ON deal_joins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join deals"
  ON deal_joins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave deals"
  ON deal_joins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment deal count when someone joins
CREATE OR REPLACE FUNCTION increment_deal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE deals
  SET current_count = current_count + 1,
      status = CASE
        WHEN current_count + 1 >= min_people THEN 'success'
        ELSE status
      END
  WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement deal count when someone leaves
CREATE OR REPLACE FUNCTION decrement_deal_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE deals
  SET current_count = GREATEST(current_count - 1, 0),
      status = CASE
        WHEN current_count - 1 < min_people AND status = 'success' THEN 'open'
        ELSE status
      END
  WHERE id = OLD.deal_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_deal_join ON deal_joins;
CREATE TRIGGER on_deal_join
  AFTER INSERT ON deal_joins
  FOR EACH ROW EXECUTE FUNCTION increment_deal_count();

DROP TRIGGER IF EXISTS on_deal_leave ON deal_joins;
CREATE TRIGGER on_deal_leave
  AFTER DELETE ON deal_joins
  FOR EACH ROW EXECUTE FUNCTION decrement_deal_count();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
