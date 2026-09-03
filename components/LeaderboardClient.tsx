'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search, MapPin, Users, Eye, Heart, Trophy, Sparkles,
  ChevronDown, Crown, Medal, Award, Verified,
  LayoutGrid, Image as ImageIcon, X, Check, Zap, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TiltCard } from '@/components/TiltCard';
import { StoryCardModal } from '@/components/StoryCardModal';
import { CreatorCompare } from '@/components/CreatorCompare';
import { ScoreDiagnosticModal } from '@/components/ScoreDiagnosticModal';
import { useAuth } from '@/lib/auth-context';
import { CATEGORIES, INDIAN_STATES, getCategoryById } from '@/lib/categories';
import { formatNumber } from '@/lib/rateCard';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/reachScore';
import type { Creator, RankedCreator, ReachScoreRecord, FollowerTier } from '@/lib/types';
import type { ScoreBreakdown } from '@/lib/reachScore';
import * as Icons from 'lucide-react';

interface LeaderboardClientProps {
  creators: Creator[];
  scoreMap: Map<string, ReachScoreRecord>;
}

type TierFilter = 'all' | 'RISING' | 'GROWTH' | 'ESTABLISHED' | 'ELITE';

export function LeaderboardClient({ creators, scoreMap }: LeaderboardClientProps) {
  const { user } = useAuth();
  const [hasMounted, setHasMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [storyCreator, setStoryCreator] = useState<RankedCreator | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [diagnosticCreator, setDiagnosticCreator] = useState<{ username: string; score: number; breakdown: ScoreBreakdown; tier: FollowerTier } | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Compute rankings by ReachScore
  const ranked = useMemo(() => {
    const withScores = creators.map((c) => {
      const scoreRecord = scoreMap.get(c.id);
      const reachScore = scoreRecord?.reach_score || 0;
      const tier = scoreRecord?.tier || 'NANO';
      const breakdown: ScoreBreakdown = scoreRecord ? {
        reachScore: scoreRecord.reach_score,
        engagementQuality: scoreRecord.score_engagement,
        viewVelocity: scoreRecord.score_view_velocity,
        growthVelocity: scoreRecord.score_growth_velocity,
        consistency: scoreRecord.score_consistency,
        audienceQuality: scoreRecord.score_audience_quality,
      } : {
        reachScore: 0,
        engagementQuality: 0,
        viewVelocity: 0,
        growthVelocity: 0,
        consistency: 0,
        audienceQuality: 0,
      };
      return { ...c, reach_score: reachScore, tier, score_breakdown: breakdown };
    });

    const sorted = withScores.sort((a, b) => (b.reach_score || 0) - (a.reach_score || 0));

    const nationalRanks = new Map<string, number>();
    sorted.forEach((c, i) => nationalRanks.set(c.id, i + 1));

    const stateRanks = new Map<string, number>();
    const byState = new Map<string, typeof sorted>();
    sorted.forEach((c) => {
      const s = c.state || 'Unknown';
      if (!byState.has(s)) byState.set(s, []);
      byState.get(s)!.push(c);
    });
    byState.forEach((list) => {
      list.forEach((c, i) => stateRanks.set(c.id, i + 1));
    });

    return sorted.map((c) => ({
      ...c,
      national_rank: nationalRanks.get(c.id) || 0,
      state_rank: stateRanks.get(c.id) || 0,
    })) as RankedCreator[];
  }, [creators, scoreMap]);

  const filtered = useMemo(() => {
    return ranked.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.username.toLowerCase().includes(q) && !(c.full_name || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && c.category_id !== categoryFilter) return false;
      if (stateFilter !== 'all' && c.state !== stateFilter) return false;
      if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
      return true;
    });
  }, [ranked, search, categoryFilter, stateFilter, tierFilter]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const handleStoryCard = (creator: RankedCreator) => {
    setStoryCreator(creator);
    setStoryOpen(true);
  };

  const handleDiagnostic = (creator: RankedCreator) => {
    if (creator.score_breakdown) {
      setDiagnosticCreator({
        username: creator.username,
        score: creator.reach_score || 0,
        breakdown: creator.score_breakdown,
        tier: creator.tier as FollowerTier,
      });
    }
  };

  const filteredCategories = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const creatorCategories = filteredCategories.filter((c) => c.type === 'creator');
  const businessCategories = filteredCategories.filter((c) => c.type === 'business');

  // Skeleton loader during SSR and before client mount — keeps server/client HTML identical
  if (!hasMounted) {
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

  const currentUsername = user?.username;

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators or handles..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Button
            onClick={() => setCategoryModalOpen(true)}
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 justify-between min-w-[180px]"
          >
            {categoryFilter !== 'all' ? (
              <span className="flex items-center gap-2">
                {(() => {
                  const cat = getCategoryById(categoryFilter);
                  const Icon = cat ? (Icons[cat.icon as keyof typeof Icons] as Icons.LucideIcon) : LayoutGrid;
                  return <Icon className="h-4 w-4" />;
                })()}
                {getCategoryById(categoryFilter)?.name || 'All Categories'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                All Categories
              </span>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-full lg:w-[180px] bg-white/5 border-white/10 text-white">
              <MapPin className="h-4 w-4 mr-2 text-white/40" />
              <SelectValue placeholder="All India" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10 text-white max-h-[300px]">
              <SelectItem value="all">All India</SelectItem>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 glass rounded-lg p-1">
            {([
              { key: 'all' as const, label: 'All Tiers' },
              { key: 'RISING' as const, label: 'Rising' },
              { key: 'GROWTH' as const, label: 'Growth' },
              { key: 'ESTABLISHED' as const, label: 'Established' },
              { key: 'ELITE' as const, label: 'Elite' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTierFilter(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tierFilter === t.key
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <CreatorCompare creators={creators} />
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((creator, idx) => (
            <PodiumCard
              key={creator.id}
              creator={creator}
              rank={idx + 1}
              isCurrentUser={currentUsername === creator.username}
              onStoryCard={() => handleStoryCard(creator)}
              onScoreClick={() => handleDiagnostic(creator)}
            />
          ))}
        </div>
      )}

      {/* Leaderboard Table (Desktop) */}
      <div className="hidden lg:block glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-sm">
              <th className="text-left p-4 font-medium">Rank</th>
              <th className="text-left p-4 font-medium">Creator</th>
              <th className="text-left p-4 font-medium">Category</th>
              <th className="text-center p-4 font-medium">ReachScore</th>
              <th className="text-right p-4 font-medium">Followers</th>
              <th className="text-right p-4 font-medium">30D Views</th>
              <th className="text-right p-4 font-medium">ER %</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rest.map((creator) => (
              <LeaderboardRow
                key={creator.id}
                creator={creator}
                isCurrentUser={currentUsername === creator.username}
                onStoryCard={() => handleStoryCard(creator)}
                onScoreClick={() => handleDiagnostic(creator)}
              />
            ))}
          </tbody>
        </table>
        {rest.length === 0 && top3.length < 3 && (
          <div className="py-16 text-center text-white/40">No creators found matching your filters.</div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-3">
        {(top3.length < 3 ? filtered : rest).map((creator) => (
          <MobileCreatorCard
            key={creator.id}
            creator={creator}
            isCurrentUser={currentUsername === creator.username}
            expanded={mobileExpanded === creator.id}
            onToggle={() => setMobileExpanded(mobileExpanded === creator.id ? null : creator.id)}
            onStoryCard={() => handleStoryCard(creator)}
            onScoreClick={() => handleDiagnostic(creator)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-white/40">No creators found matching your filters.</div>
        )}
      </div>

      {/* Category Selector Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-lg bg-[#0B0F17] border-white/10 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text text-lg font-bold">Select Category</DialogTitle>
            <button onClick={() => setCategoryModalOpen(false)} className="absolute right-4 top-4 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories..."
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs text-white/40 uppercase tracking-wide mb-2">Creators</h4>
              <div className="grid grid-cols-1 gap-1">
                <CategoryButton
                  active={categoryFilter === 'all'}
                  onClick={() => { setCategoryFilter('all'); setCategoryModalOpen(false); }}
                  icon={<LayoutGrid className="h-4 w-4" />}
                  label="All Categories"
                />
                {creatorCategories.map((cat) => {
                  const Icon = Icons[cat.icon as keyof typeof Icons] as Icons.LucideIcon;
                  return (
                    <CategoryButton
                      key={cat.id}
                      active={categoryFilter === cat.id}
                      onClick={() => { setCategoryFilter(cat.id); setCategoryModalOpen(false); }}
                      icon={<Icon className="h-4 w-4" />}
                      label={cat.name}
                    />
                  );
                })}
              </div>
            </div>
            {businessCategories.length > 0 && (
              <div>
                <h4 className="text-xs text-white/40 uppercase tracking-wide mb-2">Businesses</h4>
                <div className="grid grid-cols-1 gap-1">
                  {businessCategories.map((cat) => {
                    const Icon = Icons[cat.icon as keyof typeof Icons] as Icons.LucideIcon;
                    return (
                      <CategoryButton
                        key={cat.id}
                        active={categoryFilter === cat.id}
                        onClick={() => { setCategoryFilter(cat.id); setCategoryModalOpen(false); }}
                        icon={<Icon className="h-4 w-4" />}
                        label={cat.name}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Card Modal — only rendered after mount, so new Date() is safe */}
      {storyCreator && (
        <StoryCardModal
          creator={storyCreator}
          nationalRank={storyCreator.national_rank || filtered.findIndex((c) => c.id === storyCreator.id) + 1}
          stateRank={storyCreator.state_rank || 1}
          timeframe={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          open={storyOpen}
          onOpenChange={setStoryOpen}
        />
      )}

      {/* Score Diagnostic Modal */}
      {diagnosticCreator && (
        <ScoreDiagnosticModal
          open={!!diagnosticCreator}
          onOpenChange={(open) => !open && setDiagnosticCreator(null)}
          username={diagnosticCreator.username}
          score={diagnosticCreator.score}
          breakdown={diagnosticCreator.breakdown}
          tier={diagnosticCreator.tier}
        />
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-white/50 font-bold text-sm">#{rank}</span>;
}

function ScoreBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`inline-flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r ${getScoreBgColor(score)} text-white text-xs font-bold transition-transform hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
      title={onClick ? 'Click to view score breakdown' : undefined}
    >
      {score.toFixed(1)}
    </span>
  );
}

function PodiumCard({
  creator, rank, isCurrentUser, onStoryCard, onScoreClick,
}: {
  creator: RankedCreator;
  rank: number;
  isCurrentUser?: boolean;
  onStoryCard: () => void;
  onScoreClick: () => void;
}) {
  const category = getCategoryById(creator.category_id);
  const Icon = category ? (Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon) : Sparkles;
  const score = creator.reach_score || 0;

  const ringClass = rank === 1 ? 'from-yellow-400 to-amber-600' : rank === 2 ? 'from-gray-200 to-gray-400' : 'from-amber-500 to-amber-700';

  return (
    <TiltCard glow={rank === 1 ? 'purple' : rank === 2 ? 'pink' : 'blue'} shine className={`p-5 ${rank === 1 ? 'md:scale-105' : ''} ${isCurrentUser ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0B0F17]' : ''}`}>
      {isCurrentUser && (
        <div className="text-center mb-1">
          <Badge className="bg-violet-600/30 text-violet-200 border-violet-500/50">You</Badge>
        </div>
      )}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex items-center gap-2">
          <RankBadge rank={rank} />
          <span className="text-xs text-white/50">#{creator.national_rank} India{creator.state && ` · #${creator.state_rank} ${creator.state}`}</span>
        </div>
        <div className={`p-1 rounded-full bg-gradient-to-br ${ringClass}`}>
          <img
            src={creator.avatar_url || ''}
            alt={creator.username}
            crossOrigin="anonymous"
            className="w-20 h-20 rounded-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-bold text-lg">@{creator.username}</span>
            {creator.is_verified && <Verified className="h-4 w-4 text-blue-400" />}
          </div>
          <div className="text-sm text-white/50">{creator.full_name}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {category && (
            <Badge variant="secondary" className="bg-white/10 text-white/80 border-0">
              <Icon className="h-3 w-3 mr-1" />
              {category.name}
            </Badge>
          )}
          {creator.state && (
            <Badge variant="secondary" className="bg-white/10 text-white/80 border-0">
              <MapPin className="h-3 w-3 mr-1" />
              {creator.state}
            </Badge>
          )}
          {creator.tier && (
            <Badge variant="secondary" className="bg-white/10 text-white/60 border-0 text-[10px] uppercase tracking-wide">
              {creator.tier}
            </Badge>
          )}
        </div>
        {/* ReachScore badge */}
        <div onClick={onScoreClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onScoreClick(); } }} className="cursor-pointer">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2 hover:bg-white/10 transition-all">
            <Trophy className={`h-4 w-4 ${getScoreColor(score)}`} />
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</span>
            <span className="text-xs text-white/40">/ 100</span>
          </div>
          <div className={`text-[10px] mt-1 ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full pt-2">
          <Stat icon={Users} value={formatNumber(creator.followers_count)} label="Followers" />
          <Stat icon={Eye} value={formatNumber(creator.reel_views_30d)} label="30D Views" />
          <Stat icon={Heart} value={`${creator.engagement_rate.toFixed(1)}%`} label="ER %" />
        </div>
        <div className="flex gap-2 w-full pt-2">
          <a href={`/creator/${creator.username}`} className="flex-1">
            <Button size="sm" className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
              View Media Kit
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={onStoryCard} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TiltCard>
  );
}

function Stat({ icon: Icon, value, label }: { icon: Icons.LucideIcon; value: string; label: string }) {
  return (
    <div className="glass rounded-lg p-2 text-center">
      <Icon className="h-3.5 w-3.5 mx-auto text-white/40 mb-1" />
      <div className="font-bold text-sm">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}

function LeaderboardRow({
  creator, isCurrentUser, onStoryCard, onScoreClick,
}: {
  creator: RankedCreator;
  isCurrentUser?: boolean;
  onStoryCard: () => void;
  onScoreClick: () => void;
}) {
  const category = getCategoryById(creator.category_id);
  const Icon = category ? (Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon) : Sparkles;
  const score = creator.reach_score || 0;

  return (
    <tr className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isCurrentUser ? 'bg-violet-600/10 ring-1 ring-violet-500/30' : ''}`}>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <RankBadge rank={creator.national_rank} />
          {isCurrentUser && <Badge className="bg-violet-600/30 text-violet-200 border-violet-500/50 text-[10px]">You</Badge>}
        </div>
      </td>
      <td className="p-4">
        <a href={`/creator/${creator.username}`} className="flex items-center gap-3 hover:opacity-80">
          <img
            src={creator.avatar_url || ''}
            alt={creator.username}
            crossOrigin="anonymous"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">@{creator.username}</span>
              {creator.is_verified && <Verified className="h-3.5 w-3.5 text-blue-400" />}
            </div>
            <div className="text-xs text-white/40">{creator.full_name}</div>
          </div>
        </a>
      </td>
      <td className="p-4">
        {category && (
          <Badge variant="secondary" className="bg-white/10 text-white/70 border-0">
            <Icon className="h-3 w-3 mr-1" />
            {category.name}
          </Badge>
        )}
      </td>
      <td className="p-4 text-center">
        <ScoreBadge score={score} onClick={onScoreClick} />
      </td>
      <td className="p-4 text-right font-semibold">{formatNumber(creator.followers_count)}</td>
      <td className="p-4 text-right font-semibold">{formatNumber(creator.reel_views_30d)}</td>
      <td className="p-4 text-right font-semibold text-pink-400">{creator.engagement_rate.toFixed(1)}%</td>
      <td className="p-4 text-right">
        <div className="flex gap-2 justify-end">
          <a href={`/creator/${creator.username}`}>
            <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              Media Kit
            </Button>
          </a>
          <Button size="sm" variant="outline" onClick={onStoryCard} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function MobileCreatorCard({
  creator, isCurrentUser, expanded, onToggle, onStoryCard, onScoreClick,
}: {
  creator: RankedCreator;
  isCurrentUser?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStoryCard: () => void;
  onScoreClick: () => void;
}) {
  const category = getCategoryById(creator.category_id);
  const Icon = category ? (Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon) : Sparkles;
  const score = creator.reach_score || 0;

  return (
    <div className={`glass rounded-xl overflow-hidden ${isCurrentUser ? 'ring-2 ring-violet-500/50' : ''}`}>
      {/* Use div role="button" instead of <button> to avoid nesting interactive elements */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="w-full p-3 flex items-center gap-3 cursor-pointer"
      >
        <RankBadge rank={creator.national_rank} />
        <img
          src={creator.avatar_url || ''}
          alt={creator.username}
          crossOrigin="anonymous"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">@{creator.username}</span>
            {creator.is_verified && <Verified className="h-3 w-3 text-blue-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-white/40 truncate">{creator.full_name}</div>
        </div>
        <ScoreBadge score={score} onClick={onScoreClick} />
        <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {category && (
              <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs">
                <Icon className="h-3 w-3 mr-1" />
                {category.name}
              </Badge>
            )}
            {creator.state && (
              <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {creator.state}
              </Badge>
            )}
            {creator.tier && (
              <Badge variant="secondary" className="bg-white/10 text-white/60 border-0 text-xs uppercase tracking-wide">
                {creator.tier}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat icon={Users} value={formatNumber(creator.followers_count)} label="Followers" />
            <Stat icon={Eye} value={formatNumber(creator.reel_views_30d)} label="30D Views" />
            <Stat icon={Heart} value={`${creator.engagement_rate.toFixed(1)}%`} label="ER %" />
          </div>
          <div className="flex gap-2">
            <a href={`/creator/${creator.username}`} className="flex-1">
              <Button size="sm" className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                View Media Kit
              </Button>
            </a>
            <Button size="sm" variant="outline" onClick={onStoryCard} className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full text-left ${
        active
          ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/30 text-white border border-violet-500/50'
          : 'text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {active && <Check className="h-4 w-4 text-violet-400" />}
    </button>
  );
}

export default LeaderboardClient;
