-- =====================================================
-- ReachBoard India — Complete Schema with RLS Policies
-- Generated: 2026-08-27
-- This file represents the current state of all tables and RLS policies.
-- =====================================================

-- =====================================================
-- Table: creators
-- =====================================================
-- Public creator profiles (Instagram-synced)
-- RLS: SELECT public, UPDATE owner-only, INSERT/DELETE server-only

CREATE TABLE IF NOT EXISTS creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_id text UNIQUE,
  username text NOT NULL,
  full_name text,
  avatar_url text,
  account_type text DEFAULT 'CREATOR',
  category_id text,
  category_confidence numeric,
  niche_badge text,
  followers_count bigint DEFAULT 0,
  media_count integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  avg_likes integer DEFAULT 0,
  avg_comments integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  reel_views_30d integer,
  top_media jsonb,
  rate_card jsonb,
  whatsapp_number text,
  contact_email text,
  custom_rates jsonb,
  state text DEFAULT 'All India',
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_creators_public" ON creators;
CREATE POLICY "select_creators_public" ON creators FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_creators_own" ON creators;
CREATE POLICY "update_creators_own" ON creators FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = creators.id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = creators.id)
  );

REVOKE INSERT, DELETE ON creators FROM anon, authenticated;

-- =====================================================
-- Table: profiles
-- =====================================================
-- Links authenticated users to roles and creator records

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
-- Table: brand_deals (Campaigns)
-- =====================================================
-- Brand campaigns with ownership via brand_id

CREATE TABLE IF NOT EXISTS brand_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid DEFAULT auth.uid(),
  brand_name text NOT NULL,
  brand_logo_url text,
  campaign_title text NOT NULL,
  niche_category_id text,
  min_followers bigint DEFAULT 0,
  min_engagement_rate numeric DEFAULT 0,
  payout_type text DEFAULT 'paid',
  budget_min numeric,
  budget_max numeric,
  description text,
  requirements text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  target_niches text[] DEFAULT '{}',
  location text DEFAULT 'All India',
  follower_tier text DEFAULT 'all',
  min_reach_score numeric DEFAULT 0,
  application_limit integer DEFAULT 30,
  deal_type text DEFAULT 'paid',
  brand_guidelines text,
  deliverables text
);

ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_brand_deals_public" ON brand_deals;
CREATE POLICY "select_brand_deals_public" ON brand_deals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_brand_deals_own" ON brand_deals;
CREATE POLICY "insert_brand_deals_own" ON brand_deals FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = brand_id
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'brand')
  );

DROP POLICY IF EXISTS "update_brand_deals_own" ON brand_deals;
CREATE POLICY "update_brand_deals_own" ON brand_deals FOR UPDATE
  TO authenticated USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

DROP POLICY IF EXISTS "delete_brand_deals_own" ON brand_deals;
CREATE POLICY "delete_brand_deals_own" ON brand_deals FOR DELETE
  TO authenticated USING (auth.uid() = brand_id);

REVOKE DELETE ON brand_deals FROM anon;

-- =====================================================
-- Table: brand_applications
-- =====================================================
-- Creator applications to brand campaigns

CREATE TABLE IF NOT EXISTS brand_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES brand_deals(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  pitch_quote text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  stage text DEFAULT 'new',
  counter_offer numeric
);

ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_brand_apps_participants" ON brand_applications;
CREATE POLICY "select_brand_apps_participants" ON brand_applications FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = brand_applications.creator_id)
    OR EXISTS (SELECT 1 FROM brand_deals bd WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_brand_apps_creator" ON brand_applications;
CREATE POLICY "insert_brand_apps_creator" ON brand_applications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'creator' AND p.creator_id = brand_applications.creator_id)
  );

DROP POLICY IF EXISTS "update_brand_apps_brand" ON brand_applications;
CREATE POLICY "update_brand_apps_brand" ON brand_applications FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM brand_deals bd WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM brand_deals bd WHERE bd.id = brand_applications.deal_id AND bd.brand_id = auth.uid())
  );

REVOKE DELETE ON brand_applications FROM anon;

-- =====================================================
-- Table: brand_inquiries
-- =====================================================
-- Inbound brand inquiries to creators

CREATE TABLE IF NOT EXISTS brand_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  contact_email text,
  budget_inr numeric,
  barter_details text,
  deliverables text,
  timeline text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brand_inquiries ENABLE ROW LEVEL SECURITY;

-- Only the inquiry's creator can read inquiries
DROP POLICY IF EXISTS "select_inquiries_creator" ON brand_inquiries;
CREATE POLICY "select_inquiries_creator" ON brand_inquiries FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id)
  );

-- Anyone can submit an inquiry (brands don't need an account)
DROP POLICY IF EXISTS "insert_inquiries_public" ON brand_inquiries;
CREATE POLICY "insert_inquiries_public" ON brand_inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only the inquiry's creator can update inquiry status
DROP POLICY IF EXISTS "update_inquiries_creator" ON brand_inquiries;
CREATE POLICY "update_inquiries_creator" ON brand_inquiries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.creator_id = brand_inquiries.creator_id)
  );

-- =====================================================
-- Table: reach_scores
-- =====================================================
-- Read-only to public, write server-only (service role)

CREATE TABLE IF NOT EXISTS reach_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  reach_score numeric,
  score_engagement numeric,
  score_view_velocity numeric,
  score_growth_velocity numeric,
  score_consistency numeric,
  score_audience_quality numeric,
  tier text,
  india_rank integer,
  state_rank integer,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(creator_id)
);

ALTER TABLE reach_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reach_scores_public" ON reach_scores;
CREATE POLICY "select_reach_scores_public" ON reach_scores FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON reach_scores FROM anon, authenticated;

-- =====================================================
-- Table: media
-- =====================================================
-- Read-only to public, write server-only (OAuth callback)

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  instagram_media_id text,
  caption text,
  media_type text,
  media_url text,
  thumbnail_url text,
  permalink text,
  like_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  timestamp timestamptz
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_media_public" ON media;
CREATE POLICY "select_media_public" ON media FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON media FROM anon, authenticated;

-- =====================================================
-- Table: cohort_benchmarks
-- =====================================================
-- Read-only reference data

CREATE TABLE IF NOT EXISTS cohort_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche text,
  tier text,
  median_er numeric,
  median_views_ratio numeric,
  median_growth_rate numeric,
  median_posts_per_week numeric
);

ALTER TABLE cohort_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cohort_benchmarks" ON cohort_benchmarks;
CREATE POLICY "public_read_cohort_benchmarks" ON cohort_benchmarks FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON cohort_benchmarks FROM anon, authenticated;

-- =====================================================
-- Table: creator_metrics
-- =====================================================
-- Read-only reference data

CREATE TABLE IF NOT EXISTS creator_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  metric_type text,
  metric_value numeric,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE creator_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_creator_metrics" ON creator_metrics;
CREATE POLICY "public_read_creator_metrics" ON creator_metrics FOR SELECT
  TO anon, authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON creator_metrics FROM anon, authenticated;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_brand_deals_brand_id ON brand_deals(brand_id);
CREATE INDEX IF NOT EXISTS idx_profiles_creator_id ON profiles(creator_id);
CREATE INDEX IF NOT EXISTS idx_reach_scores_creator_id ON reach_scores(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_inquiries_creator_id ON brand_inquiries(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_creator_id ON brand_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_applications_deal_id ON brand_applications(deal_id);
CREATE INDEX IF NOT EXISTS idx_media_creator_id ON media(creator_id);
