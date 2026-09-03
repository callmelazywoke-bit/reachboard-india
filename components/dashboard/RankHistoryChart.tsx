'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Trophy, Crown, Sparkles, Target,
  ArrowUp, ArrowDown, ChevronRight, Award, Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface MonthlyRank {
  month: string;
  rank: number;
  reachScore: number;
  delta: number | null;
}

interface RankHistoryChartProps {
  currentRank: number;
  currentScore: number;
}

const MOCK_HISTORY: MonthlyRank[] = [
  { month: 'May 2026', rank: 161, reachScore: 52.3, delta: null },
  { month: 'Jun 2026', rank: 114, reachScore: 68.1, delta: 47 },
  { month: 'Jul 2026', rank: 42, reachScore: 79.4, delta: 72 },
  { month: 'Aug 2026', rank: 16, reachScore: 88.5, delta: 26 },
];

const MILESTONES = [
  { threshold: 150, label: 'Top 150 Unlocked', icon: Target, achieved: true },
  { threshold: 100, label: 'Top 100 Unlocked', icon: Award, achieved: true },
  { threshold: 50, label: 'Top 50 Unlocked', icon: Trophy, achieved: true },
  { threshold: 20, label: 'Top 20 Unlocked', icon: Crown, achieved: true },
  { threshold: 10, label: 'Top 10 Unlocked', icon: Sparkles, achieved: false },
];

const GROWTH_DIRECTIVES = [
  {
    score: 'Consistency',
    current: 72,
    target: 85,
    directive: 'Improve Consistency to hit Top 10',
    detail: 'Post 4+ reels per week to boost your consistency sub-score by 13 points.',
    icon: Target,
    color: 'text-orange-400',
    barColor: 'from-orange-500 to-amber-500',
  },
  {
    score: 'View Velocity',
    current: 81,
    target: 90,
    directive: 'Increase View Velocity for Top 5',
    detail: 'Focus on trending audio and hook-first content to push views higher.',
    icon: TrendingUp,
    color: 'text-blue-400',
    barColor: 'from-blue-500 to-cyan-500',
  },
];

