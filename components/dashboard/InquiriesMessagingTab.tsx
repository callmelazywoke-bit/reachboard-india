'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, CheckCircle2, XCircle, Send, DollarSign, FileText,
  Building2, BadgeCheck, Clock, ArrowLeft, MessageSquare,
  Handshake, AlertCircle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { formatINR } from '@/lib/rateCard';
import type { BrandInquiry } from '@/lib/types';

type DealStatus = 'PROPOSED' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED';

interface ChatMessage {
  id: string;
  sender: 'brand' | 'creator';
  text: string;
  timestamp: string;
}

interface Thread {
  id: string;
  inquiryId: string;
  brandName: string;
  brandLogoUrl: string | null;
  campaignTitle: string;
  isVerifiedBrand: boolean;
  status: DealStatus;
  offeredBudget: number;
  deliverables: string;
  lastActivity: string;
  messages: ChatMessage[];
}

const MOCK_THREADS: Thread[] = [
  {
    id: 't1',
    inquiryId: 'mock-1',
    brandName: 'DentalCare India',
    brandLogoUrl: null,
    campaignTitle: 'Smile Bright Teeth Whitening Launch',
    isVerifiedBrand: true,
    status: 'PROPOSED',
    offeredBudget: 18000,
    deliverables: '1 Dedicated Reel + 2 Stories',
    lastActivity: '2h ago',
    messages: [
      {
        id: 'm1',
        sender: 'brand',
        text: 'Hi! We came across your profile on ReachBoard and love your dental content. We are launching a new teeth whitening kit and think you would be a perfect fit.',
        timestamp: '2h ago',
      },
      {
        id: 'm2',
        sender: 'brand',
        text: 'We are offering ₹18,000 for 1 dedicated reel + 2 story posts. The campaign goes live next month. Let us know if you are interested!',
        timestamp: '2h ago',
      },
    ],
  },
  {
    id: 't2',
    inquiryId: 'mock-2',
    brandName: 'TechGadget Hub',
    brandLogoUrl: null,
    campaignTitle: 'Smart Home Gadgets Showcase',
    isVerifiedBrand: true,
    status: 'NEGOTIATING',
    offeredBudget: 25000,
    deliverables: '1 Integrated Reel + 1 Story',
    lastActivity: '5h ago',
    messages: [
      {
        id: 'm3',
        sender: 'brand',
        text: 'Hey! We would love to collaborate on our smart home gadget lineup. Budget is ₹25,000 for an integrated reel plus a story.',
        timestamp: '5h ago',
      },
      {
        id: 'm4',
        sender: 'creator',
        text: 'Thanks for reaching out! The offer sounds interesting. Could we discuss a slightly higher rate given the product category? My usual integrated reel rate is around ₹30,000.',
        timestamp: '4h ago',
      },
      {
        id: 'm5',
        sender: 'brand',
        text: 'We can meet at ₹28,000 if you can also add a link sticker in the story. Does that work for you?',
        timestamp: '3h ago',
      },
    ],
  },
  {
    id: 't3',
    inquiryId: 'mock-3',
    brandName: 'GlowUp Skincare',
    brandLogoUrl: null,
    campaignTitle: 'Vitamin C Serum Launch Campaign',
    isVerifiedBrand: false,
    status: 'PROPOSED',
    offeredBudget: 12000,
    deliverables: '2 Stories + 1 Reel',
    lastActivity: '1d ago',
    messages: [
      {
        id: 'm6',
        sender: 'brand',
        text: 'Hello! We are a new skincare brand launching our Vitamin C serum. We would love to send you the product and collaborate on content.',
        timestamp: '1d ago',
      },
      {
        id: 'm7',
        sender: 'brand',
        text: 'Offering ₹12,000 for 2 stories and 1 reel. We can also send you the full product range as a gift!',
        timestamp: '1d ago',
      },
    ],
  },
  {
    id: 't4',
    inquiryId: 'mock-4',
    brandName: 'FitFuel Nutrition',
    brandLogoUrl: null,
    campaignTitle: 'Protein Bar Sampling Campaign',
    isVerifiedBrand: true,
    status: 'ACCEPTED',
    offeredBudget: 22000,
    deliverables: '1 Dedicated Reel + 3 Stories',
    lastActivity: '2d ago',
    messages: [
      {
        id: 'm8',
        sender: 'brand',
        text: 'Hi! We love your fitness content. We are launching our new protein bar line and would love to collaborate.',
        timestamp: '2d ago',
      },
      {
        id: 'm9',
        sender: 'creator',
        text: 'This sounds great! I am happy to proceed with the offer of ₹22,000 for 1 reel + 3 stories.',
        timestamp: '2d ago',
      },
      {
        id: 'm10',
        sender: 'brand',
        text: 'Wonderful! We will send over the brief and product samples this week. Excited to work with you!',
        timestamp: '2d ago',
      },
    ],
  },
  {
    id: 't5',
    inquiryId: 'mock-5',
    brandName: 'UrbanThreads Fashion',
    brandLogoUrl: null,
    campaignTitle: 'Winter Collection Lookbook',
    isVerifiedBrand: false,
    status: 'DECLINED',
    offeredBudget: 8000,
    deliverables: '1 Story Set',
    lastActivity: '3d ago',
    messages: [
      {
        id: 'm11',
        sender: 'brand',
        text: 'Hi, we would like to collaborate on our winter collection. Offering ₹8,000 for a story set.',
        timestamp: '3d ago',
      },
      {
        id: 'm12',
        sender: 'creator',
        text: 'Thank you for the offer, but unfortunately the budget does not align with my current rates for this scope. Wishing you the best with the campaign!',
        timestamp: '3d ago',
      },
    ],
  },
];

