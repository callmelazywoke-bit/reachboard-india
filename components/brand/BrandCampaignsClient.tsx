'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Briefcase, Plus, Users, DollarSign, MapPin, Trophy, Target, Sparkles, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateCampaignModal } from '@/components/brand/CreateCampaignModal';
import { formatINR } from '@/lib/rateCard';
import type { BrandDeal } from '@/lib/types';

interface BrandCampaignsClientProps {
  campaigns: BrandDeal[];
  displayName: string;
}

export function BrandCampaignsClient({ campaigns: initialCampaigns, displayName }: BrandCampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<BrandDeal[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Brand Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">
              Welcome, {displayName} — manage your campaigns and review creator applications.
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Post a Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center space-y-4">
            <Briefcase className="h-12 w-12 text-white/20 mx-auto" />
            <h2 className="text-lg font-semibold">No campaigns yet</h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Post your first campaign to start receiving applications from verified Indian creators.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-white/40 uppercase tracking-wide">Your Campaigns</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {campaigns.map((c) => (
                <a key={c.id} href={`/brand/campaigns/${c.id}`}>
                  <div className="glass rounded-xl p-4 space-y-2 border border-neutral-800 hover:border-violet-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex items-center justify-center overflow-hidden">
                        {c.brand_logo_url ? (
                          <img src={c.brand_logo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <Building2 className="h-5 w-5 text-violet-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w0">
                        <div className="text-sm font-semibold truncate">{c.campaign_title}</div>
                        <div className="text-xs text-white/40">{c.brand_name}</div>
                      </div>
                      <Badge className={`${c.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'} border text-[10px]`}>
                        {c.status || 'active'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {c.budget_min && c.budget_max ? `${formatINR(c.budget_min)}-${formatINR(c.budget_max)}` : c.deal_type || 'paid'}
                      </span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location || 'All India'}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.follower_tier || 'All Tiers'}</span>
                      {c.min_reach_score ? <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{c.min_reach_score}+ RS</span> : null}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateCampaignModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCampaignCreated={(c) => setCampaigns((prev) => [c, ...prev])}
      />
    </div>
  );
}
