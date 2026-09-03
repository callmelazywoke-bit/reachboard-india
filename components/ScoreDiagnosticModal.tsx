'use client';

import {
  X, Heart, Eye, TrendingUp, Calendar, ShieldCheck, Trophy,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/reachScore';
import type { ScoreBreakdown } from '@/lib/reachScore';
import type { FollowerTier } from '@/lib/types';

interface ScoreDiagnosticModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  score: number;
  breakdown: ScoreBreakdown;
  tier: FollowerTier;
}

const SUBMETRICS = [
  { key: 'engagementQuality', label: 'Engagement Quality', weight: 30, icon: Heart, color: 'text-pink-400', desc: 'How your engagement rate compares to similar creators in your niche and tier.' },
  { key: 'viewVelocity', label: 'View Velocity', weight: 25, icon: Eye, color: 'text-blue-400', desc: 'Your 30-day reel views relative to your follower count and cohort norms.' },
  { key: 'growthVelocity', label: 'Growth Velocity', weight: 20, icon: TrendingUp, color: 'text-green-400', desc: 'Your follower growth rate compared to the cohort median for your niche.' },
  { key: 'consistency', label: 'Posting Consistency', weight: 15, icon: Calendar, color: 'text-yellow-400', desc: 'How regularly you post, benchmarked against an optimal 4 posts/week pace.' },
  { key: 'audienceQuality', label: 'Audience Authenticity', weight: 10, icon: ShieldCheck, color: 'text-violet-400', desc: 'Estimated authenticity of your audience, penalizing suspicious or bot-like followers.' },
] as const;

export function ScoreDiagnosticModal({
  open, onOpenChange, username, score, breakdown, tier,
}: ScoreDiagnosticModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-[#0B0F17] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="gradient-text text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-violet-400" />
            ReachScore Breakdown — @{username}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Overall score */}
          <div className="glass rounded-xl p-4 text-center space-y-2">
            <div className={`text-5xl font-bold bg-gradient-to-r ${getScoreBgColor(score)} bg-clip-text text-transparent`}>
              {score.toFixed(1)}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </span>
              <span className="text-xs text-white/40 uppercase tracking-wide">{tier} Tier</span>
            </div>
            <p className="text-xs text-white/50">
              Composite score (0–100) computed from 5 weighted sub-metrics, normalized against your niche and tier cohort.
            </p>
          </div>

          {/* Sub-metric breakdown */}
          <div className="space-y-2.5">
            {SUBMETRICS.map((m) => {
              const value = breakdown[m.key as keyof ScoreBreakdown] || 0;
              const Icon = m.icon;
              return (
                <div key={m.key} className="glass rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${m.color}`} />
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                        {m.weight}%
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                      {value.toFixed(1)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreBgColor(value)}`}
                      style={{ width: `${Math.min(100, value)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{m.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Formula explanation */}
          <div className="glass rounded-xl p-3 space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">How it&apos;s calculated</div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Each sub-metric is normalized against the median for your niche and follower tier, then combined:
              <span className="block mt-1 font-mono text-[10px] text-white/60">
                30% Engagement + 25% Views + 20% Growth + 15% Consistency + 10% Authenticity
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
