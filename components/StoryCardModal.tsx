'use client';

import { useState, useCallback } from 'react';
import { Download, Share2, X, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Creator } from '@/lib/types';

interface StoryCardModalProps {
  creator: Creator;
  nationalRank: number;
  stateRank: number;
  timeframe: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

async function fetchSvgAsImage(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to generate');
  const svgText = await res.text();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG'));
    };
    img.src = svgUrl;
  });
}

async function renderToPng(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.fillStyle = '#0B0F17';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export PNG'));
      },
      'image/png',
      1.0
    );
  });
}

export function StoryCardModal({
  creator,
  nationalRank,
  stateRank,
  timeframe,
  open,
  onOpenChange,
}: StoryCardModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const storyUrl = `/api/og/story?username=${encodeURIComponent(creator.username)}&t=${encodeURIComponent(timeframe)}`;

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const img = await fetchSvgAsImage(storyUrl);
      const blob = await renderToPng(img);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reachboard-${creator.username}-story.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(storyUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  }, [storyUrl, creator.username]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const img = await fetchSvgAsImage(storyUrl);
      const blob = await renderToPng(img);
      const file = new File([blob], `reachboard-${creator.username}.png`, { type: 'image/png' });

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: `Check out ${creator.username}'s ranking on ReachBoard India!`,
          });
          return;
        }
        await navigator.share({
          text: `Check out ${creator.username}'s ranking on ReachBoard India! ${window.location.origin}/creator/${creator.username}`,
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/creator/${creator.username}`);
      } catch {
        // ignore
      }
    }
    setSharing(false);
  }, [storyUrl, creator.username]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden bg-[#0B0F17] border-white/10">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center gradient-text text-lg font-bold">
            Your Story Card is Ready
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="px-4 pb-4">
          <div className="relative mx-auto" style={{ maxWidth: 270 }}>
            <div className="gradient-border rounded-2xl overflow-hidden">
              <img
                src={storyUrl}
                alt="Story Card"
                className="w-full block"
                style={{ aspectRatio: '9/16' }}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Generating...' : 'Download PNG'}
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing}
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
          <p className="text-xs text-white/40 text-center mt-3 flex items-center justify-center gap-1">
            <Instagram className="h-3 w-3" />
            1080 x 1920 PNG - Share directly to your Instagram Story
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
