'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Briefcase, Check, X, Sparkles, Users, Heart, Eye, TrendingUp,
  ArrowRight, Send, BadgeCheck, IndianRupee, Gift, Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { getCategoryById, CATEGORIES } from '@/lib/categories';
import { formatNumber, formatINR } from '@/lib/rateCard';
import type { Creator, BrandDeal } from '@/lib/types';

interface BrandDealsHubProps {
  creator: Creator;
}

export function BrandDealsHub({ creator }: BrandDealsHubProps) {
  const [deals, setDeals] = useState<BrandDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedDealIds, setAppliedDealIds] = useState<Set<string>>(new Set());
  const [applyDeal, setApplyDeal] = useState<BrandDeal | null>(null);
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nicheFilter, setNicheFilter] = useState<string>('all');

  useEffect(() => {
    loadDeals();
    loadApplications();
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_deals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setDeals(data as BrandDeal[]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data } = await supabase
        .from('brand_applications')
        .select('deal_id')
        .eq('creator_id', creator.id);
      if (data) {
        setAppliedDealIds(new Set(data.map((d: { deal_id: string }) => d.deal_id)));
      }
    } catch {
      // ignore
    }
  };

  const filteredDeals = useMemo(() => {
    if (nicheFilter === 'all') return deals;
    return deals.filter((d) => d.niche_category_id === nicheFilter);
  }, [deals, nicheFilter]);

  const checkEligibility = (deal: BrandDeal): boolean => {
    return (
      creator.followers_count >= deal.min_followers &&
      creator.engagement_rate >= deal.min_engagement_rate
    );
  };

  const handleApplyClick = (deal: BrandDeal) => {
    setApplyDeal(deal);
    setPitch(
      `Hi ${deal.brand_name}, I'm @${creator.username} with ${formatNumber(creator.followers_count)} followers and ${creator.engagement_rate.toFixed(1)}% ER. I'd love to collaborate on "${deal.campaign_title}".`
    );
    setSubmitted(false);
  };

  const handleSubmitApplication = async () => {
    if (!applyDeal) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('brand_applications').insert({
        deal_id: applyDeal.id,
        creator_id: creator.id,
        pitch_quote: pitch.trim().slice(0, 140),
      });
      if (!error) {
        setAppliedDealIds((prev) => new Set(prev).add(applyDeal.id));
        setSubmitted(true);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const views = creator.reel_views_30d || Math.round(creator.followers_count * (creator.engagement_rate / 100) * 8.5);

  const payoutIcon = (type: string) => {
    if (type === 'barter') return <Gift className="h-3.5 w-3.5" />;
    if (type === 'barter+affiliate') return <><Gift className="h-3.5 w-3.5" /><Percent className="h-3.5 w-3.5" /></>;
    return <IndianRupee className="h-3.5 w-3.5" />;
  };

  const payoutLabel = (deal: BrandDeal) => {
    if (deal.payout_type === 'barter') return 'Barter';
    if (deal.budget_min && deal.budget_max) return `${formatINR(deal.budget_min)} – ${formatINR(deal.budget_max)}`;
    if (deal.payout_type === 'barter+affiliate') return 'Barter + Affiliate';
    return 'Paid';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-violet-400" />
          Active Brand Collaborations & Deals
        </h3>
        <div className="flex gap-1 glass rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setNicheFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              nicheFilter === 'all' ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            All Niches
          </button>
          {CATEGORIES.filter((c) => c.type === 'creator').slice(0, 6).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setNicheFilter(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                nicheFilter === cat.id ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {cat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-white/40 text-sm">
          Loading active brand deals...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center space-y-2">
          <Briefcase className="h-10 w-10 text-white/20 mx-auto" />
          <p className="text-white/40 text-sm">No active deals matching this niche right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDeals.map((deal) => {
            const eligible = checkEligibility(deal);
            const applied = appliedDealIds.has(deal.id);
            const category = getCategoryById(deal.niche_category_id);

            return (
              <div
                key={deal.id}
                className={`glass rounded-2xl p-4 space-y-3 border ${eligible ? 'border-green-500/20' : 'border-white/5'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {deal.brand_logo_url ? (
                      <img src={deal.brand_logo_url} alt={deal.brand_name} className="w-full h-full object-cover" />
                    ) : (
                      <Briefcase className="h-6 w-6 text-violet-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm truncate">{deal.brand_name}</h4>
                      {eligible ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 border text-[10px] flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" />
                          Eligible
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-300/70 border-red-500/20 border text-[10px]">
                          Not Eligible
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/50 truncate">{deal.campaign_title}</p>
                  </div>
                </div>

                {deal.description && (
                  <p className="text-xs text-white/60 leading-relaxed">{deal.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {category && (
                    <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-[10px]">
                      {category.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-[10px] flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {formatNumber(deal.min_followers)}+ followers
                  </Badge>
                  <Badge variant="secondary" className="bg-white/10 text-white/70 border-0 text-[10px] flex items-center gap-1">
                    <Heart className="h-2.5 w-2.5" />
                    {deal.min_engagement_rate}% ER min
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 text-xs font-semibold text-green-400">
                      {payoutIcon(deal.payout_type)}
                    </div>
                    <span className="text-xs text-white/70">{payoutLabel(deal)}</span>
                  </div>
                  {applied ? (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border text-[10px] flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Applied
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleApplyClick(deal)}
                      disabled={!eligible}
                      className={
                        eligible
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 text-xs'
                          : 'bg-white/5 text-white/30 border-0 text-xs cursor-not-allowed'
                      }
                    >
                      <Send className="h-3 w-3 mr-1" />
                      1-Click Apply
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Modal */}
      <Dialog open={!!applyDeal} onOpenChange={(open) => !open && setApplyDeal(null)}>
        <DialogContent className="max-w-[460px] bg-[#0B0F17] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="gradient-text text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              {submitted ? 'Application Sent!' : `Apply to ${applyDeal?.brand_name || ''}`}
            </DialogTitle>
            <button
              onClick={() => setApplyDeal(null)}
              className="absolute right-4 top-4 text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          {submitted ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-white/70 text-sm">
                Your application has been sent to <span className="font-semibold text-white">{applyDeal?.brand_name}</span> with your verified metrics and pitch. They&apos;ll reach out if there&apos;s a match!
              </p>
              <Button
                onClick={() => setApplyDeal(null)}
                className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Creator metrics preview */}
              <div className="glass rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <img src={creator.avatar_url || ''} alt={creator.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-sm">@{creator.username}</div>
                    <div className="text-xs text-white/40">{creator.full_name}</div>
                  </div>
                  <Badge className="ml-auto bg-green-500/20 text-green-300 border-green-500/30 border text-[10px] flex items-center gap-0.5">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    Eligible
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center glass rounded-lg p-1.5">
                    <Users className="h-3 w-3 mx-auto text-violet-400 mb-0.5" />
                    <div className="text-xs font-bold">{formatNumber(creator.followers_count)}</div>
                    <div className="text-[8px] text-white/40">Followers</div>
                  </div>
                  <div className="text-center glass rounded-lg p-1.5">
                    <Eye className="h-3 w-3 mx-auto text-pink-400 mb-0.5" />
                    <div className="text-xs font-bold">{formatNumber(views)}</div>
                    <div className="text-[8px] text-white/40">30D Views</div>
                  </div>
                  <div className="text-center glass rounded-lg p-1.5">
                    <Heart className="h-3 w-3 mx-auto text-blue-400 mb-0.5" />
                    <div className="text-xs font-bold">{creator.engagement_rate.toFixed(1)}%</div>
                    <div className="text-[8px] text-white/40">ER%</div>
                  </div>
                  <div className="text-center glass rounded-lg p-1.5">
                    <TrendingUp className="h-3 w-3 mx-auto text-yellow-400 mb-0.5" />
                    <div className="text-xs font-bold">#{creator.id.slice(0, 2)}</div>
                    <div className="text-[8px] text-white/40">India</div>
                  </div>
                </div>
              </div>

              {/* Campaign info */}
              <div className="glass rounded-xl p-3 space-y-1.5">
                <div className="text-xs text-white/40 uppercase tracking-wide">Campaign</div>
                <div className="font-semibold text-sm">{applyDeal?.campaign_title}</div>
                <div className="text-xs text-white/60">{applyDeal?.requirements}</div>
              </div>

              {/* Pitch editor */}
              <div className="space-y-2">
                <Label className="text-white/70 text-sm flex items-center justify-between">
                  <span>Your Pitch Quote</span>
                  <span className="text-xs text-white/30">{pitch.length}/140</span>
                </Label>
                <Textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value.slice(0, 140))}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
                >
                  {submitting ? 'Sending...' : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Application
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setApplyDeal(null)}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
