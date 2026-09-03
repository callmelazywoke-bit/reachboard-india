'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Trophy, MapPin, Users, Eye, Heart, Sparkles,
  CheckCircle2, XCircle, Send, Briefcase, Target, DollarSign,
  Filter, MessageSquare, Image as ImageIcon, ChevronRight,
  Crown, TrendingUp, Clock, Pencil, Pause, Play, ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, getCategoryById, INDIAN_STATES } from '@/lib/categories';
import { formatNumber, formatINR } from '@/lib/rateCard';
import { getScoreColor, getScoreBgColor, getScoreLabel } from '@/lib/reachScore';
import type { BrandDeal, BrandApplication, Creator, ReachScoreRecord } from '@/lib/types';
import type { ApplicationStage } from '@/lib/types';

interface ApplicantData {
  application: BrandApplication;
  creator: Creator;
  reachScore: ReachScoreRecord | null;
}

const STAGES: { key: ApplicationStage; label: string; color: string }[] = [
  { key: 'new', label: 'New Applicants', color: 'from-blue-500 to-cyan-500' },
  { key: 'shortlisted', label: 'Shortlisted', color: 'from-violet-500 to-purple-500' },
  { key: 'hired', label: 'Hired / In-Progress', color: 'from-green-500 to-emerald-500' },
  { key: 'archived', label: 'Archived / Passed', color: 'from-gray-500 to-gray-600' },
];

