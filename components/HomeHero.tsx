'use client';

import { Instagram, TrendingUp, ArrowDown, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function HomeHero() {
  const { user } = useAuth();

  const scrollToLeaderboard = () => {
    document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="text-center space-y-4 py-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-white/60">
        <Trophy className="h-3.5 w-3.5 text-violet-400" />
        India&apos;s #1 Verified Creator Leaderboard
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        <span className="gradient-text">India&apos;s Verified Instagram</span>
        <br />
        <span className="text-white">Creator Board</span>
      </h1>
      <p className="text-white/50 text-lg max-w-2xl mx-auto">
        Discover top creators by niche and state. Claim your rank, generate story cards,
        and connect with brands — all in one platform.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {user ? (
          <>
            <a href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-medium transition-all glow-purple">
                <TrendingUp className="h-5 w-5" />
                Go to Dashboard
              </button>
            </a>
            <button
              onClick={scrollToLeaderboard}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/10 text-white font-medium transition-all"
            >
              <ArrowDown className="h-5 w-5" />
              Browse Leaderboard
            </button>
          </>
        ) : (
          <>
            <a href="/api/auth/instagram">
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-medium transition-all glow-purple">
                <Instagram className="h-5 w-5" />
                Login with Instagram to Claim Your Rank
              </button>
            </a>
            <button
              onClick={scrollToLeaderboard}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/10 text-white font-medium transition-all"
            >
              <ArrowDown className="h-5 w-5" />
              Browse Leaderboard
            </button>
          </>
        )}
      </div>
    </section>
  );
}
