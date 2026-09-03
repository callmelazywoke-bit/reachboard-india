/*
# Add profiles table and role-based access control (RBAC)

## Summary
This migration introduces Supabase Auth-based RBAC across the entire application.
It creates a `profiles` table linked to `auth.users`, adds `brand_id` to `brand_deals`
for ownership tracking, and replaces all permissive `USING (true)` policies with
proper ownership checks using `auth.uid()`.

## New Tables
- `profiles` — links each authenticated user to a role (`creator` or `brand`)
  and optionally to a `creators` row (for creator accounts).
  - `id` (uuid, PK, FK to auth.users.id)
  - `role` (text, NOT NULL, CHECK in 'creator','brand')
  - `creator_id` (uuid, nullable, FK to creators.id)
  - `display_name` (text)
  - `created_at` (timestamptz)

## Modified Tables
- `brand_deals` — added `brand_id uuid DEFAULT auth.uid()` column linking campaigns
  to the brand user who created them.
- `brand_inquiries` — no schema change; RLS now restricts SELECT to the inquiry's
  creator and INSERT to anyone (brands submit inquiries to creators).

## Security Changes (RLS)
### profiles
- SELECT: users can read their own profile row
- INSERT: users can insert their own profile row (on signup)
- UPDATE: users can update their own profile row

### creators
- SELECT: public (anyone can view creator profiles — leaderboard is public)
- INSERT: only the OAuth callback server (via service role, bypasses RLS)
- UPDATE: only the profile owner (auth.uid() matches profiles.creator_id)
- DELETE: revoked (already done in prior migration)

### brand_deals
- SELECT: public (creators need to see available campaigns)
- INSERT: only authenticated brand users (auth.uid() = brand_id)
- UPDATE: only the owning brand (auth.uid() = brand_id)
- DELETE: only the owning brand

### brand_applications
- SELECT: only the applicant creator or the owning brand
- INSERT: only authenticated creators (auth.uid() matches a profile with role='creator')
- UPDATE: only the owning brand (to change stage/status)
- DELETE: revoked

### brand_inquiries
- SELECT: only the inquiry's creator (creator_id matches profiles.creator_id for auth.uid())
- INSERT: anyone (brands submit inquiries — no account required for inbound)
- UPDATE: only the inquiry's creator
- DELETE: revoked

### reach_scores
- SELECT: public (leaderboard display)
- INSERT/UPDATE/DELETE: revoked for anon and authenticated (server-only via service role)

### media
- SELECT: public
- INSERT/UPDATE/DELETE: server-only (OAuth callback uses service role)

### cohort_benchmarks, creator_metrics
- SELECT: public (already read-only from prior migration)

## Important Notes
1. The Instagram OAuth callback uses the service-role key (server-side) to write
   creator rows, media, and reach_scores — it bypasses RLS entirely.
2. Brand users sign up via /signup with role='brand'; creator users get a profile
   row created during the Instagram OAuth flow.
3. The `brand_deals.brand_id` column defaults to auth.uid() so brand inserts
   automatically get ownership without the client passing it.
4. `brand_inquiries` SELECT is restricted to the creator who owns the inquiry.
   Brands submit inquiries without an account (INSERT remains open), but only
   the creator can read them.
*/

-- =====================================================
-- 1. Create profiles table
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('creator', 'brand')),
  creator_id uuid REFERENCES creators(id) ON DELETE SET NULL,
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. Add brand_id to brand_deals
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'brand_deals' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE brand_deals ADD COLUMN brand_id uuid DEFAULT auth.uid();
  END IF;
END $$;

-- =====================================================
-- 3. Replace brand_deals policies
-- =====================================================
DROP POLICY IF EXISTS "anon_select_brand_deals" ON brand_deals;
DROP POLICY IF EXISTS "anon_insert_brand_deals" ON brand_deals;
DROP POLICY IF EXISTS "anon_update_brand_deals" ON brand_deals;
DROP POLICY IF EXISTS "anon_delete_brand_deals" ON brand_deals;

-- Public can read campaigns (creators need to see them)
CREATE POLICY "select_brand_deals_public" ON brand_deals FOR SELECT
  TO anon, authenticated USING (true);

-- Only authenticated brand users can create campaigns
CREATE POLICY "insert_brand_deals_own" ON brand_deals FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = brand_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'brand'
    )
  );

-- Only the owning brand can update their campaigns
CREATE POLICY "update_brand_deals_own" ON brand_deals FOR UPDATE
  TO authenticated USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

