import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CreatorKitClient } from '@/components/CreatorKitClient';
import type { Creator, ReachScoreRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getCreator(username: string): Promise<Creator | null> {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !data) return null;
    return data as Creator;
  } catch {
    return null;
  }
}

async function getRanks(creator: Creator): Promise<{ nationalRank: number; stateRank: number }> {
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

    // Fallback to follower-based ranking
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

async function getReachScore(creatorId: string): Promise<ReachScoreRecord | null> {
  try {
    const { data } = await supabase
      .from('reach_scores')
      .select('*')
      .eq('creator_id', creatorId)
      .maybeSingle();
    return (data as ReachScoreRecord) || null;
  } catch {
    return null;
  }
}

export default async function CreatorPage({ params }: { params: { username: string } }) {
  const creator = await getCreator(params.username);
  if (!creator) notFound();

  const [ranks, reachScore] = await Promise.all([
    getRanks(creator),
    getReachScore(creator.id),
  ]);

  return (
    <CreatorKitClient
      creator={creator}
      nationalRank={ranks.nationalRank}
      stateRank={ranks.stateRank}
      reachScore={reachScore}
    />
  );
}
