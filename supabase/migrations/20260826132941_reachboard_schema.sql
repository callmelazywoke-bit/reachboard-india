/*
# ReachBoard India - Core Schema

1. Overview
Creates the core data model for ReachBoard India, a verified Instagram creator
leaderboard, media kit generator, and brand pitch platform. The app is
single-tenant (no Supabase auth screen) — creators are ingested via Instagram
OAuth on the server side and stored as rows in `creators`. All rows are
intentionally public (leaderboard display), so policies are scoped to
`anon, authenticated`.

2. New Tables
- `creators`: one row per Instagram creator/business.
- `media`: recent media items per creator (up to 25).
- `brand_inquiries`: inbound sponsorship proposals.

3. Indexes
- creators(username), creators(category_id), creators(state),
  creators(followers_count desc), creators(reel_views_30d desc),
  creators(engagement_rate desc), creators(is_verified).
- media(creator_id).

4. Security
- RLS enabled on all tables.
- All tables use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because the leaderboard data is intentionally public/shared (single-tenant, no
  sign-in screen). Brand inquiries are also public-write so brands can submit
  proposals without an account; reads are public so creators can view their inbox.
*/

CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_id text UNIQUE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  account_type text DEFAULT 'CREATOR',
  category_id text,
  category_confidence numeric DEFAULT 0,
  niche_badge text DEFAULT 'emerging_creator',
  state text,
  followers_count bigint DEFAULT 0,
  media_count int DEFAULT 0,
  reel_views_30d bigint DEFAULT 0,
  median_reel_views_30d bigint DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  avg_likes bigint DEFAULT 0,
  avg_comments bigint DEFAULT 0,
  is_verified boolean DEFAULT false,
  collab_status text[] DEFAULT '{}',
  whatsapp_number text,
  contact_email text,
  custom_rates jsonb DEFAULT '{}',
  rate_card jsonb DEFAULT '{}',
  top_media jsonb DEFAULT '[]',
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_category ON creators(category_id);
CREATE INDEX IF NOT EXISTS idx_creators_state ON creators(state);
CREATE INDEX IF NOT EXISTS idx_creators_followers ON creators(followers_count DESC);
CREATE INDEX IF NOT EXISTS idx_creators_reel_views ON creators(reel_views_30d DESC);
CREATE INDEX IF NOT EXISTS idx_creators_er ON creators(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_creators_verified ON creators(is_verified);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  instagram_media_id text,
  caption text,
  media_type text,
  media_url text,
  thumbnail_url text,
  permalink text,
  like_count bigint DEFAULT 0,
  comments_count bigint DEFAULT 0,
  view_count bigint DEFAULT 0,
  timestamp timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_media_creator ON media(creator_id);

CREATE TABLE IF NOT EXISTS brand_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  contact_email text NOT NULL,
  budget_inr numeric,
  barter_details text,
  deliverables text,
  timeline text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brand_inquiries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_inquiries_creator ON brand_inquiries(creator_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON brand_inquiries(status);

-- creators policies (public read/write)
DROP POLICY IF EXISTS "anon_select_creators" ON creators;
CREATE POLICY "anon_select_creators" ON creators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_creators" ON creators;
CREATE POLICY "anon_insert_creators" ON creators FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_creators" ON creators;
CREATE POLICY "anon_update_creators" ON creators FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_creators" ON creators;
CREATE POLICY "anon_delete_creators" ON creators FOR DELETE
  TO anon, authenticated USING (true);

-- media policies (public read/write)
DROP POLICY IF EXISTS "anon_select_media" ON media;
CREATE POLICY "anon_select_media" ON media FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_media" ON media;
CREATE POLICY "anon_insert_media" ON media FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_media" ON media;
CREATE POLICY "anon_update_media" ON media FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_media" ON media;
CREATE POLICY "anon_delete_media" ON media FOR DELETE
  TO anon, authenticated USING (true);

-- brand_inquiries policies (public read/write)
DROP POLICY IF EXISTS "anon_select_inquiries" ON brand_inquiries;
CREATE POLICY "anon_select_inquiries" ON brand_inquiries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inquiries" ON brand_inquiries;
CREATE POLICY "anon_insert_inquiries" ON brand_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inquiries" ON brand_inquiries;
CREATE POLICY "anon_update_inquiries" ON brand_inquiries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inquiries" ON brand_inquiries;
CREATE POLICY "anon_delete_inquiries" ON brand_inquiries FOR DELETE
  TO anon, authenticated USING (true);
