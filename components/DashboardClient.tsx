'use client';

import { useState, useEffect } from 'react';
import {
  Trophy, TrendingUp, Inbox, Settings, Users, Eye, Heart, MessageCircle,
  Sparkles, Download, Check, ArrowLeft, MapPin, Film, Building2,
  MessageSquare as WhatsApp, ExternalLink, Target, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TiltCard } from '@/components/TiltCard';
import { RateCardCalculator } from '@/components/RateCardCalculator';
import { StoryCardModal } from '@/components/StoryCardModal';
import { CreatorStoryCard } from '@/components/CreatorStoryCard';
import { BrandDealsHub } from '@/components/BrandDealsHub';
import { CreateCampaignModal } from '@/components/brand/CreateCampaignModal';
import { InquiriesMessagingTab } from '@/components/dashboard/InquiriesMessagingTab';
import { RankHistoryChart } from '@/components/dashboard/RankHistoryChart';
import { ScoreDiagnosticModal } from '@/components/ScoreDiagnosticModal';
import { supabase } from '@/lib/supabase';
import { getCategoryById } from '@/lib/categories';
import { formatNumber, formatINR } from '@/lib/rateCard';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/reachScore';
import type { ScoreBreakdown } from '@/lib/reachScore';
import type { Creator, BrandInquiry, BrandDeal, RateCard, ReachScoreRecord, FollowerTier } from '@/lib/types';
import * as Icons from 'lucide-react';

interface DashboardClientProps {
  creator: Creator;
  inquiries: BrandInquiry[];
  nationalRank: number;
  stateRank: number;
  reachScore: ReachScoreRecord | null;
}