const STATUS_STYLES: Record<DealStatus, string> = {
  PROPOSED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  NEGOTIATING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  ACCEPTED: 'bg-green-500/20 text-green-300 border-green-500/30',
  DECLINED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function relativeTimestamp(): string {
  return 'just now';
}

interface InquiriesMessagingTabProps {
  inquiries: BrandInquiry[];
}

export function InquiriesMessagingTab({ inquiries }: InquiriesMessagingTabProps) {
  const [threads, setThreads] = useState<Thread[]>(() => {
    const dbThreads: Thread[] = inquiries.map((inq, idx) => ({
      id: `db-${inq.id}`,
      inquiryId: inq.id,
      brandName: inq.brand_name,
      brandLogoUrl: null,
      campaignTitle: inq.deliverables || 'Brand Collaboration',
      isVerifiedBrand: false,
      status: inq.status === 'accepted' ? 'ACCEPTED' : inq.status === 'declined' ? 'DECLINED' : 'PROPOSED',
      offeredBudget: inq.budget_inr || 0,
      deliverables: inq.deliverables || 'To be discussed',
      lastActivity: 'recent',
      messages: [
        {
          id: `dbm-${inq.id}`,
          sender: 'brand' as const,
          text: inq.timeline || `Hi! We would love to collaborate with you. Budget: ${inq.budget_inr ? formatINR(inq.budget_inr) : 'TBD'}.`,
          timestamp: 'recent',
        },
      ],
    }));
    return [...dbThreads, ...MOCK_THREADS];
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [negotiationBudget, setNegotiationBudget] = useState('');
  const [negotiationDeliverables, setNegotiationDeliverables] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages.length]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(
      (t) =>
        t.brandName.toLowerCase().includes(q) ||
        t.campaignTitle.toLowerCase().includes(q)
    );
  }, [threads, searchQuery]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeThread) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      text: messageInput.trim(),
      timestamp: relativeTimestamp(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, newMsg], lastActivity: 'just now' }
          : t
      )
    );
    setMessageInput('');
  };

  const updateThreadStatus = (threadId: string, status: DealStatus) => {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, status } : t)));
  };

  const handleAccept = () => {
    if (!activeThread) return;
    updateThreadStatus(activeThread.id, 'ACCEPTED');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      text: 'I am happy to accept this brief! Looking forward to working together. Please send over the detailed brief and any brand guidelines.',
      timestamp: relativeTimestamp(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, newMsg], lastActivity: 'just now' }
          : t
      )
    );
  };

  const handleDecline = () => {
    if (!activeThread) return;
    updateThreadStatus(activeThread.id, 'DECLINED');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      text: 'Thank you for the offer, but unfortunately I will have to pass on this one. Wishing you the best with the campaign!',
      timestamp: relativeTimestamp(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, messages: [...t.messages, newMsg], lastActivity: 'just now' }
          : t
      )
    );
  };

  const openNegotiation = () => {
    if (!activeThread) return;
    setNegotiationBudget(activeThread.offeredBudget.toString());
    setNegotiationDeliverables(activeThread.deliverables);
    setNegotiationOpen(true);
  };

  const submitNegotiation = () => {
    if (!activeThread || !negotiationBudget.trim()) return;
    const counterBudget = parseInt(negotiationBudget);
    updateThreadStatus(activeThread.id, 'NEGOTIATING');
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'creator',
      text: `I would like to propose a counter-offer: ${formatINR(counterBudget)} for ${negotiationDeliverables || activeThread.deliverables}. Let me know if that works for you!`,
      timestamp: relativeTimestamp(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              status: 'NEGOTIATING',
              offeredBudget: counterBudget,
              deliverables: negotiationDeliverables || t.deliverables,
              messages: [...t.messages, newMsg],
              lastActivity: 'just now',
            }
          : t
      )
    );
    setNegotiationOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-violet-400" />
          Inquiries & Brand Messaging
        </h3>
        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
          {threads.length} conversations
        </Badge>
      </div>

      <div className="glass rounded-2xl border border-neutral-800 overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Left Sidebar - Threads List */}
          <div className="w-full md:w-[320px] border-r border-neutral-800 flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-neutral-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brand or campaign..."
                  className="pl-9 bg-white/5 border-neutral-800 text-white placeholder:text-white/30 text-sm"
                />
              </div>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center text-white/30 text-sm">
                  No conversations found.
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-3 border-b border-neutral-800/50 transition-all hover:bg-white/5 ${
                      activeThreadId === thread.id ? 'bg-violet-600/10 border-l-2 border-l-violet-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {thread.brandLogoUrl ? (
                          <img src={thread.brandLogoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <Building2 className="h-5 w-5 text-violet-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">{thread.brandName}</span>
                          <span className="text-[10px] text-white/30 flex-shrink-0">{thread.lastActivity}</span>
                        </div>
                        <div className="text-xs text-white/50 truncate">{thread.campaignTitle}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge className={`${STATUS_STYLES[thread.status]} border text-[9px] px-1.5 py-0`}>
                            {thread.status}
                          </Badge>
                          {thread.offeredBudget > 0 && (
                            <span className="text-[10px] text-green-400 font-medium flex items-center gap-0.5">
                              <DollarSign className="h-2.5 w-2.5" />
                              {formatINR(thread.offeredBudget)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Main Chat Area */}
          <div className="hidden md:flex flex-1 flex-col">
            {!activeThread ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/30 space-y-3">
                <MessageSquare className="h-12 w-12" />
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {activeThread.brandLogoUrl ? (
                        <img src={activeThread.brandLogoUrl} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <Building2 className="h-6 w-6 text-violet-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{activeThread.brandName}</span>
                        {activeThread.isVerifiedBrand && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 border text-[10px] flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            Verified Brand
                          </Badge>
                        )}
                        <Badge className={`${STATUS_STYLES[activeThread.status]} border text-[10px]`}>
                          {activeThread.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-white/50 truncate">{activeThread.campaignTitle}</div>
                    </div>
                  </div>

                  {/* Campaign Terms Banner */}
                  <div className="glass rounded-xl p-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-white/40">Offered Budget:</span>
                      <span className="font-bold text-green-400">{formatINR(activeThread.offeredBudget)}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-700" />
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-violet-400" />
                      <span className="text-xs text-white/40">Deliverables:</span>
                      <span className="text-sm font-medium">{activeThread.deliverables}</span>
                    </div>
                  </div>

                  {/* Deal Action Buttons */}
                  {(activeThread.status === 'PROPOSED' || activeThread.status === 'NEGOTIATING') && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={handleAccept}
                        className="bg-green-600 hover:bg-green-500 text-white border-0 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Accept Brief
                      </Button>
                      <Button
                        size="sm"
                        onClick={openNegotiation}
                        className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 text-xs"
                      >
                        <Handshake className="h-3.5 w-3.5 mr-1" />
                        Propose Rate / Terms
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDecline}
                        className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  {activeThread.status === 'ACCEPTED' && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Deal accepted — you can continue the conversation below.
                    </div>
                  )}
                  {activeThread.status === 'DECLINED' && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      This deal has been declined.
                    </div>
                  )}
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeThread.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'creator' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          msg.sender === 'creator'
                            ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                            : 'bg-white/10 text-white/90 border border-neutral-800'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                          msg.sender === 'creator' ? 'text-white/60' : 'text-white/30'
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t border-neutral-800">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a reply..."
                      className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile thread view */}
      {activeThread && (
        <div className="md:hidden fixed inset-0 z-50 bg-neutral-950 flex flex-col">
          <div className="p-3 border-b border-neutral-800 flex items-center gap-2">
            <button onClick={() => setActiveThreadId(null)} className="text-white/50 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="font-bold text-sm truncate">{activeThread.brandName}</span>
            <Badge className={`${STATUS_STYLES[activeThread.status]} border text-[9px] ml-auto`}>
              {activeThread.status}
            </Badge>
          </div>
          <div className="p-3 border-b border-neutral-800">
            <div className="glass rounded-xl p-2.5 flex items-center gap-3 flex-wrap text-xs">
              <span className="text-green-400 font-bold">{formatINR(activeThread.offeredBudget)}</span>
              <span className="text-white/50">{activeThread.deliverables}</span>
            </div>
            {(activeThread.status === 'PROPOSED' || activeThread.status === 'NEGOTIATING') && (
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" onClick={handleAccept} className="bg-green-600 text-white border-0 text-xs flex-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" />Accept
                </Button>
                <Button size="sm" onClick={openNegotiation} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 text-xs flex-1">
                  <Handshake className="h-3 w-3 mr-1" />Counter
                </Button>
                <Button size="sm" variant="outline" onClick={handleDecline} className="border-red-500/30 bg-red-500/10 text-red-300 text-xs">
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeThread.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'creator' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  msg.sender === 'creator'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                    : 'bg-white/10 text-white/90 border border-neutral-800'
                }`}>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                  <div className={`text-[9px] mt-0.5 ${msg.sender === 'creator' ? 'text-white/60' : 'text-white/30'}`}>{msg.timestamp}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 border-t border-neutral-800">
            <div className="flex gap-1.5">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Reply..."
                className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 text-sm h-9"
              />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0 h-9 px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      <Dialog open={negotiationOpen} onOpenChange={setNegotiationOpen}>
        <DialogContent className="max-w-[440px] bg-neutral-950 border-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-violet-400" />
              Propose Counter-Offer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="glass rounded-xl p-3 text-sm space-y-1">
              <div className="flex items-center gap-1.5 text-white/50">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                Current Offer: <span className="text-green-400 font-bold">{formatINR(activeThread?.offeredBudget || 0)}</span>
              </div>
              <div className="text-white/50 text-xs">{activeThread?.deliverables}</div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Your Counter-Budget (₹ INR) *</label>
              <Input
                type="number"
                value={negotiationBudget}
                onChange={(e) => setNegotiationBudget(e.target.value)}
                placeholder="25000"
                className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Custom Deliverables Note</label>
              <Textarea
                value={negotiationDeliverables}
                onChange={(e) => setNegotiationDeliverables(e.target.value)}
                rows={3}
                placeholder="e.g., 1 Dedicated Reel + 2 Stories with link sticker"
                className="bg-white/5 border-neutral-800 text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={submitNegotiation}
                disabled={!negotiationBudget.trim()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Send Counter-Offer
              </Button>
              <Button
                variant="outline"
                onClick={() => setNegotiationOpen(false)}
                className="border-neutral-800 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
