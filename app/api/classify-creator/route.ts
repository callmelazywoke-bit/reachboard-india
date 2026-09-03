import { NextResponse } from 'next/server';
import { classifyCreator } from '@/lib/classifier';
import { rateLimit, getClientIP, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return rateLimitResponse(limit.remaining, limit.resetAt);
  }

  try {
    const body = await request.json();
    const { bio, metaCategory, captions } = body as {
      bio?: string;
      metaCategory?: string;
      captions?: string[];
    };

    if (bio && typeof bio !== 'string') {
      return NextResponse.json({ error: 'Invalid bio' }, { status: 400 });
    }
    if (metaCategory && typeof metaCategory !== 'string') {
      return NextResponse.json({ error: 'Invalid metaCategory' }, { status: 400 });
    }
    if (captions && (!Array.isArray(captions) || captions.some((c) => typeof c !== 'string'))) {
      return NextResponse.json({ error: 'Invalid captions' }, { status: 400 });
    }

    const result = classifyCreator({
      bio: bio?.slice(0, 2000),
      metaCategory: metaCategory?.slice(0, 100),
      captions: captions?.map((c) => c.slice(0, 5000)).slice(0, 50),
    });

    return NextResponse.json({
      category: result.category,
      confidenceScore: result.confidenceScore,
      nicheBadge: result.nicheBadge,
      badgeLabel:
        result.nicheBadge === 'verified_specialist'
          ? 'Verified Niche Specialist'
          : 'Emerging Creator',
    });
  } catch {
    return NextResponse.json(
      { error: 'Classification failed' },
      { status: 500 }
    );
  }
}
