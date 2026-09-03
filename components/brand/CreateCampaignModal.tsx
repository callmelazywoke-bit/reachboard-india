'use client';

import { useState } from 'react';
import {
  Sparkles, ChevronRight, ChevronLeft, Check, Users, MapPin,
  Trophy, DollarSign, Target, Filter, Briefcase, Upload, Image as ImageIcon,
  ChevronDown, AlertCircle, Minus, Plus, Film, Layers, Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { CATEGORIES, INDIAN_STATES } from '@/lib/categories';
import { supabase } from '@/lib/supabase';
import type { BrandDeal } from '@/lib/types';

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCampaignCreated?: (campaign: BrandDeal) => void;
}

type DealType = 'paid' | 'barter' | 'affiliate';
type TierOption = 'all' | 'NANO' | 'RISING' | 'GROWTH' | 'ESTABLISHED' | 'ELITE';

const STEPS = [
  { label: 'Campaign Details', icon: Briefcase },
  { label: 'Targeting', icon: Filter },
  { label: 'Budget & Deliverables', icon: DollarSign },
] as const;

const TIER_OPTIONS: { value: TierOption; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'NANO', label: 'Nano (<10K)' },
  { value: 'RISING', label: 'Rising (10K-50K)' },
  { value: 'GROWTH', label: 'Growth (50K-200K)' },
  { value: 'ESTABLISHED', label: 'Established (200K-1M)' },
  { value: 'ELITE', label: 'Elite (1M+)' },
];

const TIER_DEFAULTS: Record<TierOption, { er: number; reachScore: number }> = {
  all: { er: 2.0, reachScore: 50 },
  NANO: { er: 4.5, reachScore: 60 },
  RISING: { er: 3.5, reachScore: 65 },
  GROWTH: { er: 2.5, reachScore: 70 },
  ESTABLISHED: { er: 1.8, reachScore: 75 },
  ELITE: { er: 1.2, reachScore: 80 },
};

const LOCATION_OPTIONS = ['All India', ...INDIAN_STATES];

const TITLE_MIN = 6;
const BRAND_MIN = 3;
const DESC_MIN = 25;
const GUIDELINES_MIN = 20;

