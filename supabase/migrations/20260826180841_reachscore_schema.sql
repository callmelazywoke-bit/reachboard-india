-- ReachScore system: enums, metrics, cohort benchmarks, and scores

-- Enum types
DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('UNCLAIMED', 'CLAIMED_PENDING', 'VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE follower_tier AS ENUM ('NANO', 'RISING', 'GROWTH', 'ESTABLISHED', 'ELITE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Raw verified metrics snapshot
CREATE TABLE IF NOT EXISTS creator_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  followers_count bigint NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  media_count integer NOT NULL DEFAULT 0,
  views_30d bigint NOT NULL DEFAULT 0,
  likes_30d bigint NOT NULL DEFAULT 0,
  comments_30d bigint NOT NULL DEFAULT 0,
  shares_30d bigint NOT NULL DEFAULT 0,
  raw_er numeric(6,3) NOT NULL DEFAULT 0.000,
  growth_rate_pct numeric(6,2) NOT NULL DEFAULT 0.00,
  posts_per_week numeric(4,1) NOT NULL DEFAULT 0.0,
  suspicious_follower_ratio numeric(5,2) DEFAULT 0.00,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE creator_metrics ENABLE ROW LEVEL SECURITY;

-- Cohort benchmark medians (precalculated per niche + tier)
CREATE TABLE IF NOT EXISTS cohort_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  niche text NOT NULL,
  tier follower_tier NOT NULL,
  median_er numeric(6,3) NOT NULL,
  median_views_ratio numeric(6,3) NOT NULL,
  median_growth_rate numeric(6,2) NOT NULL,
  median_posts_per_week numeric(4,1) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_niche_tier UNIQUE (niche, tier)
);

ALTER TABLE cohort_benchmarks ENABLE ROW LEVEL SECURITY;

-- Computed ReachScore records
CREATE TABLE IF NOT EXISTS reach_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  reach_score numeric(5,2) NOT NULL,
  score_engagement numeric(5,2) NOT NULL,
  score_view_velocity numeric(5,2) NOT NULL,
  score_growth_velocity numeric(5,2) NOT NULL,
  score_consistency numeric(5,2) NOT NULL,
  score_audience_quality numeric(5,2) NOT NULL,
  tier follower_tier NOT NULL DEFAULT 'NANO',
  india_rank integer,
  state_rank integer,
  niche_rank integer,
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE reach_scores ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reach_scores_creator ON reach_scores(creator_id);
CREATE INDEX IF NOT EXISTS idx_reach_scores_score ON reach_scores(reach_score DESC);
CREATE INDEX IF NOT EXISTS idx_creator_metrics_creator ON creator_metrics(creator_id);

