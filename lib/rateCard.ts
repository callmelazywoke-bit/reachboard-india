import type { Creator, RateCard } from './types';

export function computeRateCard(creator: Pick<Creator, 'followers_count' | 'median_reel_views_30d' | 'engagement_rate'>): RateCard {
  const { followers_count, median_reel_views_30d, engagement_rate } = creator;
  const f = Math.max(followers_count, 1000);
  const v = Math.max(median_reel_views_30d, 1000);
  const e = Math.max(engagement_rate, 1);

  const dedicatedHigh = Math.round(f * 0.012 + v * 0.08 + e * 800);
  const dedicatedLow = Math.round(f * 0.008 + v * 0.05 + e * 500);
  const storyHigh = Math.round(f * 0.003 + v * 0.02 + e * 200);
  const storyLow = Math.round(f * 0.002 + v * 0.012 + e * 120);
  const ugcHigh = Math.round(f * 0.005 + v * 0.03 + e * 300);
  const ugcLow = Math.round(f * 0.003 + v * 0.018 + e * 180);

  return {
    dedicated_reel: [Math.max(dedicatedLow, 5000), Math.max(dedicatedHigh, 8000)],
    story_set: [Math.max(storyLow, 2000), Math.max(storyHigh, 3500)],
    ugc_barter: [Math.max(ugcLow, 3000), Math.max(ugcHigh, 5000)],
  };
}

export function getEffectiveRateCard(creator: Creator): RateCard {
  const computed = computeRateCard(creator);
  if (creator.custom_rates && Object.keys(creator.custom_rates).length > 0) {
    return {
      dedicated_reel: creator.custom_rates.dedicated_reel || computed.dedicated_reel,
      story_set: creator.custom_rates.story_set || computed.story_set,
      ugc_barter: creator.custom_rates.ugc_barter || computed.ugc_barter,
    };
  }
  return computed;
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
