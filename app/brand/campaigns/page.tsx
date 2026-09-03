import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabase, getAuthenticatedUserId } from '@/lib/supabase-server';
import { BrandCampaignsClient } from '@/components/brand/BrandCampaignsClient';
import type { BrandDeal } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getProfile(supabase: ReturnType<typeof createServerSupabase>, userId: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('role, creator_id, display_name')
    .eq('id', userId)
    .maybeSingle();
  return data as { role: string; creator_id: string | null; display_name: string | null } | null;
}

async function getBrandCampaigns(supabase: ReturnType<typeof createServerSupabase>, brandId: string): Promise<BrandDeal[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });
  return (data as BrandDeal[]) || [];
}

export default async function BrandCampaignsPage() {
  const cookieStore = cookies();
  const userId = await getAuthenticatedUserId(cookieStore);
  if (!userId) {
    redirect('/login?redirect=/brand/campaigns');
  }

  const supabase = createServerSupabase(cookieStore);
  if (!supabase) {
    redirect('/login?redirect=/brand/campaigns');
  }

  const profile = await getProfile(supabase, userId);
  if (!profile) {
    redirect('/login?redirect=/brand/campaigns&error=no_profile');
  }

  if (profile.role === 'creator') {
    redirect('/dashboard');
  }

  const campaigns = await getBrandCampaigns(supabase, userId);

  return <BrandCampaignsClient campaigns={campaigns} displayName={profile.display_name || 'Brand'} />;
}
