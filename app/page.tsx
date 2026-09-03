import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { Trophy, TrendingUp, Sparkles, Zap, Instagram } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { HomeHero } from '@/components/HomeHero';
import type { Creator, ReachScoreRecord } from '@/lib/types';

const LeaderboardClient = dynamicImport(() => import('@/components/LeaderboardClient'), {
  ssr: false,
});

export const dynamic = 'force-dynamic';

async function getCreators(): Promise<Creator[]> {
  try {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('followers_count', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      return [];
    }

    return data as Creator[];
  } catch {
    return [];
  }
}

async function getReachScores(): Promise<Map<string, ReachScoreRecord>> {
  try {
    const { data } = await supabase
      .from('reach_scores')
      .select('*');

    const map = new Map<string, ReachScoreRecord>();
    if (data) {
      for (const row of data as ReachScoreRecord[]) {
        map.set(row.creator_id, row);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-white/5 rounded-lg" />
          <div className="h-10 w-[180px] bg-white/5 rounded-lg" />
          <div className="h-10 w-[180px] bg-white/5 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-72 bg-white/5 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 h-72 animate-pulse" />
        ))}
      </div>
      <div className="hidden lg:block glass rounded-2xl h-96 animate-pulse" />
    </div>
  );
}

export default async function Home() {
  const [creators, scoreMap] = await Promise.all([getCreators(), getReachScores()]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse-slow" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        <HomeHero />

        {/* Leaderboard */}
        <div id="leaderboard" className="scroll-mt-20">
          {creators.length > 0 ? (
            <Suspense fallback={<LeaderboardSkeleton />}>
              <LeaderboardClient creators={creators} scoreMap={scoreMap} />
            </Suspense>
          ) : (
            <div className="glass rounded-2xl p-12 text-center space-y-4">
              <Zap className="h-12 w-12 text-violet-400 mx-auto" />
              <h2 className="text-xl font-semibold">No creators yet</h2>
              <p className="text-white/50 max-w-md mx-auto">
                Be the first to claim your spot on India&apos;s verified creator leaderboard.
                Login with Instagram to get started.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <a href="/signup">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-medium">
                    <Instagram className="h-5 w-5" />
                    Claim Your Rank
                  </button>
                </a>
                <a href="/login">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
                    Sign In
                  </button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Features section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
          {[
            { icon: Trophy, title: 'ReachScore Ranking', desc: 'A composite 0–100 score computed from engagement, views, growth, consistency, and audience authenticity.' },
            { icon: Sparkles, title: 'Story Card Generator', desc: 'Generate 1080x1920 story cards with your rank and stats to share.' },
            { icon: TrendingUp, title: 'Brand Pitch Platform', desc: 'Get inbound brand deals and send professional proposals directly.' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 to-pink-600/30 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-violet-300" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-sm text-white/30">
        ReachBoard India — Verified Creator Leaderboard & Brand Pitch Platform
      </footer>
    </div>
  );
}
