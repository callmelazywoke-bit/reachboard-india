import type { FollowerTier } from './types';

export interface CreatorRawData {
  followersCount: number;
  views30d: number;
  rawErPct: number;
  growthRatePct: number;
  postsPerWeek: number;
  suspiciousFollowerRatio: number;
}

export interface CohortMedians {
  medianEr: number;
  medianViewsRatio: number;
  medianGrowthRate: number;
  medianPostsPerWeek: number;
}

export interface ScoreBreakdown {
  reachScore: number;
  engagementQuality: number;
  viewVelocity: number;
  growthVelocity: number;
  consistency: number;
  audienceQuality: number;
}

export function classifyFollowerTier(followers: number): FollowerTier {
  if (followers < 10_000) return 'NANO';
  if (followers < 50_000) return 'RISING';
  if (followers < 200_000) return 'GROWTH';
  if (followers < 1_000_000) return 'ESTABLISHED';
  return 'ELITE';
}

function normalizeRelativeScore(value: number, median: number, multiplier = 50): number {
  if (median <= 0) return Math.min(100, Math.max(0, value * 5));
  const normalized = (value / median) * multiplier;
  return Math.min(100, Math.max(0, Number(normalized.toFixed(2))));
}

function calculateConsistencyScore(postsPerWeek: number, cohortMedianPosts: number): number {
  if (postsPerWeek === 0) return 0;
  const optimalPace = 4;
  const varianceFromOptimal = Math.abs(postsPerWeek - optimalPace);
  const baseConsistency = Math.max(0, 100 - varianceFromOptimal * 15);
  const relativeBonus = normalizeRelativeScore(postsPerWeek, cohortMedianPosts, 20);
  return Math.min(100, Number((baseConsistency * 0.8 + relativeBonus).toFixed(2)));
}

function calculateAudienceQualityScore(suspiciousRatio: number): number {
  const score = 100 - suspiciousRatio * 400;
  return Math.min(100, Math.max(0, Number(score.toFixed(2))));
}

export function calculateReachScore(
  creator: CreatorRawData,
  cohort: CohortMedians
): ScoreBreakdown {
  const engagementQuality = normalizeRelativeScore(creator.rawErPct, cohort.medianEr, 50);
  const viewsToFollowersRatio = creator.followersCount > 0
    ? creator.views30d / creator.followersCount
    : 0;
  const viewVelocity = normalizeRelativeScore(viewsToFollowersRatio, cohort.medianViewsRatio, 50);
  const growthVelocity = normalizeRelativeScore(creator.growthRatePct, cohort.medianGrowthRate, 50);
  const consistency = calculateConsistencyScore(creator.postsPerWeek, cohort.medianPostsPerWeek);
  const audienceQuality = calculateAudienceQualityScore(creator.suspiciousFollowerRatio);

  const weightedScore =
    engagementQuality * 0.30 +
    viewVelocity * 0.25 +
    growthVelocity * 0.20 +
    consistency * 0.15 +
    audienceQuality * 0.10;

  return {
    reachScore: Number(weightedScore.toFixed(2)),
    engagementQuality,
    viewVelocity,
    growthVelocity,
    consistency,
    audienceQuality,
  };
}

export const DEFAULT_COHORT: CohortMedians = {
  medianEr: 5.0,
  medianViewsRatio: 3.0,
  medianGrowthRate: 5.0,
  medianPostsPerWeek: 3.0,
};

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-emerald-400';
  if (score >= 40) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-emerald-500 to-teal-600';
  if (score >= 40) return 'from-yellow-500 to-amber-600';
  if (score >= 20) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-rose-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Average';
  return 'Needs Work';
}

export const SCORE_SUBMETRICS = [
  { key: 'engagementQuality', label: 'Engagement Quality', weight: 30, icon: 'Heart', desc: 'How your engagement rate compares to similar creators in your niche and tier.' },
  { key: 'viewVelocity', label: 'View Velocity', weight: 25, icon: 'Eye', desc: 'Your 30-day reel views relative to your follower count and cohort norms.' },
  { key: 'growthVelocity', label: 'Growth Velocity', weight: 20, icon: 'TrendingUp', desc: 'Your follower growth rate compared to the cohort median for your niche.' },
  { key: 'consistency', label: 'Posting Consistency', weight: 15, icon: 'Calendar', desc: 'How regularly you post, benchmarked against an optimal 4 posts/week pace.' },
  { key: 'audienceQuality', label: 'Audience Authenticity', weight: 10, icon: 'ShieldCheck', desc: 'Estimated authenticity of your audience, penalizing suspicious or bot-like followers.' },
] as const;