-- Only the owning brand can delete their campaigns
CREATE POLICY "delete_brand_deals_own" ON brand_deals FOR DELETE
  TO authenticated USING (auth.uid() = brand_id);

REVOKE DELETE ON brand_deals FROM anon;

-- =====================================================
-- 4. Replace brand_applications policies
-- =====================================================
DROP POLICY IF EXISTS "anon_select_brand_apps" ON brand_applications;
DROP POLICY IF EXISTS "anon_insert_brand_apps" ON brand_applications;
DROP POLICY IF EXISTS "anon_update_brand_apps" ON brand_applications;
DROP POLICY IF EXISTS "anon_delete_brand_apps" ON brand_applications;

-- Applicant creator or owning brand can read applications
CREATE POLICY "select_brand_apps_participants" ON brand_applications FOR SELECT
  TO authenticated USING (
    -- The creator who applied
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = brand_applications.creator_id
    )
    OR
    -- The brand who owns the deal
    EXISTS (
      SELECT 1 FROM brand_deals bd
      WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid()
    )
  );

-- Only authenticated creators can apply
CREATE POLICY "insert_brand_apps_creator" ON brand_applications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'creator' AND p.creator_id = brand_applications.creator_id
    )
  );

-- Only the owning brand can update application stage/status
CREATE POLICY "update_brand_apps_brand" ON brand_applications FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM brand_deals bd
      WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brand_deals bd
      WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid()
    )
  );

REVOKE DELETE ON brand_applications FROM anon;

-- =====================================================
-- 5. Replace brand_inquiries policies
-- =====================================================
DROP POLICY IF EXISTS "anon_select_inquiries" ON brand_inquiries;
DROP POLICY IF EXISTS "anon_insert_inquiries" ON brand_inquiries;
DROP POLICY IF EXISTS "anon_update_inquiries" ON brand_inquiries;
DROP POLICY IF EXISTS "anon_delete_inquiries" ON brand_inquiries;

-- Only the inquiry's creator can read inquiries
CREATE POLICY "select_inquiries_creator" ON brand_inquiries FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id
    )
  );

-- Anyone can submit an inquiry (brands don't need an account)
CREATE POLICY "insert_inquiries_public" ON brand_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only the inquiry's creator can update inquiry status
CREATE POLICY "update_inquiries_creator" ON brand_inquiries FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id
    )
  );

-- =====================================================
-- 6. Lock down creators table
-- =====================================================
DROP POLICY IF EXISTS "anon_select_creators" ON creators;
DROP POLICY IF EXISTS "anon_insert_creators" ON creators;
DROP POLICY IF EXISTS "anon_update_creators" ON creators;
DROP POLICY IF EXISTS "anon_delete_creators" ON creators;

-- Public can read creator profiles (leaderboard)
CREATE POLICY "select_creators_public" ON creators FOR SELECT
  TO anon, authenticated USING (true);

-- Only the profile owner can update their own creator row
CREATE POLICY "update_creators_own" ON creators FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = creators.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.creator_id = creators.id
    )
  );

-- INSERT and DELETE are server-only (service role bypasses RLS)
REVOKE INSERT ON creators FROM anon, authenticated;
REVOKE DELETE ON creators FROM anon, authenticated;

-- =====================================================
-- 7. Lock down reach_scores (read-only to public)
-- =====================================================
DROP POLICY IF EXISTS "public_read_reach_scores" ON reach_scores;
DROP POLICY IF EXISTS "public_write_reach_scores" ON reach_scores;

CREATE POLICY "select_reach_scores_public" ON reach_scores FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON reach_scores FROM anon, authenticated;

-- =====================================================
-- 8. Lock down media (read-only to public, write server-only)
-- =====================================================
DROP POLICY IF EXISTS "anon_select_media" ON media;
DROP POLICY IF EXISTS "anon_insert_media" ON media;
DROP POLICY IF EXISTS "anon_update_media" ON media;
DROP POLICY IF EXISTS "anon_delete_media" ON media;

CREATE POLICY "select_media_public" ON media FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON media FROM anon, authenticated;

-- =====================================================
-- 9. Grant INSERT on creators to authenticated for OAuth flow
-- =====================================================
-- The Instagram OAuth callback runs server-side with the anon key client.
-- We need a trigger to auto-create a profile row when a creator is inserted
-- by the service role, OR we handle profile creation in the callback.
-- For now, INSERT on creators stays server-only (service role).

-- =====================================================
-- 10. Create index on brand_deals.brand_id
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_id ON brand_deals(brand_id);
CREATE INDEX IF NOT EXISTS idx_profiles_creator_id ON profiles(creator_id);