export function DashboardClient({ creator, inquiries: initialInquiries, nationalRank, stateRank, reachScore }: DashboardClientProps) {
  const [inquiries, setInquiries] = useState<BrandInquiry[]>(initialInquiries);
  const [storyOpen, setStoryOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<BrandDeal[]>([]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('verified') || params.has('username')) {
      params.delete('verified');
      params.delete('username');
      const cleanUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);
  const [settings, setSettings] = useState({
    collab_paid: creator.collab_status?.includes('paid') || false,
    collab_barter: creator.collab_status?.includes('barter') || false,
    collab_ugc: creator.collab_status?.includes('ugc') || false,
    whatsapp_number: creator.whatsapp_number || '',
    contact_email: creator.contact_email || '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const category = getCategoryById(creator.category_id);
  const Icon = category ? (Icons[category.icon as keyof typeof Icons] as Icons.LucideIcon) : Sparkles;

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const collabStatus: string[] = [];
    if (settings.collab_paid) collabStatus.push('paid');
    if (settings.collab_barter) collabStatus.push('barter');
    if (settings.collab_ugc) collabStatus.push('ugc');

    try {
      await supabase.from('creators').update({
        collab_status: collabStatus,
        whatsapp_number: settings.whatsapp_number || null,
        contact_email: settings.contact_email || null,
        updated_at: new Date().toISOString(),
      }).eq('id', creator.id);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveCustomRates = async (rates: Partial<RateCard>) => {
    try {
      await supabase.from('creators').update({
        custom_rates: rates,
        updated_at: new Date().toISOString(),
      }).eq('id', creator.id);
    } catch {
      // ignore
    }
  };

  const handleDownloadPitchDeck = async () => {
    try {
      const res = await fetch(`/api/og/story?username=${encodeURIComponent(creator.username)}&t=Brand%20Pitch%20Deck`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reachboard-${creator.username}-pitch-deck.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  };

  const newInquiries = inquiries.filter((i) => i.status === 'new').length;
  const topMedia = (creator.top_media || []).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <a href="/#leaderboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboard
          </a>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <MapPin className="h-4 w-4 text-violet-400" />
            {creator.state ? creator.state : 'India'}
            <span className="text-white/20">·</span>
            <span className="text-white/70">#{nationalRank} in India</span>
            <span className="text-white/20">·</span>
            <span className="text-white/70">#{stateRank} in {creator.state || 'India'}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Creator Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">
            Welcome back, {creator.full_name || creator.username} — manage your profile, track analytics, and handle brand deals.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="glass rounded-xl p-1 h-auto flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/60 rounded-lg px-3 py-2 text-sm">
              <Trophy className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/60 rounded-lg px-3 py-2 text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/60 rounded-lg px-3 py-2 text-sm relative">
              <Inbox className="h-4 w-4 mr-2" />
              Inquiries
              {newInquiries > 0 && (
                <span className="ml-1.5 bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{newInquiries}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="brand-deals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/60 rounded-lg px-3 py-2 text-sm">
              <Building2 className="h-4 w-4 mr-2" />
              Brand Collabs
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/60 rounded-lg px-3 py-2 text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Media Kit
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TiltCard glow="purple" shine className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40">National Ranking</div>
                    <div className="text-3xl font-bold gradient-text">#{nationalRank}</div>
                  </div>
                </div>
                <div className="text-sm text-white/50">in India by ReachScore</div>
              </TiltCard>

              <TiltCard glow="pink" shine className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-slate-800" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40">{creator.state || 'State'} Ranking</div>
                    <div className="text-3xl font-bold gradient-text">#{stateRank}</div>
                  </div>
                </div>
                <div className="text-sm text-white/50">among {creator.state || 'regional'} creators</div>
              </TiltCard>

              {/* ReachScore Card */}
              <TiltCard glow="blue" shine className="p-5">
                <button onClick={() => scoreBreakdown && setDiagnosticOpen(true)} className="w-full text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getScoreBgColor(score)} flex items-center justify-center`}>
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-white/40">ReachScore</div>
                      <div className={`text-3xl font-bold ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>{getScoreLabel(score)}</span>
                    <span className="text-xs text-white/40 uppercase tracking-wide">{tier} Tier</span>
                  </div>
                  {scoreBreakdown && (
                    <div className="text-xs text-violet-400 mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Click to view breakdown
                    </div>
                  )}
                </button>
              </TiltCard>
            </div>

            {/* Story Card Generator - Live Editor */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                Story Card Generator
              </h3>
              <p className="text-sm text-white/60">
                Customize your 1080x1920 story card with live editing and export a crisp PNG to share on Instagram Stories.
              </p>
              <CreatorStoryCard creator={creator} nationalRank={nationalRank} stateRank={stateRank} />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard icon={Users} value={formatNumber(creator.followers_count)} label="Followers" color="text-violet-400" />
              <MetricCard icon={Eye} value={formatNumber(creator.reel_views_30d)} label="30D Reel Views" color="text-pink-400" />
              <MetricCard icon={Heart} value={`${creator.engagement_rate.toFixed(1)}%`} label="ER %" color="text-blue-400" />
              <MetricCard icon={MessageCircle} value={formatNumber(creator.avg_likes)} label="Avg Likes" color="text-green-400" />
            </div>

            {/* Top 3 Viral Reels */}
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Film className="h-5 w-5 text-pink-400" />
                Top 3 Viral Reels
              </h3>
              {topMedia.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {topMedia.map((media, idx) => (
                    <TiltCard key={idx} className="p-0 overflow-hidden">
                      <a href={media.permalink} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="relative aspect-[4/5]">
                          <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-violet-600/80 text-white border-0">#{idx + 1}</Badge>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white/80">
                            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {formatNumber(media.like_count)}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {formatNumber(media.comments_count)}</span>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-white/50 line-clamp-2">{media.caption}</p>
                        </div>
                      </a>
                    </TiltCard>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-xl p-8 text-center text-white/40 text-sm">
                  No top performing content available yet. Connect your Instagram to sync.
                </div>
              )}
            </div>

            {/* Rank Retention & History Chart */}
            <RankHistoryChart currentRank={nationalRank} currentScore={score} />
          </TabsContent>

          {/* Brand Deals Inbox Tab */}
          <TabsContent value="inbox" className="space-y-3">
            <InquiriesMessagingTab inquiries={inquiries} />
          </TabsContent>

          {/* Brand Collaborations & Deals Tab */}
          <TabsContent value="brand-deals" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-400" />
                Brand Collaborations & Campaigns
              </h3>
              <Button
                onClick={() => setCampaignModalOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Post a Campaign
              </Button>
            </div>

            {/* My Campaigns */}
            {campaigns.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-white/40 uppercase tracking-wide">My Campaigns</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaigns.map((c) => (
                    <a key={c.id} href={`/brand/campaigns/${c.id}`}>
                      <div className="glass rounded-xl p-3 space-y-2 border border-neutral-800 hover:border-violet-500/30 transition-all">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex items-center justify-center overflow-hidden">
                            {c.brand_logo_url ? (
                              <img src={c.brand_logo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <Building2 className="h-4 w-4 text-violet-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{c.campaign_title}</div>
                            <div className="text-xs text-white/40">{c.brand_name}</div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border text-[10px]">Active</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{c.budget_min && c.budget_max ? `${formatINR(c.budget_min)}-${formatINR(c.budget_max)}` : c.deal_type || 'paid'}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <BrandDealsHub creator={creator} />
          </TabsContent>

          {/* Media Kit Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg">Collaboration Availability</h3>
              <div className="space-y-3">
                <CollabToggle
                  label="Open for Paid Deals"
                  desc="Brands can submit paid campaign proposals"
                  checked={settings.collab_paid}
                  onChange={(v) => setSettings({ ...settings, collab_paid: v })}
                />
                <CollabToggle
                  label="Open for Barter / Gifting"
                  desc="Accept product gifting in exchange for content"
                  checked={settings.collab_barter}
                  onChange={(v) => setSettings({ ...settings, collab_barter: v })}
                />
                <CollabToggle
                  label="UGC Creator"
                  desc="Available for user-generated content creation"
                  checked={settings.collab_ugc}
                  onChange={(v) => setSettings({ ...settings, collab_ugc: v })}
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-white/70">Business WhatsApp Number</Label>
                  <Input
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    placeholder="919876543210"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-white/40 mt-1">Enter with country code, no + sign</p>
                </div>
                <div>
                  <Label className="text-white/70">Contact Email</Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="you@example.com"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Rate Card with editable */}
            <RateCardCalculator creator={creator} editable onSaveCustomRates={handleSaveCustomRates} />

            {/* Download Pitch Deck */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-lg">Pitch Deck</h3>
              <p className="text-sm text-white/50">Download a vertical 1080x1920 brand pitch card with your stats and ranking.</p>
              <Button onClick={handleDownloadPitchDeck} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                <Download className="h-4 w-4 mr-2" />
                Download Pitch Deck PDF
              </Button>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
              {settingsSaved && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Settings saved
                </span>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

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

      <CreateCampaignModal
        open={campaignModalOpen}
        onOpenChange={setCampaignModalOpen}
        onCampaignCreated={(c) => setCampaigns((prev) => [c, ...prev])}
      />
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

function CollabToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between glass rounded-xl p-3">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-white/40">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

