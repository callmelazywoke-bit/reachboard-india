import { CATEGORIES } from './categories';
import type { Category } from './types';

export interface ClassificationResult {
  category: Category;
  confidenceScore: number;
  nicheBadge: 'verified_specialist' | 'emerging_creator';
}

export function classifyCreator(input: {
  bio?: string;
  metaCategory?: string;
  captions?: string[];
}): ClassificationResult {
  const text = [input.bio, input.metaCategory, ...(input.captions || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let bestCategory: Category | null = null;
  let bestScore = 0;

  for (const category of CATEGORIES) {
    let score = 0;
    for (const keyword of category.keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) score += matches.length * 2;
    }
    for (const hashtag of category.hashtags) {
      if (text.includes(hashtag.toLowerCase())) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  const confidenceScore = Math.min(bestScore * 5, 100);
  const nicheBadge = confidenceScore > 60 ? 'verified_specialist' : 'emerging_creator';

  if (!bestCategory) {
    bestCategory = CATEGORIES[0];
  }

  return {
    category: bestCategory,
    confidenceScore,
    nicheBadge,
  };
}
