import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabase, getAuthenticatedUserId } from '@/lib/supabase-server';
import { CampaignDashboard } from '@/components/brand/CampaignDashboard';
import type { BrandDeal } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getCampaign(supabase: ReturnType<typeof createServerSupabase>, campaignId: string, brandId: string): Promise<BrandDeal | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('brand_deals')
    .select('*')
    .eq('id', campaignId)
    .eq('brand_id', brandId)
    .maybeSingle();
  return (data as BrandDeal) || null;
}

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const userId = await getAuthenticatedUserId(cookieStore);
  if (!userId) {
    redirect('/login?redirect=/brand/campaigns');
  }

  const supabase = createServerSupabase(cookieStore);
  if (!supabase) {
    redirect('/login?redirect=/brand/campaigns');
  }

  const campaign = await getCampaign(supabase, params.id, userId);
  if (!campaign) {
    redirect('/brand/campaigns?error=not_found');
  }

  return <CampaignDashboard campaignId={params.id} />;
}
