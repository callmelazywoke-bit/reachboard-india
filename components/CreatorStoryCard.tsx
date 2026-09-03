'use client';

import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  Download, Share2, Instagram, Check, Users, Eye, Heart,
  MapPin, BadgeCheck, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getCategoryById } from '@/lib/categories';
import { INDIAN_STATES } from '@/lib/categories';
import { formatNumber } from '@/lib/rateCard';
import type { Creator } from '@/lib/types';

interface CreatorStoryCardProps {
  creator: Creator;
  nationalRank: number;
  stateRank: number;
}

function estimateViews(followers: number, engagementRate: number, reelViews: number): number {
  if (reelViews && reelViews > 0) return reelViews;
  return Math.round(followers * (engagementRate / 100) * 8.5);
}

export function CreatorStoryCard({ creator, nationalRank: initialNational, stateRank: initialState }: CreatorStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState<'download' | 'share' | null>(null);

  const [indiaRank, setIndiaRank] = useState(initialNational);
  const [stateRank, setStateRank] = useState(initialState);
  const [selectedState, setSelectedState] = useState(creator.state || INDIAN_STATES[0]);
  const [pitch, setPitch] = useState(
    `Trusted by ${formatNumber(creator.followers_count)} followers. Authentic storytelling that converts. Let's create something memorable together.`
  );

  const category = getCategoryById(creator.category_id);
  const views = estimateViews(creator.followers_count, creator.engagement_rate, creator.reel_views_30d);

  const flashDone = (type: 'download' | 'share') => {
    setDone(type);
    setTimeout(() => setDone(null), 2500);
  };

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        width: 1080,
        height: 1920,
        style: { transform: 'none' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `reachboard-${creator.username}-story.png`;
      a.click();
      flashDone('download');
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  }, [creator.username]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        width: 1080,
        height: 1920,
        style: { transform: 'none' },
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `reachboard-${creator.username}.png`, { type: 'image/png' });

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: `Check out @${creator.username}'s ranking on ReachBoard India!`,
          });
          flashDone('share');
          return;
        }
        await navigator.share({
          text: `Check out @${creator.username}'s ranking on ReachBoard India! ${window.location.origin}/creator/${creator.username}`,
        });
        flashDone('share');
        return;
      }
      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `reachboard-${creator.username}-story.png`;
      a.click();
      flashDone('share');
    } catch {
      // ignore
    } finally {
      setSharing(false);
    }
  }, [creator.username]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-6">
      {/* Card preview */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: 270,
            height: 480,
            background: '#0b0c16',
            backgroundImage: 'radial-gradient(circle at 20% 15%, rgba(139,92,246,0.15), transparent 50%), radial-gradient(circle at 80% 85%, rgba(236,72,153,0.15), transparent 50%)',
          }}
        >
          {/* Gradient border wrapper */}
          <div className="absolute inset-0 rounded-2xl p-[3px] bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
            <div className="w-full h-full rounded-2xl bg-[#0b0c16] relative overflow-hidden">
              {/* Background glow blobs */}
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-purple-600/20 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-pink-600/20 blur-2xl" />
              <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center px-3 py-3 text-center">
                {/* Header */}
                <div className="text-[10px] font-extrabold tracking-[2px] bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  REACHBOARD INDIA
                </div>
                <div className="text-[7px] text-white/40 mt-0.5">Verified Creator Ranking</div>

                {/* Rank badges */}
                <div className="flex gap-1.5 mt-2 w-full justify-center">
                  <div className="rounded-full px-2 py-1 bg-white/5 border border-purple-500/40 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-yellow-400">#{indiaRank} in India</span>
                  </div>
                  <div className="rounded-full px-2 py-1 bg-white/5 border border-pink-500/40 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-slate-200">#{stateRank} in {selectedState}</span>
                  </div>
                </div>

                {/* Avatar with gradient ring */}
                <div className="relative mt-3">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 blur-md opacity-60" />
                  <div className="relative p-[2px] rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500">
                    <img
                      src={creator.avatar_url || ''}
                      alt={creator.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0b0c16]"
                    />
                  </div>
                </div>

                {/* Username & name */}
                <div className="mt-2 text-white font-bold text-sm">@{creator.username}</div>
                <div className="text-white/60 text-[9px]">{creator.full_name || creator.username}</div>

                {/* Niche badge pill */}
                <div className="mt-1.5 rounded-full px-2.5 py-0.5 bg-purple-500/25 border border-purple-400/50">
                  <span className="text-[8px] font-semibold text-purple-200">
                    {category?.name || 'Creator'}
                  </span>
                </div>

                {/* Brand pitch quote box */}
                <div className="mt-2.5 w-full rounded-lg bg-white/5 border border-white/10 backdrop-blur-md px-2.5 py-2">
                  <div className="text-[8px] text-white/40 uppercase tracking-wider mb-0.5">Brand Pitch</div>
                  <p className="text-[8.5px] leading-snug text-white/80 italic">
                    &ldquo;{pitch}&rdquo;
                  </p>
                </div>

                {/* Metrics grid 3 columns */}
                <div className="mt-2.5 w-full grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-white/5 border border-purple-500/30 backdrop-blur-sm px-1 py-1.5 text-center">
                    <div className="text-[7px] font-bold text-purple-300 tracking-wider">FOLLOWERS</div>
                    <div className="text-white font-extrabold text-sm mt-0.5">{formatNumber(creator.followers_count)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-pink-500/30 backdrop-blur-sm px-1 py-1.5 text-center">
                    <div className="text-[7px] font-bold text-pink-300 tracking-wider">30D VIEWS</div>
                    <div className="text-white font-extrabold text-sm mt-0.5">{formatNumber(views)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-blue-500/30 backdrop-blur-sm px-1 py-1.5 text-center">
                    <div className="text-[7px] font-bold text-blue-300 tracking-wider">ER%</div>
                    <div className="text-white font-extrabold text-sm mt-0.5">{creator.engagement_rate.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Verified badge */}
                <div className="mt-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 bg-white/5 border border-green-500/40 backdrop-blur-sm">
                  <BadgeCheck className="h-3 w-3 text-green-400" />
                  <span className="text-[8px] font-semibold text-green-300">Verified via Instagram</span>
                </div>

                {/* Footer watermark */}
                <div className="mt-auto pt-2">
                  <div className="text-[7px] text-white/30">reachboard.in/{creator.username}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side controls */}
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Story Card Controls
          </h3>

          <div className="space-y-2">
            <Label className="text-white/70 text-sm">India Rank</Label>
            <Input
              type="number"
              value={indiaRank}
              onChange={(e) => setIndiaRank(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70 text-sm">State Rank</Label>
            <Input
              type="number"
              value={stateRank}
              onChange={(e) => setStateRank(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70 text-sm">State</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0F17] border-white/10 max-h-60">
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s} className="text-white focus:bg-white/10">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-white/40" />
                      {s}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white/70 text-sm flex items-center justify-between">
              <span>Brand Pitch / Quote</span>
              <span className="text-xs text-white/30">{pitch.length}/140</span>
            </Label>
            <Textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value.slice(0, 140))}
              rows={3}
              placeholder="Your USP for brand collaborations..."
              className="bg-white/5 border-white/10 text-white text-sm resize-none"
            />
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0"
          >
            {done === 'download' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {downloading ? 'Generating...' : 'Download PNG'}
              </>
            )}
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing}
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            {done === 'share' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Shared!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                {sharing ? 'Sharing...' : 'Share'}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-white/40 text-center flex items-center justify-center gap-1">
          <Instagram className="h-3 w-3" />
          1080 x 1920 PNG - Share directly to your Instagram Story
        </p>
      </div>
    </div>
  );
}
