import { supabase } from '@/lib/supabase';
import { getCategoryById } from '@/lib/categories';
import { formatNumber } from '@/lib/rateCard';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function estimateViews(followers: number, engagementRate: number, reelViews: number): number {
  if (reelViews && reelViews > 0) return reelViews;
  return Math.round(followers * (engagementRate / 100) * 8.5);
}

function buildStorySVG(opts: {
  username: string;
  fullName: string;
  avatarUrl: string;
  categoryName: string;
  state: string;
  nationalRank: number;
  stateRank: number;
  followers: number;
  reelViews: number;
  engagementRate: number;
  timeframe: string;
}): string {
  const { username, fullName, avatarUrl, categoryName, state, nationalRank, stateRank, followers, reelViews, engagementRate, timeframe } = opts;
  const views = estimateViews(followers, engagementRate, reelViews);

  return `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B0F17"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="50%" stop-color="#EC4899"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="33%" stop-color="#EC4899"/>
      <stop offset="66%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
    <linearGradient id="metricBg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(139,92,246,0.18)"/>
      <stop offset="100%" stop-color="rgba(139,92,246,0.06)"/>
    </linearGradient>
    <linearGradient id="metricBg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(236,72,153,0.18)"/>
      <stop offset="100%" stop-color="rgba(236,72,153,0.06)"/>
    </linearGradient>
    <linearGradient id="metricBg3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(6,182,212,0.18)"/>
      <stop offset="100%" stop-color="rgba(6,182,212,0.06)"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="avatarClip">
      <circle cx="540" cy="500" r="105"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1920" fill="url(#bg)"/>

  <!-- Decorative glow circles -->
  <circle cx="200" cy="200" r="300" fill="#8B5CF6" opacity="0.1"/>
  <circle cx="900" cy="1700" r="250" fill="#EC4899" opacity="0.1"/>
  <circle cx="540" cy="500" r="160" fill="#06B6D4" opacity="0.06"/>

  <!-- Header: ReachBoard logo -->
  <text x="540" y="120" text-anchor="middle" font-family="Inter, sans-serif" font-size="40" font-weight="800" fill="url(#accent)" letter-spacing="3">REACHBOARD INDIA</text>
  <text x="540" y="165" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="500" fill="rgba(255,255,255,0.6)">Verified Creator Ranking</text>

  <!-- Rank badges -->
  <rect x="140" y="210" width="360" height="85" rx="42" fill="url(#glass)" stroke="url(#accent)" stroke-width="2.5"/>
  <text x="320" y="265" text-anchor="middle" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#FFD700">#${nationalRank} in India</text>

  ${state ? `<rect x="580" y="210" width="360" height="85" rx="42" fill="url(#glass)" stroke="url(#accent)" stroke-width="2.5"/>
  <text x="760" y="265" text-anchor="middle" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#E2E8F0">#${stateRank} in ${escapeXml(state)}</text>` : ''}

  <!-- Avatar with glowing gradient ring -->
  <circle cx="540" cy="500" r="130" fill="none" stroke="url(#ringGrad)" stroke-width="6" filter="url(#glow)" opacity="0.9"/>
  <circle cx="540" cy="500" r="118" fill="none" stroke="url(#ringGrad)" stroke-width="4"/>
  <circle cx="540" cy="500" r="108" fill="#0F172A"/>
  <image href="${escapeXml(avatarUrl)}" x="435" y="395" width="210" height="210" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>

  <!-- Username & name -->
  <text x="540" y="675" text-anchor="middle" font-family="Inter, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF">@${escapeXml(username)}</text>
  <text x="540" y="725" text-anchor="middle" font-family="Inter, sans-serif" font-size="30" font-weight="500" fill="rgba(255,255,255,0.8)">${escapeXml(fullName)}</text>

  <!-- Category pill with readable background -->
  <rect x="340" y="755" width="400" height="56" rx="28" fill="rgba(139,92,246,0.25)" stroke="rgba(167,139,250,0.6)" stroke-width="2"/>
  <text x="540" y="790" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="#DDD6FE">${escapeXml(categoryName)}</text>

  <!-- Timeframe tag -->
  <rect x="440" y="830" width="200" height="42" rx="21" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <text x="540" y="858" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="500" fill="rgba(255,255,255,0.7)">${escapeXml(timeframe)}</text>

  <!-- Stat cards - enlarged and high contrast -->
  <g>
    <rect x="60" y="920" width="300" height="240" rx="28" fill="url(#metricBg1)" stroke="rgba(139,92,246,0.5)" stroke-width="2.5"/>
    <text x="210" y="990" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#C4B5FD" letter-spacing="2">FOLLOWERS</text>
    <text x="210" y="1090" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="#FFFFFF" filter="url(#softGlow)">${formatNumber(followers)}</text>
  </g>
  <g>
    <rect x="390" y="920" width="300" height="240" rx="28" fill="url(#metricBg2)" stroke="rgba(236,72,153,0.5)" stroke-width="2.5"/>
    <text x="540" y="990" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#F9A8D4" letter-spacing="2">EST. 30D VIEWS</text>
    <text x="540" y="1090" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="#FFFFFF" filter="url(#softGlow)">${formatNumber(views)}</text>
  </g>
  <g>
    <rect x="720" y="920" width="300" height="240" rx="28" fill="url(#metricBg3)" stroke="rgba(6,182,212,0.5)" stroke-width="2.5"/>
    <text x="870" y="990" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#67E8F9" letter-spacing="2">ENGAGEMENT</text>
    <text x="870" y="1090" text-anchor="middle" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="#FFFFFF" filter="url(#softGlow)">${engagementRate.toFixed(1)}%</text>
  </g>

  <!-- Verified badge -->
  <g transform="translate(540, 1280)">
    <rect x="-180" y="0" width="360" height="64" rx="32" fill="url(#glass)" stroke="rgba(16,185,129,0.6)" stroke-width="2.5"/>
    <circle cx="-130" cy="32" r="14" fill="#10B981" filter="url(#softGlow)"/>
    <text x="-100" y="40" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#6EE7B7">Verified via Instagram</text>
  </g>

  <!-- Footer -->
  <text x="540" y="1700" text-anchor="middle" font-family="Inter, sans-serif" font-size="28" font-weight="500" fill="rgba(255,255,255,0.5)">Claim your rank at reachboard.in</text>
  <rect x="420" y="1730" width="240" height="56" rx="28" fill="url(#accent)"/>
  <text x="540" y="1767" text-anchor="middle" font-family="Inter, sans-serif" font-size="24" font-weight="800" fill="#FFFFFF" letter-spacing="1">REACHBOARD.IN</text>
</svg>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const timeframe = searchParams.get('t') || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (!username) {
    return new Response('Missing username', { status: 400 });
  }

  try {
    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !creator) {
      return new Response('Creator not found', { status: 404 });
    }

    // Compute ranks
    const { count: nationalCount } = await supabase
      .from('creators')
      .select('*', { count: 'exact', head: true })
      .gt('followers_count', creator.followers_count);

    const nationalRank = (nationalCount || 0) + 1;

    let stateRank = nationalRank;
    if (creator.state) {
      const { count: stateCount } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: true })
        .eq('state', creator.state)
        .gt('followers_count', creator.followers_count);
      stateRank = (stateCount || 0) + 1;
    }

    const category = getCategoryById(creator.category_id);

    const svg = buildStorySVG({
      username: creator.username,
      fullName: creator.full_name || creator.username,
      avatarUrl: creator.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      categoryName: category?.name || 'Creator',
      state: creator.state || '',
      nationalRank,
      stateRank,
      followers: creator.followers_count,
      reelViews: creator.reel_views_30d,
      engagementRate: creator.engagement_rate,
      timeframe,
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('Failed to generate story card', { status: 500 });
  }
}
