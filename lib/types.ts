export type VerificationStatus = 'UNCLAIMED' | 'CLAIMED_PENDING' | 'VERIFIED';

export type FollowerTier = 'NANO' | 'RISING' | 'GROWTH' | 'ESTABLISHED' | 'ELITE';

export type AccountType = 'CREATOR' | 'BUSINESS';

export type NicheBadge = 'verified_specialist' | 'emerging_creator';

export type CollabStatus = 'paid' | 'barter' | 'ugc';

export type MetricTab = 'followers' | 'reel_views' | 'engagement_rate';

export type Timeframe = 'weekly' | 'monthly' | 'all_time';

export type CategoryType = 'creator' | 'business';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  keywords: string[];
  hashtags: string[];
}

export interface TopMediaItem {
  permalink: string;
  thumbnail_url: string;
  like_count: number;
  comments_count: number;
  view_count: number;
  caption: string;
}

export interface RateCard {
  dedicated_reel: [number, number];
  story_set: [number, number];
  ugc_barter: [number, number];
}

export interface Creator {
  id: string;
  instagram_id: string | null;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  category_id: string | null;
  category_confidence: number;
  niche_badge: NicheBadge;
  state: string | null;
  followers_count: number;
  media_count: number;
  reel_views_30d: number;
  median_reel_views_30d: number;
  engagement_rate: number;
  avg_likes: number;
  avg_comments: number;
  is_verified: boolean;
  collab_status: CollabStatus[];
  whatsapp_number: string | null;
  contact_email: string | null;
  custom_rates: Partial<RateCard> | null;
  rate_card: RateCard | null;
  top_media: TopMediaItem[];
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandInquiry {
  id: string;
  creator_id: string;
  brand_name: string;
  contact_email: string;
  budget_inr: number | null;
  barter_details: string | null;
  deliverables: string | null;
  timeline: string | null;
  status: 'new' | 'viewed' | 'accepted' | 'declined';
  created_at: string;
}

export interface RankedCreator extends Creator {
  national_rank: number;
  state_rank: number;
  reach_score?: number;
  tier?: FollowerTier;
  score_breakdown?: ScoreBreakdown;
}

export interface ScoreBreakdown {
  reachScore: number;
  engagementQuality: number;
  viewVelocity: number;
  growthVelocity: number;
  consistency: number;
  audienceQuality: number;
}

export interface ReachScoreRecord {
  id: string;
  creator_id: string;
  reach_score: number;
  score_engagement: number;
  score_view_velocity: number;
  score_growth_velocity: number;
  score_consistency: number;
  score_audience_quality: number;
  tier: FollowerTier;
  india_rank: number | null;
  state_rank: number | null;
  niche_rank: number | null;
  calculated_at: string;
}

export type PayoutType = 'paid' | 'barter' | 'barter+affiliate';
export type DealStatus = 'active' | 'paused' | 'closed' | 'filled';

export interface BrandDeal {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  campaign_title: string;
  niche_category_id: string | null;
  min_followers: number;
  min_engagement_rate: number;
  payout_type: PayoutType;
  budget_min: number | null;
  budget_max: number | null;
  description: string | null;
  requirements: string | null;
  status: DealStatus;
  target_niches: string[] | null;
  location: string | null;
  follower_tier: string | null;
  min_reach_score: number | null;
  application_limit: number | null;
  deal_type: string | null;
  brand_guidelines: string | null;
  deliverables: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';

export type ApplicationStage = 'new' | 'shortlisted' | 'hired' | 'archived';

export interface BrandApplication {
  id: string;
  deal_id: string;
  creator_id: string;
  pitch_quote: string | null;
  status: ApplicationStatus;
  stage: ApplicationStage;
  counter_offer: number | null;
  created_at: string;
}
