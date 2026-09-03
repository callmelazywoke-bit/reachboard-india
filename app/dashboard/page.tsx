import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabase, getAuthenticatedUserId } from '@/lib/supabase-server';
import { DashboardClient } from '@/components/DashboardClient';
import type { Creator, BrandInquiry, ReachScoreRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getProfile(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role, creator_id, display_name')
    .eq('id', userId)
    .maybeSingle();
  return data as { role: string; creator_id: string | null; display_name: string | null } | null;
}

async function getCreator(supabase: ReturnType<typeof createServerSupabase>, creatorId: string): Promise<Creator | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('id', creatorId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Creator;
}

async function getInquiries(supabase: ReturnType<typeof createServerSupabase>, creatorId: string): Promise<BrandInquiry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('brand_inquiries')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });
  return (data as BrandInquiry[]) || [];
}

async function getRanks(supabase: ReturnType<typeof createServerSupabase>, creator: Creator): Promise<{ nationalRank: number; stateRank: number }> {
  if (!supabase) return { nationalRank: 1, stateRank: 1 };
  try {
    const { data: scoreData } = await supabase
      .from('reach_scores')
      .select('india_rank, state_rank')
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (scoreData && scoreData.india_rank) {
      return {
        nationalRank: scoreData.india_rank,
        stateRank: scoreData.state_rank || 1,
      };
    }

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
    return { nationalRank, stateRank };
  } catch {
    return { nationalRank: 1, stateRank: 1 };
  }
}

async function getReachScore(supabase: ReturnType<typeof createServerSupabase>, creatorId: string): Promise<ReachScoreRecord | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('reach_scores')
    .select('*')
    .eq('creator_id', creatorId)
    .maybeSingle();
  return (data as ReachScoreRecord) || null;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const userId = await getAuthenticatedUserId(cookieStore);
  if (!userId) {
    redirect('/login?redirect=/dashboard');
  }

  const supabase = createServerSupabase(cookieStore);
  if (!supabase) {
    redirect('/login?redirect=/dashboard');
  }

  const profile = await getProfile(supabase, userId);
  if (!profile) {
    redirect('/login?redirect=/dashboard&error=no_profile');
  }

  if (profile.role === 'brand') {
    redirect('/brand/campaigns');
  }

  if (!profile.creator_id) {
    redirect('/?error=no_creator_profile');
  }

  const creator = await getCreator(supabase, profile.creator_id);
  if (!creator) {
    redirect('/?error=no_creator');
  }

  const [inquiries, ranks, reachScore] = await Promise.all([
    getInquiries(supabase, creator.id),
    getRanks(supabase, creator),
    getReachScore(supabase, creator.id),
  ]);

  return (
    <DashboardClient
      creator={creator}
      inquiries={inquiries}
      nationalRank={ranks.nationalRank}
      stateRank={ranks.stateRank}
      reachScore={reachScore}
    />
  );
}
