'use client';

import { useState } from 'react';
import { Send, Mail, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import type { Creator } from '@/lib/types';

interface BrandInquiryFormProps {
  creator: Creator;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandInquiryForm({ creator, open, onOpenChange }: BrandInquiryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    brand_name: '',
    contact_email: '',
    budget_inr: '',
    barter_details: '',
    deliverables: '',
    timeline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('brand_inquiries').insert({
        creator_id: creator.id,
        brand_name: form.brand_name.trim().slice(0, 100),
        contact_email: form.contact_email.trim().slice(0, 255),
        budget_inr: form.budget_inr ? parseFloat(form.budget_inr) : null,
        barter_details: form.barter_details?.trim().slice(0, 500) || null,
        deliverables: form.deliverables.trim().slice(0, 1000),
        timeline: form.timeline?.trim().slice(0, 200) || null,
        status: 'new',
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const dmLink = `https://ig.me/m/${creator.username}`;
  const waLink = creator.whatsapp_number
    ? `https://wa.me/${creator.whatsapp_number}?text=Hi%20${encodeURIComponent(creator.username)},%20we%20saw%20your%20verified%20profile%20on%20ReachBoard%20and%20would%20love%20to%20collaborate%20on%20a%20campaign!`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#0B0F17] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl font-bold">
            Brand Inquiry for @{creator.username}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Send className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Proposal Sent!</h3>
            <p className="text-white/60 text-sm">
              Your inquiry has been submitted. {creator.full_name || creator.username} will be notified.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                onOpenChange(false);
              }}
              className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <a href={dmLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram DM
                </Button>
              </a>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              )}
              {creator.contact_email && (
                <a href={`mailto:${creator.contact_email}`} className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </a>
              )}
            </div>

            <div className="h-px bg-white/10" />

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/70">Brand Name *</Label>
                  <Input
                    required
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Acme Brands"
                  />
                </div>
                <div>
                  <Label className="text-white/70">Contact Email *</Label>
                  <Input
                    required
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="brand@acme.com"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/70">Campaign Budget (INR)</Label>
                <Input
                  type="number"
                  value={form.budget_inr}
                  onChange={(e) => setForm({ ...form, budget_inr: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="50000"
                />
              </div>
              <div>
                <Label className="text-white/70">Barter Details (if applicable)</Label>
                <Input
                  value={form.barter_details}
                  onChange={(e) => setForm({ ...form, barter_details: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Product + ₹10,000"
                />
              </div>
              <div>
                <Label className="text-white/70">Deliverables *</Label>
                <Textarea
                  required
                  value={form.deliverables}
                  onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                  placeholder="1 Reel + 2 Stories with link sticker"
                />
              </div>
              <div>
                <Label className="text-white/70">Timeline</Label>
                <Input
                  value={form.timeline}
                  onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="2 weeks from confirmation"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : 'Submit Proposal'}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Instagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
