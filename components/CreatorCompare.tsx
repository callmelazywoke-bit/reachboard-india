'use client';

import { useState } from 'react';
import { GitCompare, X, Trophy, TrendingUp, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getEffectiveRateCard, formatINR, formatNumber } from '@/lib/rateCard';
import type { Creator } from '@/lib/types';

interface CreatorCompareProps {
  creators: Creator[];
}

export function CreatorCompare({ creators }: CreatorCompareProps) {
  const [open, setOpen] = useState(false);
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');

  const left = creators.find((c) => c.id === leftId);
  const right = creators.find((c) => c.id === rightId);

  const metrics = [
    { label: 'Followers', key: 'followers_count', icon: TrendingUp, format: (v: number) => formatNumber(v) },
    { label: 'Engagement Rate %', key: 'engagement_rate', icon: Heart, format: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Avg 30D Views', key: 'reel_views_30d', icon: Eye, format: (v: number) => formatNumber(v) },
    { label: 'Est. Reel Price', key: 'rate', icon: Trophy, format: (v: [number, number]) => `${formatINR(v[0])}–${formatINR(v[1])}` },
  ] as const;

  const getVal = (creator: Creator | undefined, key: string) => {
    if (!creator) return null;
    if (key === 'rate') return getEffectiveRateCard(creator).dedicated_reel;
    return (creator as unknown as Record<string, unknown>)[key] as number;
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
      >
        <GitCompare className="h-4 w-4 mr-2" />
        Compare Creators
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl bg-[#0B0F17] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl font-bold">
              Creator Benchmark Comparator
            </DialogTitle>
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Creator A</label>
              <select
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select creator...</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Creator B</label>
              <select
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select creator...</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>{c.username}</option>
                ))}
              </select>
            </div>
          </div>

          {left && right ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[left, right].map((c, i) => (
                  <div key={i} className="glass rounded-xl p-3 text-center">
                    <img src={c.avatar_url || ''} alt={c.username} className="w-14 h-14 rounded-full mx-auto mb-2 object-cover" />
                    <div className="font-semibold text-sm">@{c.username}</div>
                    <div className="text-xs text-white/50">{c.full_name}</div>
                  </div>
                ))}
              </div>
              {metrics.map((m) => {
                const lv = getVal(left, m.key);
                const rv = getVal(right, m.key);
                const leftWins = typeof lv === 'number' && typeof rv === 'number' && lv > rv;
                const rightWins = typeof lv === 'number' && typeof rv === 'number' && rv > lv;
                return (
                  <div key={m.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 glass rounded-xl p-3">
                    <div className={`text-right ${leftWins ? 'text-violet-400 font-bold' : 'text-white/70'}`}>
                      {lv !== null ? m.format(lv as never) : '—'}
                    </div>
                    <div className="flex flex-col items-center text-white/40">
                      <m.icon className="h-4 w-4" />
                      <span className="text-[10px] mt-1 whitespace-nowrap">{m.label}</span>
                    </div>
                    <div className={`text-left ${rightWins ? 'text-pink-400 font-bold' : 'text-white/70'}`}>
                      {rv !== null ? m.format(rv as never) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-white/40 text-sm">
              Select two creators to compare their metrics side by side
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
