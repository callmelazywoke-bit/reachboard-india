'use client';

import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  ArrowLeft, Verified, MapPin, Users, Eye, Heart, MessageCircle,
  Download, Send, Sparkles, Play, TrendingUp, Instagram, Target,
  MessageSquare as WhatsApp, ExternalLink, Zap, Clock, Film, DollarSign,
  CheckCircle2, Handshake, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/TiltCard';
import { BrandInquiryForm } from '@/components/BrandInquiryForm';
import { RateCardCalculator } from '@/components/RateCardCalculator';
import { StoryCardModal } from '@/components/StoryCardModal';
import { CreatorStoryCard } from '@/components/CreatorStoryCard';
import { ScoreDiagnosticModal } from '@/components/ScoreDiagnosticModal';
import { supabase } from '@/lib/supabase';
import { getCategoryById } from '@/lib/categories';
import { formatNumber, formatINR, getEffectiveRateCard } from '@/lib/rateCard';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/reachScore';
import type { ScoreBreakdown } from '@/lib/reachScore';
import type { Creator, ReachScoreRecord, FollowerTier } from '@/lib/types';
import * as Icons from 'lucide-react';

interface CreatorKitClientProps {
  creator: Creator;
  nationalRank: number;
  stateRank: number;
  reachScore: ReachScoreRecord | null;
}

