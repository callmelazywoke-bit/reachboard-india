-- Extend brand_deals with campaign targeting fields and brand_applications with pipeline stages

ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS target_niches text[] DEFAULT '{}';
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS location text DEFAULT 'All India';
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS follower_tier text DEFAULT 'all';
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS min_reach_score numeric DEFAULT 0;
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS application_limit integer DEFAULT 30;
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS deal_type text DEFAULT 'paid';
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS brand_guidelines text;
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS deliverables text;

ALTER TABLE brand_applications ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new';
ALTER TABLE brand_applications ADD COLUMN IF NOT EXISTS counter_offer numeric;

CREATE INDEX IF NOT EXISTS idx_brand_apps_stage ON brand_applications(stage);
CREATE INDEX IF NOT EXISTS idx_brand_apps_deal_stage ON brand_applications(deal_id, stage);

-- Seed mock applications with pipeline stages
INSERT INTO brand_applications (deal_id, creator_id, pitch_quote, status, stage, counter_offer)
SELECT
  bd.id,
  c.id,
  CASE WHEN c.followers_count > 50000 THEN
    'Hi! I would love to collaborate. My audience matches perfectly. Rs.18000 for 1 Reel + 1 Story.'
  ELSE
    'Excited to work with you! My engagement is strong in this niche. Barter + Rs.5000 base.'
  END,
  'pending',
  CASE
    WHEN c.followers_count > 100000 THEN 'shortlisted'
    WHEN c.followers_count > 50000 THEN 'new'
    WHEN c.engagement_rate > 5 THEN 'new'
    ELSE 'archived'
  END,
  CASE WHEN c.followers_count > 50000 THEN 18000 ELSE NULL END
FROM brand_deals bd
CROSS JOIN creators c
WHERE bd.campaign_title IN ('Smile Bright Campaign', 'Gadget Review Series')
  AND c.id NOT IN (SELECT creator_id FROM brand_applications WHERE deal_id = bd.id)
  AND c.followers_count > 8000
LIMIT 12
ON CONFLICT DO NOTHING;