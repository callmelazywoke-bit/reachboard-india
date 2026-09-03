'use client';

import { useState } from 'react';
import { Pencil, Check, X, TrendingUp, Film, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getEffectiveRateCard, formatINR, computeRateCard } from '@/lib/rateCard';
import type { Creator, RateCard } from '@/lib/types';

interface RateCardCalculatorProps {
  creator: Creator;
  editable?: boolean;
  onSaveCustomRates?: (rates: Partial<RateCard>) => void;
}

export function RateCardCalculator({ creator, editable = false, onSaveCustomRates }: RateCardCalculatorProps) {
  const [editing, setEditing] = useState(false);
  const effective = getEffectiveRateCard(creator);
  const computed = computeRateCard(creator);
  const hasCustom = creator.custom_rates && Object.keys(creator.custom_rates).length > 0;

  const [customRates, setCustomRates] = useState({
    dedicated_reel_low: hasCustom && creator.custom_rates?.dedicated_reel ? creator.custom_rates.dedicated_reel[0].toString() : '',
    dedicated_reel_high: hasCustom && creator.custom_rates?.dedicated_reel ? creator.custom_rates.dedicated_reel[1].toString() : '',
    story_set_low: hasCustom && creator.custom_rates?.story_set ? creator.custom_rates.story_set[0].toString() : '',
    story_set_high: hasCustom && creator.custom_rates?.story_set ? creator.custom_rates.story_set[1].toString() : '',
    ugc_barter_low: hasCustom && creator.custom_rates?.ugc_barter ? creator.custom_rates.ugc_barter[0].toString() : '',
    ugc_barter_high: hasCustom && creator.custom_rates?.ugc_barter ? creator.custom_rates.ugc_barter[1].toString() : '',
  });

  const handleSave = () => {
    const rates: Partial<RateCard> = {};
    if (customRates.dedicated_reel_low && customRates.dedicated_reel_high) {
      rates.dedicated_reel = [parseInt(customRates.dedicated_reel_low), parseInt(customRates.dedicated_reel_high)];
    }
    if (customRates.story_set_low && customRates.story_set_high) {
      rates.story_set = [parseInt(customRates.story_set_low), parseInt(customRates.story_set_high)];
    }
    if (customRates.ugc_barter_low && customRates.ugc_barter_high) {
      rates.ugc_barter = [parseInt(customRates.ugc_barter_low), parseInt(customRates.ugc_barter_high)];
    }
    onSaveCustomRates?.(rates);
    setEditing(false);
  };

  const cards = [
    {
      icon: Film,
      label: '1x Dedicated Instagram Reel',
      key: 'dedicated_reel' as const,
      color: 'from-violet-500/20 to-violet-600/10',
      iconColor: 'text-violet-400',
    },
    {
      icon: ImageIcon,
      label: '2x Story Set with Link Sticker',
      key: 'story_set' as const,
      color: 'from-pink-500/20 to-pink-600/10',
      iconColor: 'text-pink-400',
    },
    {
      icon: TrendingUp,
      label: 'Integrated UGC / Barter Baseline',
      key: 'ugc_barter' as const,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
    },
  ];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">Algorithmic Rate Card</h3>
          <p className="text-xs text-white/50">Auto-estimated based on followers, ER%, and reel views</p>
        </div>
        {editable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(!editing)}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editing ? 'Cancel' : 'Edit Custom Rates'}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {cards.map((card) => (
            <div key={card.key} className="space-y-2">
              <Label className="text-white/70 text-sm flex items-center gap-2">
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                {card.label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={computed[card.key][0].toString()}
                  value={customRates[`${card.key}_low` as keyof typeof customRates]}
                  onChange={(e) => setCustomRates({ ...customRates, [`${card.key}_low`]: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <span className="text-white/40">—</span>
                <Input
                  type="number"
                  placeholder={computed[card.key][1].toString()}
                  value={customRates[`${card.key}_high` as keyof typeof customRates]}
                  onChange={(e) => setCustomRates({ ...customRates, [`${card.key}_high`]: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
                <span className="text-white/40 text-sm whitespace-nowrap">INR</span>
              </div>
            </div>
          ))}
          <Button onClick={handleSave} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">
            <Check className="h-4 w-4 mr-2" />
            Save Custom Rates
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => {
            const [low, high] = effective[card.key];
            return (
              <div
                key={card.key}
                className={`bg-gradient-to-r ${card.color} rounded-xl p-4 border border-white/10 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
                    <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-white/90">{card.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {formatINR(low)} – {formatINR(high)}
                  </div>
                  {hasCustom && creator.custom_rates?.[card.key] && (
                    <div className="text-xs text-violet-400">Custom rate</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