export function CampaignDashboard({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<BrandDeal | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<ApplicationStage>('new');
  const [sortBy, setSortBy] = useState<'reachScore' | 'er'>('reachScore');
  const [editingCampaign, setEditingCampaign] = useState(false);
  const [editBudget, setEditBudget] = useState({ min: '', max: '' });
  const [previewCreator, setPreviewCreator] = useState<Creator | null>(null);
  const [messageApplicant, setMessageApplicant] = useState<ApplicantData | null>(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campRes, appsRes] = await Promise.all([
        supabase.from('brand_deals').select('*').eq('id', campaignId).maybeSingle(),
        supabase.from('brand_applications').select('*').eq('deal_id', campaignId),
      ]);

      if (campRes.data) setCampaign(campRes.data as BrandDeal);

      if (appsRes.data && appsRes.data.length > 0) {
        const creatorIds = Array.from(new Set(appsRes.data.map((a: BrandApplication) => a.creator_id)));
        const [creatorsRes, scoresRes] = await Promise.all([
          supabase.from('creators').select('*').in('id', creatorIds),
          supabase.from('reach_scores').select('*').in('creator_id', creatorIds),
        ]);

        const creatorMap = new Map<string, Creator>();
        if (creatorsRes.data) {
          for (const c of creatorsRes.data as Creator[]) creatorMap.set(c.id, c);
        }
        const scoreMap = new Map<string, ReachScoreRecord>();
        if (scoresRes.data) {
          for (const s of scoresRes.data as ReachScoreRecord[]) scoreMap.set(s.creator_id, s);
        }

        const applicantData: ApplicantData[] = (appsRes.data as BrandApplication[])
          .map((app) => {
            const creator = creatorMap.get(app.creator_id);
            if (!creator) return null;
            return {
              application: app,
              creator,
              reachScore: scoreMap.get(app.creator_id) || null,
            };
          })
          .filter((a): a is ApplicantData => a !== null);

        setApplicants(applicantData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const stageApplicants = useMemo(() => {
    const filtered = applicants.filter((a) => a.application.stage === activeStage);
    return filtered.sort((a, b) => {
      if (sortBy === 'er') {
        return b.creator.engagement_rate - a.creator.engagement_rate;
      }
      const aScore = a.reachScore?.reach_score || 0;
      const bScore = b.reachScore?.reach_score || 0;
      return bScore - aScore;
    });
  }, [applicants, activeStage, sortBy]);

  const stageCounts = useMemo(() => {
    const counts: Record<ApplicationStage, number> = { new: 0, shortlisted: 0, hired: 0, archived: 0 };
    for (const a of applicants) {
      counts[a.application.stage as ApplicationStage] = (counts[a.application.stage as ApplicationStage] || 0) + 1;
    }
    return counts;
  }, [applicants]);

  const toggleCampaignStatus = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    setCampaign({ ...campaign, status: newStatus });
    try {
      await supabase.from('brand_deals').update({ status: newStatus }).eq('id', campaign.id);
    } catch {
      // ignore
    }
  };

  const saveCampaignEdits = async () => {
    if (!campaign) return;
    const updates: Record<string, unknown> = {};
    if (editBudget.min) updates.budget_min = parseFloat(editBudget.min);
    if (editBudget.max) updates.budget_max = parseFloat(editBudget.max);
    if (Object.keys(updates).length === 0) { setEditingCampaign(false); return; }
    const updated = { ...campaign, ...updates } as BrandDeal;
    setCampaign(updated);
    try {
      await supabase.from('brand_deals').update(updates).eq('id', campaign.id);
    } catch {
      // ignore
    }
    setEditingCampaign(false);
  };

  const moveStage = async (applicationId: string, newStage: ApplicationStage) => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.application.id === applicationId
          ? { ...a, application: { ...a.application, stage: newStage } }
          : a
      )
    );
    try {
      await supabase.from('brand_applications').update({ stage: newStage }).eq('id', applicationId);
    } catch {
      // ignore
    }
  };

  const sendMessage = () => {
    if (!messageApplicant) return;
    setMessageApplicant(null);
    setMessageText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-white/40 animate-pulse">Loading campaign dashboard...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <Briefcase className="h-10 w-10 text-white/20 mx-auto" />
          <p className="text-white/40">Campaign not found.</p>
          <a href="/dashboard">
            <Button variant="outline" className="border-neutral-800 bg-white/5 text-white hover:bg-white/10">
              Back to Dashboard
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const category = getCategoryById(campaign.niche_category_id);
  const budgetLabel = campaign.budget_min && campaign.budget_max
    ? `${formatINR(campaign.budget_min)} – ${formatINR(campaign.budget_max)}`
    : campaign.budget_min
    ? `${formatINR(campaign.budget_min)}`
    : campaign.deal_type === 'barter' ? 'Barter' : 'Budget TBD';

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back link */}
        <a href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </a>

        {/* Campaign Header */}
        <div className="glass rounded-2xl p-5 space-y-3 border border-neutral-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {campaign.brand_logo_url ? (
                <img src={campaign.brand_logo_url} alt={campaign.brand_name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <Briefcase className="h-7 w-7 text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{campaign.campaign_title}</h1>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active
                </Badge>
              </div>
              <div className="text-sm text-white/50">{campaign.brand_name}</div>
            </div>
            <div className="text-right flex-shrink-0 space-y-2">
              <div>
                <div className="text-xs text-white/40">Budget</div>
                <div className="text-lg font-bold text-green-400">{budgetLabel}</div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingCampaign(!editingCampaign); setEditBudget({ min: campaign.budget_min?.toString() || '', max: campaign.budget_max?.toString() || '' }); }}
                  className="border-neutral-800 bg-white/5 text-white hover:bg-white/10 text-xs h-7"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleCampaignStatus}
                  className={`text-xs h-7 ${campaign.status === 'active' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20' : 'border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20'}`}
                >
                  {campaign.status === 'active' ? <><Pause className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Resume</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Edit budget inline */}
          {editingCampaign && (
            <div className="flex items-end gap-2 pt-2 border-t border-neutral-800">
              <div>
                <label className="text-xs text-white/40">Budget Min</label>
                <Input type="number" value={editBudget.min} onChange={(e) => setEditBudget({ ...editBudget, min: e.target.value })} placeholder="15000" className="bg-white/5 border-neutral-800 text-white h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/40">Budget Max</label>
                <Input type="number" value={editBudget.max} onChange={(e) => setEditBudget({ ...editBudget, max: e.target.value })} placeholder="25000" className="bg-white/5 border-neutral-800 text-white h-8 text-sm" />
              </div>
              <Button size="sm" onClick={saveCampaignEdits} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 h-8">Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingCampaign(false)} className="border-neutral-800 bg-white/5 text-white h-8">Cancel</Button>
            </div>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {category && (
              <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {category.name}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {campaign.location || 'All India'}
            </Badge>
            <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {campaign.follower_tier || 'All Tiers'}
            </Badge>
            {campaign.min_reach_score && campaign.min_reach_score > 0 && (
              <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {campaign.min_reach_score}+ RS
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-xs flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {campaign.deal_type || 'paid'}
            </Badge>
            <Badge variant="secondary" className="bg-violet-600/20 text-violet-300 border-violet-500/30 border text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {applicants.length} Applicants
            </Badge>
          </div>

          {campaign.description && (
            <p className="text-sm text-white/60">{campaign.description}</p>
          )}
          {campaign.deliverables && (
            <div className="text-xs text-white/50">
              <span className="text-white/30">Deliverables: </span>{campaign.deliverables}
            </div>
          )}
        </div>

        {/* Sort toggle + Kanban Stage Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1 glass rounded-xl p-1 overflow-x-auto">
            {STAGES.map((s) => {
              const count = stageCounts[s.key] || 0;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStage(s.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeStage === s.key
                      ? `bg-gradient-to-r ${s.color} text-white`
                      : 'text-white/60 hover:text-white'
                  }`}>
                  {s.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeStage === s.key ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          {activeStage === 'new' && (
            <div className="flex items-center gap-1 glass rounded-lg p-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-white/40 ml-2" />
              <button
                onClick={() => setSortBy('reachScore')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'reachScore' ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Trophy className="h-3 w-3 inline mr-1" />ReachScore
              </button>
              <button
                onClick={() => setSortBy('er')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${sortBy === 'er' ? 'bg-pink-600 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Heart className="h-3 w-3 inline mr-1" />ER%
              </button>
            </div>
          )}
        </div>

        {/* Applicant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageApplicants.length === 0 ? (
            <div className="col-span-full glass rounded-2xl p-12 text-center text-white/40">
              No applicants in this stage yet.
            </div>
          ) : (
            stageApplicants.map((applicant) => (
              <ApplicantCard
                key={applicant.application.id}
                applicant={applicant}
                stage={activeStage}
                onShortlist={() => moveStage(applicant.application.id, 'shortlisted')}
                onHire={() => moveStage(applicant.application.id, 'hired')}
                onArchive={() => moveStage(applicant.application.id, 'archived')}
                onPreview={() => setPreviewCreator(applicant.creator)}
                onMessage={() => { setMessageApplicant(applicant); setMessageText(`Hi @${applicant.creator.username}, thanks for applying to "${campaign.campaign_title}"! We'd love to discuss...`); }}
              />
            ))
          )}
        </div>
      </div>

      {/* Story Preview Modal */}
      {previewCreator && (
        <Dialog open={!!previewCreator} onOpenChange={(v) => !v && setPreviewCreator(null)}>
          <DialogContent className="max-w-[400px] bg-neutral-950 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-violet-400" />
                Story Preview — @{previewCreator.username}
              </DialogTitle>
            </DialogHeader>
            <div className="relative mx-auto w-[270px] h-[480px] rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800">
              {/* Story card mockup */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
                <img
                  src={previewCreator.avatar_url || ''}
                  alt={previewCreator.username}
                  crossOrigin="anonymous"
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-500/50"
                />
                <div className="text-center space-y-1">
                  <div className="font-bold text-lg">@{previewCreator.username}</div>
                  <div className="text-xs text-white/50">{previewCreator.full_name}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  <div className="glass rounded-lg p-2 text-center">
                    <Users className="h-3.5 w-3.5 mx-auto text-violet-400 mb-0.5" />
                    <div className="text-xs font-bold">{formatNumber(previewCreator.followers_count)}</div>
                    <div className="text-[8px] text-white/40">Followers</div>
                  </div>
                  <div className="glass rounded-lg p-2 text-center">
                    <Eye className="h-3.5 w-3.5 mx-auto text-pink-400 mb-0.5" />
                    <div className="text-xs font-bold">{formatNumber(previewCreator.reel_views_30d)}</div>
                    <div className="text-[8px] text-white/40">30D Views</div>
                  </div>
                  <div className="glass rounded-lg p-2 text-center">
                    <Heart className="h-3.5 w-3.5 mx-auto text-blue-400 mb-0.5" />
                    <div className="text-xs font-bold">{previewCreator.engagement_rate.toFixed(1)}%</div>
                    <div className="text-[8px] text-white/40">ER%</div>
                  </div>
                </div>
                <div className="text-[10px] text-white/30 text-center">
                  ReachBoard India · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Modal */}
      {messageApplicant && (
        <Dialog open={!!messageApplicant} onOpenChange={(v) => !v && setMessageApplicant(null)}>
          <DialogContent className="max-w-[460px] bg-neutral-950 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                Send Direct Brief
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 glass rounded-lg p-2">
                <img src={messageApplicant.creator.avatar_url || ''} alt="" className="w-8 h-8 rounded-full object-cover" crossOrigin="anonymous" />
                <span className="text-sm font-medium">@{messageApplicant.creator.username}</span>
              </div>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-neutral-800 text-white text-sm rounded-lg p-3 resize-none"
                placeholder="Type your message..."
              />
              <div className="flex gap-2">
                <Button onClick={sendMessage} className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
                  <Send className="h-4 w-4 mr-1.5" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setMessageApplicant(null)} className="border-neutral-800 bg-white/5 text-white hover:bg-white/10">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ApplicantCard({
  applicant, stage, onShortlist, onHire, onArchive, onPreview, onMessage,
}: {
  applicant: ApplicantData;
  stage: ApplicationStage;
  onShortlist: () => void;
  onHire: () => void;
  onArchive: () => void;
  onPreview: () => void;
  onMessage: () => void;
}) {
  const { creator, reachScore, application } = applicant;
  const score = reachScore?.reach_score || 0;
  const category = getCategoryById(creator.category_id);
  const stateRank = reachScore?.state_rank;
  const creatorState = creator.state;

  return (
    <div className="glass rounded-2xl p-4 space-y-3 border border-neutral-800 hover:border-violet-500/30 transition-all">
      {/* Header: avatar + name + niche */}
      <div className="flex items-start gap-3">
        <img
          src={creator.avatar_url || ''}
          alt={creator.username}
          crossOrigin="anonymous"
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">@{creator.username}</span>
            {creator.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-white/40 truncate">{creator.full_name}</div>
          {category && (
            <Badge variant="secondary" className="bg-white/10 text-white/60 border-0 text-[10px] mt-1">
              {category.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Performance badges: ReachScore + dual rank pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${getScoreBgColor(score)} text-white`}>
          <Trophy className="h-3 w-3" />
          <span className="text-xs font-bold">{score.toFixed(1)}</span>
          <span className="text-[10px] opacity-80">ReachScore</span>
        </div>
        {reachScore?.india_rank && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/70">
            <Crown className="h-3 w-3 text-yellow-400" />
            <span className="text-xs font-medium">#{reachScore.india_rank} in India</span>
          </div>
        )}
        {creatorState && stateRank && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/70">
            <MapPin className="h-3 w-3" />
            <span className="text-xs font-medium">#{stateRank} in {creatorState}</span>
          </div>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-lg p-2 text-center">
          <Users className="h-3.5 w-3.5 mx-auto text-violet-400 mb-0.5" />
          <div className="text-xs font-bold">{formatNumber(creator.followers_count)}</div>
          <div className="text-[8px] text-white/40">Followers</div>
        </div>
        <div className="glass rounded-lg p-2 text-center">
          <Eye className="h-3.5 w-3.5 mx-auto text-pink-400 mb-0.5" />
          <div className="text-xs font-bold">{formatNumber(creator.reel_views_30d)}</div>
          <div className="text-[8px] text-white/40">30D Views</div>
        </div>
        <div className="glass rounded-lg p-2 text-center">
          <Heart className="h-3.5 w-3.5 mx-auto text-blue-400 mb-0.5" />
          <div className="text-xs font-bold">{creator.engagement_rate.toFixed(1)}%</div>
          <div className="text-[8px] text-white/40">ER%</div>
        </div>
      </div>

      {/* Pitch quote */}
      {application.pitch_quote && (
        <div className="glass rounded-lg p-2.5 space-y-1">
          <div className="text-[10px] text-white/40 uppercase tracking-wide flex items-center gap-1">
            <MessageSquare className="h-2.5 w-2.5" />
            Pitch Quote
          </div>
          <p className="text-xs text-white/70 leading-relaxed">{application.pitch_quote}</p>
          {application.counter_offer && (
            <div className="flex items-center gap-1 text-xs text-green-400 font-semibold pt-1">
              <DollarSign className="h-3 w-3" />
              Counter: {formatINR(application.counter_offer)}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {stage === 'new' && (
          <Button
            size="sm"
            onClick={onShortlist}
            className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Shortlist
          </Button>
        )}
        {(stage === 'new' || stage === 'shortlisted') && (
          <Button
            size="sm"
            onClick={onHire}
            className="bg-green-600/80 text-white border-0 text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Hire
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={onMessage}
          className="border-neutral-800 bg-white/5 text-white hover:bg-white/10 text-xs"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Brief
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          className="border-neutral-800 bg-white/5 text-white hover:bg-white/10 text-xs"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          Preview
        </Button>
        {stage !== 'archived' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onArchive}
            className="border-red-500/20 bg-red-500/5 text-red-300 hover:bg-red-500/10 text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Pass
          </Button>
        )}
      </div>
    </div>
  );
}