export function RankHistoryChart({ currentRank, currentScore }: RankHistoryChartProps) {
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  const history = MOCK_HISTORY.map((h, idx) => {
    if (idx === 0) return h;
    const prevRank = MOCK_HISTORY[idx - 1].rank;
    return { ...h, delta: prevRank - h.rank };
  });

  const bestRank = Math.min(...history.map((h) => h.rank));
  const totalImprovement = history[0].rank - history[history.length - 1].rank;
  const latestDelta = history[history.length - 1].delta || 0;

  const maxRank = Math.max(...history.map((h) => h.rank));
  const minRank = Math.min(...history.map((h) => h.rank));
  const range = maxRank - minRank || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-400" />
          Rank Retention & History
        </h3>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            {totalImprovement} ranks in 4 months
          </Badge>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 border flex items-center gap-1">
            <Crown className="h-3 w-3" />
            Best: #{bestRank}
          </Badge>
        </div>
      </div>

      {/* Rank Ladder Chart */}
      <div className="glass rounded-2xl p-5 border border-neutral-800 space-y-4">
        <div className="flex items-end justify-between gap-2">
          {history.map((entry, idx) => {
            const barHeight = 100 - ((entry.rank - minRank) / range) * 60 + 20;
            const isLatest = idx === history.length - 1;
            return (
              <div key={entry.month} className="flex-1 flex flex-col items-center gap-2">
                {/* Rank number */}
                <div className={`text-lg font-bold ${isLatest ? 'text-violet-400' : 'text-white/70'}`}>
                  #{entry.rank}
                </div>
                {/* Bar */}
                <div
                  className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${
                    isLatest
                      ? 'from-violet-600 to-pink-500'
                      : 'from-neutral-700 to-neutral-600'
                  } transition-all duration-500 hover:scale-105 cursor-default`}
                  style={{ height: `${barHeight * 2}px` }}
                >
                  <div className="flex flex-col items-center justify-center h-full pt-2">
                    <span className="text-[10px] text-white/80 font-medium">{entry.reachScore.toFixed(1)}</span>
                  </div>
                </div>
                {/* Delta badge */}
                {entry.delta !== null && entry.delta > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium">
                    <ArrowUp className="h-2.5 w-2.5" />
                    {entry.delta}
                  </div>
                )}
                {entry.delta !== null && entry.delta < 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                    <ArrowDown className="h-2.5 w-2.5" />
                    {Math.abs(entry.delta)}
                  </div>
                )}
                {entry.delta === null && <div className="h-3" />}
                {/* Month label */}
                <div className="text-[10px] text-white/40 text-center">{entry.month}</div>
              </div>
            );
          })}
        </div>

        {/* Latest delta highlight */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-white/50">This month:</span>
            <span className="flex items-center gap-1 text-green-400 font-bold">
              <ArrowUp className="h-3.5 w-3.5" />
              {latestDelta} ranks this month
            </span>
          </div>
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="glass rounded-2xl p-4 border border-neutral-800">
        <div className="text-xs text-white/40 uppercase tracking-wide mb-3">Milestones</div>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <div
                key={milestone.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  milestone.achieved
                    ? 'bg-gradient-to-r from-violet-600/20 to-pink-600/20 text-white border-violet-500/30'
                    : 'bg-white/5 text-white/30 border-neutral-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${milestone.achieved ? 'text-violet-400' : 'text-white/30'}`} />
                {milestone.label}
                {milestone.achieved && (
                  <span className="text-green-400 ml-0.5">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Directives */}
      <div className="glass rounded-2xl p-4 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/40 uppercase tracking-wide">Growth Directives</div>
          <button
            onClick={() => setDiagnosticOpen(true)}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            View Full Diagnostic
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {GROWTH_DIRECTIVES.map((directive) => {
          const Icon = directive.icon;
          const progress = (directive.current / directive.target) * 100;
          return (
            <div key={directive.score} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${directive.color}`} />
                <span className="text-sm font-medium">{directive.directive}</span>
              </div>
              <p className="text-xs text-white/40 pl-6">{directive.detail}</p>
              <div className="flex items-center gap-2 pl-6">
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${directive.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/50 font-medium">
                  {directive.current}/{directive.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Diagnostic Modal */}
      <Dialog open={diagnosticOpen} onOpenChange={setDiagnosticOpen}>
        <DialogContent className="max-w-[480px] bg-neutral-950 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-400" />
              ReachScore Diagnostic & Growth Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Current score */}
            <div className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <span className="text-2xl font-bold">{currentScore.toFixed(1)}</span>
              </div>
              <div>
                <div className="text-sm text-white/50">Current ReachScore</div>
                <div className="text-lg font-bold">Rank #{currentRank} in India</div>
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  {totalImprovement} ranks improved over 4 months
                </div>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="space-y-2">
              {[
                { label: 'Engagement Quality', value: 85, color: 'from-violet-500 to-purple-500' },
                { label: 'View Velocity', value: 81, color: 'from-blue-500 to-cyan-500' },
                { label: 'Growth Velocity', value: 78, color: 'from-green-500 to-emerald-500' },
                { label: 'Consistency', value: 72, color: 'from-orange-500 to-amber-500' },
                { label: 'Audience Authenticity', value: 92, color: 'from-pink-500 to-rose-500' },
              ].map((sub) => (
                <div key={sub.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{sub.label}</span>
                    <span className="font-bold">{sub.value}</span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${sub.color} rounded-full`}
                      style={{ width: `${sub.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Action plan */}
            <div className="glass rounded-xl p-3 space-y-2">
              <div className="text-xs text-white/40 uppercase tracking-wide">Action Plan for Top 10</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">1.</span>
                  <span className="text-white/70">Increase posting frequency to 4+ reels per week to boost Consistency from 72 to 85.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">2.</span>
                  <span className="text-white/70">Use trending audio and hook-first intros to push View Velocity past 90.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">3.</span>
                  <span className="text-white/70">Maintain engagement by responding to comments within 2 hours of posting.</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
