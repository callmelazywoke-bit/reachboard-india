-- Brand Deals & Collaboration Hub tables

CREATE TABLE IF NOT EXISTS brand_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE brand_deals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_brand_deals_status ON brand_deals(status);
CREATE INDEX IF NOT EXISTS idx_brand_deals_niche ON brand_deals(niche_category_id);

CREATE TABLE IF NOT EXISTS brand_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES brand_deals(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  pitch_quote text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brand_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_brand_apps_deal ON brand_applications(deal_id);
CREATE INDEX IF NOT EXISTS idx_brand_apps_creator ON brand_applications(creator_id);

-- Public read/write policies (no-auth single-tenant app)
DROP POLICY IF EXISTS "anon_select_brand_deals" ON brand_deals;
CREATE POLICY "anon_select_brand_deals" ON brand_deals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brand_deals" ON brand_deals;
CREATE POLICY "anon_insert_brand_deals" ON brand_deals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brand_deals" ON brand_deals;
CREATE POLICY "anon_update_brand_deals" ON brand_deals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brand_deals" ON brand_deals;
CREATE POLICY "anon_delete_brand_deals" ON brand_deals FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_brand_apps" ON brand_applications;
CREATE POLICY "anon_select_brand_apps" ON brand_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_brand_apps" ON brand_applications;
CREATE POLICY "anon_insert_brand_apps" ON brand_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_brand_apps" ON brand_applications;
CREATE POLICY "anon_update_brand_apps" ON brand_applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_brand_apps" ON brand_applications;
CREATE POLICY "anon_delete_brand_apps" ON brand_applications FOR DELETE
  TO anon, authenticated USING (true);

-- Seed sample brand deals
INSERT INTO brand_deals (brand_name, brand_logo_url, campaign_title, niche_category_id, min_followers, min_engagement_rate, payout_type, budget_min, budget_max, description, requirements, status)
VALUES
  ('DentalCare India', 'https://images.unsplash.com/photo-1606811841689-0e6e7b6b7e6e?w=200', 'Smile Bright Campaign', 'medical_dentists', 10000, 3.0, 'paid', 15000, 25000, 'Looking for dental professionals and medical creators to promote our new teeth whitening kit.', '1 Reel + 3 Stories. Must show before/after results. Tag @dentalcareindia.', 'active'),
  ('TechGadget Hub', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200', 'Gadget Review Series', 'tech_creators', 25000, 2.5, 'barter+affiliate', 5000, 15000, 'We want tech creators to review our latest smart home gadgets.', '1 dedicated reel + 1 story set. Honest review format. Affiliate link provided.', 'active'),
  ('GlowUp Skincare', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200', 'Glow Routine Launch', 'beauty_makeup', 15000, 4.0, 'barter', 0, 0, 'Skincare creators wanted for our new vitamin C serum launch.', '2 Reels + 5 Stories over 2 weeks. Show application routine. Product barter + commission.', 'active'),
  ('StreetStyle Co.', 'https://images.unsplash.com/photo-1445205170239-693839368dd2?w=200', 'Streetwear Drop 2026', 'fashion_lifestyle', 20000, 3.0, 'paid', 10000, 20000, 'Fashion creators needed for our new streetwear collection launch.', '1 lookbook reel + 3 OOTD stories. Tag @streetstyleco. Use #SSDrop2026.', 'active'),
  ('FitFuel Nutrition', 'https://images.unsplash.com/photo-15930959482525-e9b5e4a0e7b3?w=200', 'Protein Power Campaign', 'fitness_athletes', 18000, 3.5, 'paid', 12000, 22000, 'Fitness creators wanted to promote our new whey protein range.', '1 workout reel + 2 nutrition stories. Show product integration in routine.', 'active'),
  ('WanderTrips', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200', 'Hidden Gems of India', 'travel_bloggers', 30000, 2.0, 'barter+affiliate', 8000, 18000, 'Travel bloggers wanted to feature offbeat Indian destinations.', '1 travel reel (60s) + 5 destination stories. Affiliate booking link provided.', 'active'),
  ('FoodieBox', 'https://images.unsplash.com/photo-1504674905586-95858e8330e4?w=200', 'Taste of India Series', 'food_bloggers', 12000, 4.0, 'barter', 0, 0, 'Food creators wanted to review our monthly snack subscription box.', '1 unboxing reel + 3 recipe stories using box ingredients. Product barter.', 'active')
ON CONFLICT DO NOTHING;