function FieldError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function DropdownSelect({
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between bg-white/5 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Icon className="h-3.5 w-3.5 text-white/40 flex-shrink-0" />
            <span className={selected ? 'text-white' : 'text-white/30'}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 text-white/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[200px] bg-neutral-900 border-neutral-800 p-1 max-h-[240px] overflow-y-auto"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
              opt.value === value
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {opt.label}
            {opt.value === value && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function NumberCounter({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white/5 border border-neutral-800 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-400 flex-shrink-0" />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="w-7 h-7 rounded-md bg-white/5 border border-neutral-700 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-md bg-white/5 border border-neutral-700 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CreateCampaignModal({ open, onOpenChange, onCampaignCreated }: CreateCampaignModalProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Campaign details
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [guidelines, setGuidelines] = useState('');

  // Structured deliverables
  const [dedicatedReels, setDedicatedReels] = useState(1);
  const [integratedReels, setIntegratedReels] = useState(0);
  const [stories, setStories] = useState(2);
  const [deliverablesNote, setDeliverablesNote] = useState('');

  // Step 2: Targeting
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [location, setLocation] = useState('All India');
  const [tier, setTier] = useState<TierOption>('all');
  const [minReachScore, setMinReachScore] = useState(TIER_DEFAULTS.all.reachScore);
  const [minEr, setMinEr] = useState(TIER_DEFAULTS.all.er);

  // Step 3: Budget
  const [dealType, setDealType] = useState<DealType>('paid');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [appLimit, setAppLimit] = useState('30');

  // Track which fields have been touched/blurred to show errors only after interaction
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const totalDeliverables = dedicatedReels + integratedReels + stories;

  const buildDeliverablesString = () => {
    const parts: string[] = [];
    if (dedicatedReels > 0) parts.push(`${dedicatedReels} Dedicated Reel${dedicatedReels > 1 ? 's' : ''}`);
    if (integratedReels > 0) parts.push(`${integratedReels} Integrated Reel${integratedReels > 1 ? 's' : ''}`);
    if (stories > 0) parts.push(`${stories} Stor${stories > 1 ? 'ies' : 'y'}`);
    return parts.join(' + ');
  };

  const resetForm = () => {
    setStep(0);
    setTitle(''); setBrandName(''); setBrandLogoUrl(''); setDescription('');
    setGuidelines('');
    setDedicatedReels(1); setIntegratedReels(0); setStories(2); setDeliverablesNote('');
    setSelectedNiches([]); setLocation('All India'); setTier('all');
    setMinReachScore(TIER_DEFAULTS.all.reachScore); setMinEr(TIER_DEFAULTS.all.er);
    setDealType('paid'); setBudgetMin(''); setBudgetMax(''); setAppLimit('30');
    setSuccess(false);
    setTouched({});
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 300);
  };

  const toggleNiche = (nicheId: string) => {
    setSelectedNiches((prev) =>
      prev.includes(nicheId)
        ? prev.filter((n) => n !== nicheId)
        : [...prev, nicheId]
    );
  };

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleTierChange = (newTier: string) => {
    const t = newTier as TierOption;
    setTier(t);
    const defaults = TIER_DEFAULTS[t];
    setMinEr(defaults.er);
    setMinReachScore(defaults.reachScore);
  };

  // Validation helpers
  const titleValid = title.trim().length >= TITLE_MIN;
  const brandValid = brandName.trim().length >= BRAND_MIN;
  const descValid = description.trim().length >= DESC_MIN;
  const guidelinesValid = guidelines.trim().length >= GUIDELINES_MIN;
  const deliverablesValid = totalDeliverables >= 1;
  const budgetValid = dealType === 'barter' || (budgetMin.trim() !== '' && parseFloat(budgetMin) > 0);

  const canProceed = () => {
    if (step === 0) return titleValid && brandValid && descValid && guidelinesValid && deliverablesValid;
    if (step === 1) return selectedNiches.length > 0;
    if (step === 2) return budgetValid;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const deliverablesStr = buildDeliverablesString();
      const fullDeliverables = deliverablesNote.trim()
        ? `${deliverablesStr} (${deliverablesNote.trim()})`
        : deliverablesStr;

      const payload = {
        campaign_title: title.trim(),
        brand_name: brandName.trim(),
        brand_logo_url: brandLogoUrl.trim() || null,
        description: description.trim() || null,
        deliverables: fullDeliverables,
        requirements: fullDeliverables,
        brand_guidelines: guidelines.trim() || null,
        niche_category_id: selectedNiches[0] || null,
        target_niches: selectedNiches,
        location,
        follower_tier: tier,
        min_reach_score: minReachScore,
        min_followers: tier === 'NANO' ? 0 : tier === 'RISING' ? 10000 : tier === 'GROWTH' ? 50000 : tier === 'ESTABLISHED' ? 200000 : tier === 'ELITE' ? 1000000 : 0,
        min_engagement_rate: minEr,
        deal_type: dealType,
        payout_type: dealType === 'affiliate' ? 'barter+affiliate' : dealType,
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        application_limit: parseInt(appLimit) || 30,
        status: 'active',
      };

      const { data, error } = await supabase
        .from('brand_deals')
        .insert(payload)
        .select('*')
        .single();

      if (!error && data) {
        setSuccess(true);
        if (onCampaignCreated) onCampaignCreated(data as BrandDeal);
        setTimeout(handleClose, 1500);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[560px] bg-[#0B0F17] border-neutral-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            Post a Campaign
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-white/70 text-sm">
              Campaign <span className="font-semibold text-white">{title}</span> is now live! Eligible creators will see it in their Brand Collabs feed.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const StepIcon = s.icon;
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        i === step
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                          : i < step
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {i < step ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-white/20 mx-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 0: Campaign Details */}
            {step === 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-white/70 text-sm">Campaign Title *</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => markTouched('title')}
                    placeholder="Smile Bright Whitening Kit Launch"
                    className={`bg-white/5 border-neutral-800 text-white placeholder:text-white/30 ${
                      touched.title && !titleValid ? 'border-red-500/50' : ''
                    }`}
                  />
                  {touched.title && !titleValid && (
                    <FieldError message={`Campaign title must be at least ${TITLE_MIN} characters`} />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-sm">Brand Name *</Label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      onBlur={() => markTouched('brandName')}
                      placeholder="DentalCare India"
                      className={`bg-white/5 border-neutral-800 text-white placeholder:text-white/30 ${
                        touched.brandName && !brandValid ? 'border-red-500/50' : ''
                      }`}
                    />
                    {touched.brandName && !brandValid && (
                      <FieldError message={`Brand name must be at least ${BRAND_MIN} characters`} />
                    )}
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm">Brand Logo URL</Label>
                    <div className="relative">
                      <Input
                        value={brandLogoUrl}
                        onChange={(e) => setBrandLogoUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 pr-9"
                      />
                      {brandLogoUrl ? (
                        <img src={brandLogoUrl} alt="" className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded object-cover" />
                      ) : (
                        <Upload className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-white/70 text-sm">Description / Brief *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => markTouched('description')}
                    rows={2}
                    placeholder="Brief overview of the campaign, product details, and what you're looking for from the creator..."
                    className={`bg-white/5 border-neutral-800 text-white placeholder:text-white/30 resize-none ${
                      touched.description && !descValid ? 'border-red-500/50' : ''
                    }`}
                  />
                  {touched.description && !descValid && (
                    <FieldError message={`Description must be at least ${DESC_MIN} characters to provide meaningful context`} />
                  )}
                </div>

                {/* Structured Deliverables */}
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Deliverables *</Label>
                  <div className="space-y-2">
                    <NumberCounter
                      label="Dedicated Reels"
                      icon={Film}
                      value={dedicatedReels}
                      onChange={setDedicatedReels}
                    />
                    <NumberCounter
                      label="Integrated Reels"
                      icon={Layers}
                      value={integratedReels}
                      onChange={setIntegratedReels}
                    />
                    <NumberCounter
                      label="Instagram Stories"
                      icon={Instagram}
                      value={stories}
                      onChange={setStories}
                    />
                  </div>
                  <div className="mt-2">
                    <Label className="text-white/50 text-xs">Additional Deliverables Note (Optional)</Label>
                    <Input
                      value={deliverablesNote}
                      onChange={(e) => setDeliverablesNote(e.target.value)}
                      placeholder="e.g., Link sticker required in stories"
                      className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 text-sm"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-white/40">Summary:</span>
                    <span className="text-white/70 font-medium">{buildDeliverablesString()}</span>
                    {totalDeliverables < 1 && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        At least 1 deliverable required
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm">Brand Guidelines / Talking Points *</Label>
                  <Textarea
                    value={guidelines}
                    onChange={(e) => setGuidelines(e.target.value)}
                    onBlur={() => markTouched('guidelines')}
                    rows={2}
                    placeholder="Key talking points, do's and don'ts, hashtag requirements, disclosure rules..."
                    className={`bg-white/5 border-neutral-800 text-white placeholder:text-white/30 resize-none ${
                      touched.guidelines && !guidelinesValid ? 'border-red-500/50' : ''
                    }`}
                  />
                  {touched.guidelines && !guidelinesValid && (
                    <FieldError message={`Guidelines must be at least ${GUIDELINES_MIN} characters`} />
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Targeting */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm flex items-center gap-1.5 mb-2">
                    <Filter className="h-3.5 w-3.5" />
                    Target Niches *
                  </Label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {CATEGORIES.filter((c) => c.type === 'creator').map((cat) => {
                      const active = selectedNiches.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleNiche(cat.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            active
                              ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {active && <Check className="h-3 w-3 inline mr-0.5" />}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-white/30 mt-1">{selectedNiches.length} selected</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-sm flex items-center gap-1.5 mb-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Location
                    </Label>
                    <DropdownSelect
                      value={location}
                      onChange={setLocation}
                      icon={MapPin}
                      placeholder="Select location"
                      options={LOCATION_OPTIONS.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-sm flex items-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Follower Tier
                    </Label>
                    <DropdownSelect
                      value={tier}
                      onChange={handleTierChange}
                      icon={Users}
                      placeholder="Select tier"
                      options={TIER_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white/70 text-sm flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3.5 w-3.5" />
                    Min. ReachScore: <span className="text-violet-400 font-bold">{minReachScore}</span>
                  </Label>
                  <Slider
                    value={[minReachScore]}
                    onValueChange={(v) => setMinReachScore(v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>

                <div>
                  <Label className="text-white/70 text-sm flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5" />
                    Min. ER%: <span className="text-pink-400 font-bold">{minEr.toFixed(1)}%</span>
                  </Label>
                  <Slider
                    value={[minEr]}
                    onValueChange={(v) => setMinEr(v[0])}
                    min={0}
                    max={20}
                    step={0.5}
                    className="py-2"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Budget & Deliverables */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white/70 text-sm mb-2 block">Deal Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'paid' as const, label: 'Paid', icon: DollarSign },
                      { value: 'barter' as const, label: 'Barter', icon: ImageIcon },
                      { value: 'affiliate' as const, label: 'Affiliate + Base', icon: Target },
                    ]).map((d) => {
                      const DIcon = d.icon;
                      return (
                        <button
                          key={d.value}
                          onClick={() => setDealType(d.value)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                            dealType === d.value
                              ? 'border-violet-500 bg-violet-600/20 text-white'
                              : 'border-neutral-800 bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          <DIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dealType !== 'barter' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/70 text-sm">Budget Min (INR) *</Label>
                      <Input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        onBlur={() => markTouched('budgetMin')}
                        placeholder="15000"
                        className={`bg-white/5 border-neutral-800 text-white placeholder:text-white/30 ${
                          touched.budgetMin && !budgetValid ? 'border-red-500/50' : ''
                        }`}
                      />
                      {touched.budgetMin && !budgetValid && (
                        <FieldError message="Enter a valid positive budget amount" />
                      )}
                    </div>
                    <div>
                      <Label className="text-white/70 text-sm">Budget Max (INR)</Label>
                      <Input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        placeholder="25000"
                        className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-white/70 text-sm">Application Limit (max creators)</Label>
                  <Input
                    type="number"
                    value={appLimit}
                    onChange={(e) => setAppLimit(e.target.value)}
                    placeholder="30"
                    className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30"
                  />
                </div>

                {/* Summary preview */}
                <div className="glass rounded-xl p-3 space-y-2 border border-neutral-800">
                  <div className="text-xs text-white/40 uppercase tracking-wide">Campaign Summary</div>
                  <div className="text-sm font-semibold">{title || 'Untitled Campaign'}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNiches.slice(0, 3).map((n) => {
                      const cat = CATEGORIES.find((c) => c.id === n);
                      return cat ? (
                        <Badge key={n} variant="secondary" className="bg-white/10 text-white/70 border-0 text-[10px]">
                          {cat.name}
                        </Badge>
                      ) : null;
                    })}
                    {selectedNiches.length > 3 && (
                      <Badge variant="secondary" className="bg-white/10 text-white/50 border-0 text-[10px]">
                        +{selectedNiches.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{TIER_OPTIONS.find((t) => t.value === tier)?.label}</span>
                    {minReachScore > 0 && <span className="flex items-center gap-1"><Trophy className="h-3 w-3" />{minReachScore}+ RS</span>}
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{minEr.toFixed(1)}% ER</span>
                    {dealType !== 'barter' && budgetMin && (
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Rs.{budgetMin}{budgetMax ? `-${budgetMax}` : ''}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50">
                    <span className="text-white/40">Deliverables: </span>
                    {buildDeliverablesString()}
                    {deliverablesNote.trim() && <span className="text-white/40"> ({deliverablesNote.trim()})</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-neutral-800 bg-white/5 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className={`flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 ${
                    !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed()}
                  className={`flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 ${
                    (submitting || !canProceed()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Publishing...' : (<><Sparkles className="h-4 w-4 mr-1.5" />Publish Campaign</>)}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
