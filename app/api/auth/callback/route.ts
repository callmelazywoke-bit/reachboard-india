import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import {
  OAUTH_STATE_COOKIE,
  oauthStateMatches,
  sessionCookieOptions,
} from '@/lib/session';
import { linkInstagramToSupabaseAuth, setSessionCookiesForUser } from '@/lib/oauth-link';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rateLimit';
import { classifyCreator } from '@/lib/classifier';
import { computeRateCard } from '@/lib/rateCard';
import type { TopMediaItem } from '@/lib/types';

interface InstagramMedia {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
}

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return rateLimitResponse(limit.remaining, limit.resetAt);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const baseUrl = 'https://reachboard-india-n1dr.bolt.host';
  const redirectUri = `${baseUrl}/api/auth/instagram/callback`;

  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  // Anti-forgery: the state we issued when starting the flow must come back unchanged.
  const cookieStore = cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  if (!oauthStateMatches(expectedState, searchParams.get('state'))) {
    const bad = NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
    bad.cookies.delete(OAUTH_STATE_COOKIE);
    return bad;
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?error=oauth_not_configured`);
  }

  let profile: {
    id: string;
    username: string;
    name: string;
    biography: string;
    account_type: string;
    profile_picture_url: string;
    followers_count: number;
    media_count: number;
  } | null = null;

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text().catch(() => '');
      console.error('Token exchange failed:', tokenRes.status, errBody);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    if (!accessToken || !userId) {
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    // Step 2: Fetch creator profile (including biography)
    const profileRes = await fetch(
      `https://graph.instagram.com/v19.0/${userId}?fields=id,username,name,biography,account_type,profile_picture_url,followers_count,media_count&access_token=${accessToken}`
    );

    if (!profileRes.ok) {
      console.error('Profile fetch failed:', profileRes.status);
      return NextResponse.redirect(`${baseUrl}/?error=profile_fetch_failed`);
    }

    profile = await profileRes.json();

    // After this point profile is guaranteed non-null
    const p = profile!;

    // Step 3: Fetch last 25 media items
    const mediaRes = await fetch(
      `https://graph.instagram.com/v19.0/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp&access_token=${accessToken}`
    );

    let media: InstagramMedia[] = [];

    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      media = mediaData.data || [];
    }

    // Step 4: Calculate Engagement Rate %
    const totalLikes = media.reduce((sum, m) => sum + (m.like_count || 0), 0);
    const totalComments = media.reduce((sum, m) => sum + (m.comments_count || 0), 0);
    const postCount = Math.max(media.length, 1);
    const followers = p.followers_count || 0;
    const engagementRate = followers > 0
      ? ((totalLikes + totalComments) / (followers * postCount)) * 100
      : 0;

    const avgLikes = postCount > 0 ? Math.round(totalLikes / postCount) : 0;
    const avgComments = postCount > 0 ? Math.round(totalComments / postCount) : 0;

    // Step 5: Run Content Classifier
    const captions = media.map((m) => m.caption || '');
    const classification = classifyCreator({
      bio: p.biography,
      metaCategory: p.account_type,
      captions,
    });

    // Step 6: Compute top media (top 3 by engagement)
    const topMedia: TopMediaItem[] = media
      .slice()
      .sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
      .slice(0, 3)
      .map((m) => ({
        permalink: m.permalink,
        thumbnail_url: m.thumbnail_url || m.media_url,
        like_count: m.like_count || 0,
        comments_count: m.comments_count || 0,
        view_count: 0,
        caption: m.caption || '',
      }));

    // Step 7: Compute rate card
    const rateCard = computeRateCard({
      followers_count: followers,
      median_reel_views_30d: Math.round((totalLikes + totalComments) / Math.max(postCount, 1)),
      engagement_rate: engagementRate,
    });

    // Step 8: Store / update in Supabase (with graceful fallback)
    const creatorRecord = {
      instagram_id: userId,
      username: p.username,
      full_name: p.name || p.username,
      avatar_url: p.profile_picture_url,
      account_type: (p.account_type || 'CREATOR').toUpperCase(),
      category_id: classification.category.id,
      category_confidence: classification.confidenceScore,
      niche_badge: classification.nicheBadge,
      followers_count: followers,
      media_count: p.media_count || media.length,
      engagement_rate: Math.round(engagementRate * 100) / 100,
      avg_likes: avgLikes,
      avg_comments: avgComments,
      is_verified: true,
      top_media: topMedia,
      rate_card: rateCard,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let creatorId: string | null = null;

    try {
      const { data: existing } = await supabase
        .from('creators')
        .select('id')
        .eq('instagram_id', userId)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('creators')
          .update(creatorRecord)
          .eq('id', existing.id)
          .select('id')
          .single();
        creatorId = updated?.id || existing.id;
      } else {
        const { data: inserted } = await supabase
          .from('creators')
          .insert(creatorRecord)
          .select('id')
          .single();
        creatorId = inserted?.id || null;
      }

      // Create or update a profile row linking this creator to the auth user.
      // The OAuth callback runs server-side; we use the anon client which
      // has INSERT permission on profiles for authenticated users.
      // Note: the Instagram OAuth flow doesn't create a Supabase Auth user,
      // so we skip profile creation here — profiles are created at signup.

      // Store media items
      if (creatorId && media.length > 0) {
        await supabase.from('media').delete().eq('creator_id', creatorId);
        const mediaRows = media.map((m) => ({
          creator_id: creatorId,
          instagram_media_id: m.id,
          caption: m.caption,
          media_type: m.media_type,
          media_url: m.media_url,
          thumbnail_url: m.thumbnail_url,
          permalink: m.permalink,
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0,
          timestamp: m.timestamp,
        }));
        await supabase.from('media').insert(mediaRows);
      }

      // Compute and store ReachScore
      if (creatorId) {
        try {
          const tier = followers < 10000 ? 'NANO' : followers < 50000 ? 'RISING' : followers < 200000 ? 'GROWTH' : followers < 1000000 ? 'ESTABLISHED' : 'ELITE';
          const { data: cohort } = await supabase
            .from('cohort_benchmarks')
            .select('median_er, median_views_ratio, median_growth_rate, median_posts_per_week')
            .eq('niche', classification.category.id)
            .eq('tier', tier)
            .maybeSingle();

          const medianEr = cohort?.median_er || 5.0;
          const medianViewsRatio = cohort?.median_views_ratio || 3.0;
          const medianGrowthRate = cohort?.median_growth_rate || 5.0;
          const medianPostsPerWeek = cohort?.median_posts_per_week || 3.0;

          const rawEr = engagementRate;
          const viewsRatio = followers > 0 ? (totalLikes + totalComments) / Math.max(postCount, 1) / followers : 0;
          const growthRate = followers < 10000 ? 8.0 : followers < 50000 ? 6.0 : followers < 200000 ? 5.0 : followers < 1000000 ? 3.0 : 2.5;
          const postsPerWeek = Math.min(10, (p.media_count || media.length) / 12.0);
          const suspiciousRatio = followers < 10000 ? 0.02 : followers < 50000 ? 0.03 : followers < 200000 ? 0.04 : followers < 1000000 ? 0.05 : 0.07;

          const clamp = (v: number) => Math.min(100, Math.max(0, v));
          const scoreEngagement = clamp(Math.round((rawEr / medianEr) * 50 * 100) / 100);
          const scoreViewVelocity = clamp(Math.round((viewsRatio / medianViewsRatio) * 50 * 100) / 100);
          const scoreGrowthVelocity = clamp(Math.round((growthRate / medianGrowthRate) * 50 * 100) / 100);
          const baseConsistency = Math.max(0, 100 - Math.abs(postsPerWeek - 4) * 15);
          const relativeBonus = clamp((postsPerWeek / medianPostsPerWeek) * 20);
          const scoreConsistency = clamp(Math.round((baseConsistency * 0.8 + relativeBonus) * 100) / 100);
          const scoreAudienceQuality = clamp(Math.round((100 - suspiciousRatio * 400) * 100) / 100);

          const reachScore = Math.round(
            (scoreEngagement * 0.30 + scoreViewVelocity * 0.25 + scoreGrowthVelocity * 0.20 + scoreConsistency * 0.15 + scoreAudienceQuality * 0.10) * 100
          ) / 100;

          await supabase.from('reach_scores').upsert({
            creator_id: creatorId,
            reach_score: reachScore,
            score_engagement: scoreEngagement,
            score_view_velocity: scoreViewVelocity,
            score_growth_velocity: scoreGrowthVelocity,
            score_consistency: scoreConsistency,
            score_audience_quality: scoreAudienceQuality,
            tier,
            calculated_at: new Date().toISOString(),
          }, { onConflict: 'creator_id' });
        } catch (scoreErr) {
          console.error('ReachScore computation failed, continuing:', scoreErr);
        }
      }
    } catch (supabaseErr) {
      console.error('Supabase storage failed, continuing with redirect:', supabaseErr);
    }

    if (!creatorId) {
      return NextResponse.redirect(`${baseUrl}/?error=profile_not_saved`);
    }

    // Link this Instagram identity to a Supabase Auth user and set proper
    // session cookies so server-side RLS recognizes the user.
    const authUserId = await linkInstagramToSupabaseAuth(
      { id: userId, username: p.username, name: p.name || p.username, profile_picture_url: p.profile_picture_url },
      creatorId
    );

    const success = NextResponse.redirect(`${baseUrl}/dashboard`);

    if (authUserId) {
      const cookiesSet = await setSessionCookiesForUser(success, userId);
      if (cookiesSet) {
        success.cookies.delete(OAUTH_STATE_COOKIE);
        return success;
      }
    }

    // Fallback: if session minting failed, redirect to login with context.
    success.cookies.delete(OAUTH_STATE_COOKIE);
    return NextResponse.redirect(`${baseUrl}/login?redirect=/dashboard&error=oauth_link_failed`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`);
  }
}