export function CreatorKitClient({ creator, nationalRank, stateRank, reachScore }: CreatorKitClientProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [downloadPitch, setDownloadPitch] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const storyCardRef = useRef<HTMLDivElement>(null);

  // Inline inquiry form state
  const [inquiry, setInquiry] = useState({
    brand_name: '',
    contact_email: '',
    deliverable_type: 'dedicated_reel',
    budget: '',
    message: '',
  });
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const score = reachScore?.reach_score || 0;
  const scoreBreakdown: ScoreBreakdown | null = reachScore ? {
    reachScore: reachScore.reach_score,
    engagementQuality: reachScore.score_engagement,
    viewVelocity: reachScore.score_view_velocity,
    growthVelocity: reachScore.score_growth_velocity,
    consistency: reachScore.score_consistency,
    audienceQuality: reachScore.score_audience_quality,
  } : null;
  const tier: FollowerTier = reachScore?.tier || 'NANO';

  const category = getCategoryById(creator.category_id);
  const Icon = category ? (Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon) : Sparkles;

  const waLink = creator.whatsapp_number
    ? `https://wa.me/${creator.whatsapp_number}?text=Hi%20${encodeURIComponent(creator.username)},%20we%20saw%20your%20verified%20profile%20on%20ReachBoard%20and%20would%20love%20to%20collaborate%20on%20a%20campaign!`
    : null;

  const dmLink = `https://ig.me/m/${creator.username}`;

  const handleDownloadPitch = async () => {
    setDownloadPitch(true);
    try {
      const res = await fetch(`/api/og/story?username=${encodeURIComponent(creator.username)}&t=Brand%20Pitch`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reachboard-${creator.username}-pitch.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloadPitch(false);
    }
  };

  const handleDownloadStoryCard = async () => {
    if (!storyCardRef.current) return;
    setDownloadPitch(true);
    try {
      const dataUrl = await toPng(storyCardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `reachboard-${creator.username}-story-card.png`;
      a.click();
    } catch {
      // fallback to API route
      handleDownloadPitch();
    } finally {
      setDownloadPitch(false);
    }
  };

  const handleInlineInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitting(true);
    try {
      await supabase.from('brand_inquiries').insert({
        creator_id: creator.id,
        brand_name: inquiry.brand_name,
        contact_email: inquiry.contact_email,
        budget_inr: inquiry.budget ? parseFloat(inquiry.budget) : null,
        deliverables: inquiry.deliverable_type,
        timeline: inquiry.message || null,
        status: 'new',
      });
      setInquirySubmitted(true);
    } catch {
      setInquirySubmitted(true);
    } finally {
      setInquirySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Back link */}
        <a href="/#leaderboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Leaderboard
        </a>

        {/* Unverified banner */}
        {!creator.is_verified && (
          <div className="glass rounded-xl p-4 border-yellow-500/30 flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Is this your profile? Connect with Instagram to unlock your full Media Kit, custom Rate Card, and #1 Rank Badge.
              </p>
              <a href="/api/auth/instagram">
                <Button size="sm" className="mt-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                  <Instagram className="h-4 w-4 mr-2" />
                  Claim This Profile
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Header Section */}
        <TiltCard glow="purple" shine className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="p-1 rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-blue-500 animate-pulse-slow">
                <img src={creator.avatar_url || ''} alt={creator.username} className="w-24 h-24 rounded-full object-cover" />
              </div>
              {creator.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-[#0B0F17]">
                  <Verified className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h1 className="text-2xl font-bold">@{creator.username}</h1>
                <p className="text-white/60">{creator.full_name}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {category && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                    <Icon className="h-3 w-3 mr-1" />
                    {category.name}
                  </Badge>
                )}
                {creator.state && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <MapPin className="h-3 w-3 mr-1" />
                    {creator.state}
                  </Badge>
                )}
                {creator.is_verified && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Verified className="h-3 w-3 mr-1" />
                    Verified via Instagram API
                  </Badge>
                )}
                {creator.niche_badge === 'verified_specialist' ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Verified Niche Specialist
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Emerging Creator
                  </Badge>
                )}
              </div>
              {/* Collab status badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                {creator.collab_status?.includes('paid') && (
                  <Badge className="bg-green-500/15 text-green-300 border-green-500/20">Open for Paid Deals</Badge>
                )}
                {creator.collab_status?.includes('barter') && (
                  <Badge className="bg-orange-500/15 text-orange-300 border-orange-500/20">Open for Barter / Gifting</Badge>
                )}
                {creator.collab_status?.includes('ugc') && (
                  <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/20">UGC Creator</Badge>
                )}
              </div>
            </div>
            {/* Rank badges */}
            <div className="flex flex-col gap-2">
              <div className="glass rounded-xl p-3 text-center min-w-[120px]">
                <div className="text-xs text-white/40">National Rank</div>
                <div className="text-2xl font-bold gradient-text">#{nationalRank}</div>
              </div>
              {creator.state && (
                <div className="glass rounded-xl p-3 text-center min-w-[120px]">
                  <div className="text-xs text-white/40">{creator.state} Rank</div>
                  <div className="text-2xl font-bold gradient-text">#{stateRank}</div>
                </div>
              )}
              {scoreBreakdown && (
                <button onClick={() => setDiagnosticOpen(true)} className="glass rounded-xl p-3 text-center min-w-[120px] hover:bg-white/10 transition-all">
                  <div className="text-xs text-white/40">ReachScore</div>
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                  <div className={`text-[10px] ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
                </button>
              )}
            </div>
          </div>
        </TiltCard>

        {/* Analytics Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard icon={Users} value={formatNumber(creator.followers_count)} label="Total Followers" color="text-violet-400" />
            <MetricCard icon={Eye} value={formatNumber(creator.reel_views_30d)} label="Avg 30D Reel Views" color="text-pink-400" />
            <MetricCard icon={Heart} value={`${creator.engagement_rate.toFixed(1)}%`} label="Engagement Rate" color="text-blue-400" />
            <MetricCard icon={MessageCircle} value={`${formatNumber(creator.avg_likes)}/${formatNumber(creator.avg_comments)}`} label="Median Likes/Comments" color="text-green-400" />
          </div>
          {/* Meta API verification timestamp */}
          {creator.last_synced_at && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-white/30">
              <Clock className="h-3 w-3" />
              Last verified via Meta API: {new Date(creator.last_synced_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Top Performing Content */}
        {creator.top_media && creator.top_media.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Top Performing Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {creator.top_media.map((media, idx) => (
                <a
                  key={idx}
                  href={media.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-xl overflow-hidden hover:bg-white/10 transition-all group"
                >
                  <div className="relative aspect-square">
                    <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 text-white" fill="white" />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white/80">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(media.like_count)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(media.comments_count)}</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/60 line-clamp-2">{media.caption}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Public Rate Card & Deliverables */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Public Rate Card & Deliverables
              </h2>
              <p className="text-xs text-white/50 mt-0.5">Starting prices — open to negotiation based on scope</p>
            </div>
            {creator.collab_status && creator.collab_status.length > 0 && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border flex items-center gap-1">
                <Handshake className="h-3.5 w-3.5" />
                Open to Brand Negotiations
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: Film, label: '1 Dedicated Reel', key: 'dedicated_reel' as const, color: 'from-violet-500/20 to-violet-600/10', iconColor: 'text-violet-400' },
              { icon: Play, label: '1 Integrated Reel', key: 'dedicated_reel' as const, color: 'from-pink-500/20 to-pink-600/10', iconColor: 'text-pink-400', multiplier: 0.6 },
              { icon: ImageIcon, label: '2 Instagram Stories', key: 'story_set' as const, color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
            ].map((item) => {
              const rates = getEffectiveRateCard(creator);
              const [low, high] = rates[item.key];
              const effectiveLow = item.multiplier ? Math.round(low * item.multiplier) : low;
              const effectiveHigh = item.multiplier ? Math.round(high * item.multiplier) : high;
              return (
                <div key={item.label} className={`bg-gradient-to-br ${item.color} rounded-xl p-4 border border-white/10 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    <span className="text-sm font-medium text-white/90">{item.label}</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {formatINR(effectiveLow)} – {formatINR(effectiveHigh)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rate Card Calculator */}
        <RateCardCalculator creator={creator} />

        {/* Direct Brand Pitch Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Send className="h-5 w-5 text-pink-400" />
            Direct Brand Pitch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => setInquiryOpen(true)}
              className="h-auto py-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0"
            >
              <Send className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Pitch / Inquire for Collab</div>
                <div className="text-xs text-white/70">Submit a proposal directly</div>
              </div>
            </Button>
            <Button
              onClick={handleDownloadStoryCard}
              disabled={downloadPitch}
              variant="outline"
              className="h-auto py-4 border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Download className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Download Story Card (PNG)</div>
                <div className="text-xs text-white/50">1080x1920 — via html-to-image</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Inline Brand Inquiry Form */}
        <div className="glass rounded-2xl p-5 space-y-4 border border-neutral-800">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-bold">Work with Me</h2>
          </div>
          <p className="text-sm text-white/50">Are you a brand manager? Send a collaboration brief directly — I respond within 48 hours.</p>
          {inquirySubmitted ? (
            <div className="space-y-3 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <p className="text-white/70 text-sm">Your proposal has been sent! I&apos;ll get back to you soon.</p>
              <Button variant="outline" size="sm" onClick={() => { setInquirySubmitted(false); setInquiry({ brand_name: '', contact_email: '', deliverable_type: 'dedicated_reel', budget: '', message: '' }); }} className="border-neutral-800 bg-white/5 text-white hover:bg-white/10">Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleInlineInquiry} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Brand Name *</label>
                  <Input required value={inquiry.brand_name} onChange={(e) => setInquiry({ ...inquiry, brand_name: e.target.value })} placeholder="Acme Brands" className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30" />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Work Email *</label>
                  <Input required type="email" value={inquiry.contact_email} onChange={(e) => setInquiry({ ...inquiry, contact_email: e.target.value })} placeholder="brand@acme.com" className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Deliverable Type</label>
                  <select value={inquiry.deliverable_type} onChange={(e) => setInquiry({ ...inquiry, deliverable_type: e.target.value })} className="w-full bg-white/5 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2">
                    <option value="dedicated_reel">Dedicated Reel</option>
                    <option value="integrated_reel">Integrated Reel</option>
                    <option value="story_set">Story Set</option>
                    <option value="ugc">UGC / Barter</option>
                    <option value="custom">Custom Package</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Budget Offer (INR)</label>
                  <Input type="number" value={inquiry.budget} onChange={(e) => setInquiry({ ...inquiry, budget: e.target.value })} placeholder="50000" className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Message / Brief</label>
                <Textarea value={inquiry.message} onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })} rows={3} placeholder="Tell me about your campaign, timeline, and deliverables..." className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 resize-none" />
              </div>
              <Button type="submit" disabled={inquirySubmitting} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                {inquirySubmitting ? 'Sending...' : (<><Send className="h-4 w-4 mr-2" />Send Collaboration Proposal</>)}
              </Button>
            </form>
          )}
        </div>

        {/* Story Card Generator - Live Editor */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Story Card Generator
          </h2>
          <p className="text-sm text-white/50">Customize your 1080x1920 story card and export a crisp PNG to share on Instagram Stories.</p>
          <div className="glass rounded-2xl p-5" ref={storyCardRef}>
            <CreatorStoryCard creator={creator} nationalRank={nationalRank} stateRank={stateRank} />
          </div>
          <Button onClick={handleDownloadStoryCard} disabled={downloadPitch} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
            <Download className="h-4 w-4 mr-2" />
            {downloadPitch ? 'Generating...' : 'Download Story Card as PNG'}
          </Button>
        </div>
      </div>

      {/* Floating bottom bar for mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden glass-strong border-t border-white/10 p-3 flex gap-2">
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-green-600 hover:bg-green-500 text-white border-0">
              <WhatsApp className="h-4 w-4 mr-2" />
              Quick Pitch
            </Button>
          </a>
        )}
        <Button
          onClick={() => setInquiryOpen(true)}
          className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Proposal
        </Button>
      </div>

      {/* Desktop pitch actions */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-20 gap-2">
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button className="bg-green-600 hover:bg-green-500 text-white border-0 shadow-lg">
              <WhatsApp className="h-4 w-4 mr-2" />
              Quick Pitch via WhatsApp
            </Button>
          </a>
        )}
        <Button
          onClick={() => setInquiryOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 shadow-lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Official Proposal
        </Button>
      </div>

      {/* Modals */}
      <BrandInquiryForm creator={creator} open={inquiryOpen} onOpenChange={setInquiryOpen} />
      <StoryCardModal
        creator={creator}
        nationalRank={nationalRank}
        stateRank={stateRank}
        timeframe={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        open={storyOpen}
        onOpenChange={setStoryOpen}
      />
      {scoreBreakdown && (
        <ScoreDiagnosticModal
          open={diagnosticOpen}
          onOpenChange={setDiagnosticOpen}
          username={creator.username}
          score={score}
          breakdown={scoreBreakdown}
          tier={tier}
        />
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, value, label, color }: { icon: Icons.LucideIcon; value: string; label: string; color: string }) {
  return (
    <div className="glass rounded-xl p-4 space-y-1">
      <Icon className={`h-5 w-5 ${color}`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