-- RLS: public read for all, insert/update for anon+authenticated
DROP POLICY IF EXISTS "public_read_creator_metrics" ON creator_metrics;
CREATE POLICY "public_read_creator_metrics" ON creator_metrics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_write_creator_metrics" ON creator_metrics;
CREATE POLICY "public_write_creator_metrics" ON creator_metrics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_cohort_benchmarks" ON cohort_benchmarks;
CREATE POLICY "public_read_cohort_benchmarks" ON cohort_benchmarks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_write_cohort_benchmarks" ON cohort_benchmarks;
CREATE POLICY "public_write_cohort_benchmarks" ON cohort_benchmarks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_reach_scores" ON reach_scores;
CREATE POLICY "public_read_reach_scores" ON reach_scores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_write_reach_scores" ON reach_scores;
CREATE POLICY "public_write_reach_scores" ON reach_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed cohort benchmarks for all creator niches × all tiers
-- Values are realistic medians based on Indian Instagram creator ecosystem data
INSERT INTO cohort_benchmarks (niche, tier, median_er, median_views_ratio, median_growth_rate, median_posts_per_week) VALUES
  -- Motion Graphics & 3D
  ('motion_graphics_3d','NANO',5.500,2.000,3.00,2.5),
  ('motion_graphics_3d','RISING',4.800,2.500,5.00,3.0),
  ('motion_graphics_3d','GROWTH',3.800,3.000,4.00,3.0),
  ('motion_graphics_3d','ESTABLISHED',3.200,3.500,3.00,2.5),
  ('motion_graphics_3d','ELITE',2.500,4.000,2.00,2.0),
  -- Video Editors
  ('video_editors','NANO',6.200,2.500,4.00,3.5),
  ('video_editors','RISING',5.000,3.000,6.00,3.5),
  ('video_editors','GROWTH',4.000,3.500,5.00,3.0),
  ('video_editors','ESTABLISHED',3.500,4.000,4.00,3.0),
  ('video_editors','ELITE',2.800,4.500,3.00,2.5),
  -- Storytellers & Filmmakers
  ('storytellers_filmmakers','NANO',5.800,1.800,3.50,2.0),
  ('storytellers_filmmakers','RISING',4.500,2.500,5.50,2.5),
  ('storytellers_filmmakers','GROWTH',3.800,3.000,4.50,3.0),
  ('storytellers_filmmakers','ESTABLISHED',3.000,3.500,3.50,2.5),
  ('storytellers_filmmakers','ELITE',2.200,4.000,2.50,2.0),
  -- Dancers & Choreographers
  ('dancers_choreographers','NANO',7.500,3.000,5.00,3.5),
  ('dancers_choreographers','RISING',6.000,3.500,7.00,4.0),
  ('dancers_choreographers','GROWTH',5.000,4.000,6.00,3.5),
  ('dancers_choreographers','ESTABLISHED',4.000,4.500,5.00,3.0),
  ('dancers_choreographers','ELITE',3.000,5.000,3.00,2.5),
  -- Musicians & Singers
  ('musicians_singers','NANO',6.800,2.500,4.00,3.0),
  ('musicians_singers','RISING',5.500,3.000,6.00,3.5),
  ('musicians_singers','GROWTH',4.200,3.500,5.00,3.0),
  ('musicians_singers','ESTABLISHED',3.500,4.000,4.00,3.0),
  ('musicians_singers','ELITE',2.500,4.500,2.50,2.0),
  -- Comedians & Memers
  ('comedians_memers','NANO',8.500,3.500,6.00,4.0),
  ('comedians_memers','RISING',7.000,4.000,8.00,4.5),
  ('comedians_memers','GROWTH',5.500,4.500,7.00,4.0),
  ('comedians_memers','ESTABLISHED',4.500,5.000,5.00,3.5),
  ('comedians_memers','ELITE',3.500,5.500,3.00,3.0),
  -- Tech Creators
  ('tech_creators','NANO',5.000,2.000,4.00,3.0),
  ('tech_creators','RISING',4.000,2.500,6.00,3.5),
  ('tech_creators','GROWTH',3.500,3.000,5.00,3.5),
  ('tech_creators','ESTABLISHED',2.800,3.500,4.00,3.0),
  ('tech_creators','ELITE',2.200,4.000,3.00,2.5),
  -- Gamers
  ('gamers','NANO',7.000,3.000,5.00,4.0),
  ('gamers','RISING',5.500,3.500,7.00,4.5),
  ('gamers','GROWTH',4.500,4.000,6.00,4.0),
  ('gamers','ESTABLISHED',3.500,4.500,4.00,3.5),
  ('gamers','ELITE',2.800,5.000,3.00,3.0),
  -- Artists & Illustrators
  ('artists_illustrators','NANO',6.500,2.000,3.50,3.0),
  ('artists_illustrators','RISING',5.200,2.500,5.00,3.5),
  ('artists_illustrators','GROWTH',4.000,3.000,4.00,3.0),
  ('artists_illustrators','ESTABLISHED',3.200,3.500,3.00,2.5),
  ('artists_illustrators','ELITE',2.500,4.000,2.00,2.0),
  -- Fitness & Athletes
  ('fitness_athletes','NANO',6.000,2.500,4.50,3.5),
  ('fitness_athletes','RISING',4.800,3.000,6.00,4.0),
  ('fitness_athletes','GROWTH',3.800,3.500,5.00,3.5),
  ('fitness_athletes','ESTABLISHED',3.000,4.000,4.00,3.0),
  ('fitness_athletes','ELITE',2.200,4.500,2.50,2.5),
  -- Beauty & Makeup
  ('beauty_makeup','NANO',7.200,3.000,5.00,3.5),
  ('beauty_makeup','RISING',5.800,3.500,7.00,4.0),
  ('beauty_makeup','GROWTH',4.500,4.000,6.00,3.5),
  ('beauty_makeup','ESTABLISHED',3.500,4.500,4.00,3.0),
  ('beauty_makeup','ELITE',2.800,5.000,3.00,2.5),
  -- Fashion & Lifestyle
  ('fashion_lifestyle','NANO',6.800,2.500,4.50,3.5),
  ('fashion_lifestyle','RISING',5.500,3.000,6.50,4.0),
  ('fashion_lifestyle','GROWTH',4.200,3.500,5.50,3.5),
  ('fashion_lifestyle','ESTABLISHED',3.200,4.000,4.00,3.0),
  ('fashion_lifestyle','ELITE',2.500,4.500,3.00,2.5),
  -- Travel Bloggers
  ('travel_bloggers','NANO',5.500,2.500,4.00,3.0),
  ('travel_bloggers','RISING',4.200,3.000,6.00,3.5),
  ('travel_bloggers','GROWTH',3.500,3.500,5.00,3.0),
  ('travel_bloggers','ESTABLISHED',2.800,4.000,4.00,2.5),
  ('travel_bloggers','ELITE',2.200,4.500,3.00,2.0),
  -- Food Bloggers
  ('food_bloggers','NANO',7.000,3.000,5.00,3.5),
  ('food_bloggers','RISING',5.500,3.500,7.00,4.0),
  ('food_bloggers','GROWTH',4.200,4.000,6.00,3.5),
  ('food_bloggers','ESTABLISHED',3.200,4.500,4.00,3.0),
  ('food_bloggers','ELITE',2.500,5.000,3.00,2.5),
  -- Medical & Dentists
  ('medical_dentists','NANO',4.500,1.500,3.00,2.0),
  ('medical_dentists','RISING',3.800,2.000,4.50,2.5),
  ('medical_dentists','GROWTH',3.200,2.500,4.00,2.5),
  ('medical_dentists','ESTABLISHED',2.500,3.000,3.00,2.0),
  ('medical_dentists','ELITE',2.000,3.500,2.00,1.5),
  -- Business categories (lower benchmarks)
  ('restaurants_cafes','NANO',3.500,1.500,2.50,2.5),
  ('restaurants_cafes','RISING',3.000,2.000,3.50,3.0),
  ('restaurants_cafes','GROWTH',2.500,2.500,3.00,3.0),
  ('restaurants_cafes','ESTABLISHED',2.000,3.000,2.00,2.5),
  ('restaurants_cafes','ELITE',1.500,3.500,1.50,2.0),
  ('candle_home_fragrance','NANO',4.000,1.500,3.00,2.5),
  ('candle_home_fragrance','RISING',3.200,2.000,4.00,3.0),
  ('candle_home_fragrance','GROWTH',2.800,2.500,3.50,3.0),
  ('candle_home_fragrance','ESTABLISHED',2.200,3.000,2.50,2.5),
  ('candle_home_fragrance','ELITE',1.800,3.500,2.00,2.0),
  ('handmade_diy_crafts','NANO',5.000,2.000,3.50,2.5),
  ('handmade_diy_crafts','RISING',4.000,2.500,5.00,3.0),
  ('handmade_diy_crafts','GROWTH',3.200,3.000,4.00,3.0),
  ('handmade_diy_crafts','ESTABLISHED',2.500,3.500,3.00,2.5),
  ('handmade_diy_crafts','ELITE',2.000,4.000,2.00,2.0),
  ('apparel_streetwear','NANO',4.500,2.000,3.50,3.0),
  ('apparel_streetwear','RISING',3.800,2.500,5.00,3.5),
  ('apparel_streetwear','GROWTH',3.000,3.000,4.00,3.0),
  ('apparel_streetwear','ESTABLISHED',2.500,3.500,3.00,2.5),
  ('apparel_streetwear','ELITE',2.000,4.000,2.00,2.0),
  ('jewelry','NANO',4.200,1.800,3.00,2.5),
  ('jewelry','RISING',3.500,2.200,4.00,3.0),
  ('jewelry','GROWTH',2.800,2.800,3.50,3.0),
  ('jewelry','ESTABLISHED',2.200,3.200,2.50,2.5),
  ('jewelry','ELITE',1.800,3.500,2.00,2.0),
  ('skincare_brands','NANO',4.800,2.000,3.50,3.0),
  ('skincare_brands','RISING',3.800,2.500,5.00,3.5),
  ('skincare_brands','GROWTH',3.000,3.000,4.00,3.0),
  ('skincare_brands','ESTABLISHED',2.500,3.500,3.00,2.5),
  ('skincare_brands','ELITE',2.000,4.000,2.00,2.0),
  ('digital_marketing_agencies','NANO',3.800,1.500,3.00,2.5),
  ('digital_marketing_agencies','RISING',3.000,2.000,4.00,3.0),
  ('digital_marketing_agencies','GROWTH',2.500,2.500,3.50,3.0),
  ('digital_marketing_agencies','ESTABLISHED',2.000,3.000,2.50,2.5),
  ('digital_marketing_agencies','ELITE',1.500,3.500,2.00,2.0),
  ('gyms_studios','NANO',4.500,2.000,3.50,3.0),
  ('gyms_studios','RISING',3.500,2.500,5.00,3.5),
  ('gyms_studios','GROWTH',2.800,3.000,4.00,3.0),
  ('gyms_studios','ESTABLISHED',2.200,3.500,3.00,2.5),
  ('gyms_studios','ELITE',1.800,4.000,2.00,2.0),
  ('dental_health_clinics','NANO',3.800,1.500,2.50,2.0),
  ('dental_health_clinics','RISING',3.000,2.000,3.50,2.5),
  ('dental_health_clinics','GROWTH',2.500,2.500,3.00,2.5),
  ('dental_health_clinics','ESTABLISHED',2.000,3.000,2.00,2.0),
  ('dental_health_clinics','ELITE',1.500,3.500,1.50,1.5)
ON CONFLICT (niche, tier) DO UPDATE SET
  median_er = EXCLUDED.median_er,
  median_views_ratio = EXCLUDED.median_views_ratio,
  median_growth_rate = EXCLUDED.median_growth_rate,
  median_posts_per_week = EXCLUDED.median_posts_per_week,
  updated_at = now();