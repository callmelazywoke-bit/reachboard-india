/*
  # Enforce campaign state, eligibility and application limit on insert

  Eligibility was computed only in the browser (BrandDealsHub.checkEligibility)
  and the button was merely disabled, so a direct API call could apply to a
  paused or filled campaign, or to one whose follower / engagement / reach
  requirements the creator does not meet.

  1. Policy
     - Replace `insert_brand_apps_creator` so the WITH CHECK additionally
       requires:
         * the target deal exists and its status is 'active'
         * the applicant's followers_count >= deal.min_followers
         * the applicant's engagement_rate >= deal.min_engagement_rate
         * the applicant's latest reach_score >= deal.min_reach_score
           (treated as 0 when the creator has no score row yet, matching the
           current UI which does not require one)
         * the number of applications already on the deal is below
           deal.application_limit

  This mirrors exactly what the interface already allows, so no legitimate
  application is refused.
*/

DROP POLICY IF EXISTS insert_brand_apps_creator ON public.brand_applications;

CREATE POLICY insert_brand_apps_creator
  ON public.brand_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'creator'
        AND p.creator_id = brand_applications.creator_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.brand_deals bd
      JOIN public.creators c ON c.id = brand_applications.creator_id
      WHERE bd.id = brand_applications.deal_id
        AND bd.status = 'active'
        AND COALESCE(c.followers_count, 0) >= COALESCE(bd.min_followers, 0)
        AND COALESCE(c.engagement_rate, 0) >= COALESCE(bd.min_engagement_rate, 0)
        AND COALESCE(
              (SELECT rs.reach_score
                 FROM public.reach_scores rs
                WHERE rs.creator_id = brand_applications.creator_id
                ORDER BY rs.calculated_at DESC NULLS LAST
                LIMIT 1),
              0
            ) >= COALESCE(bd.min_reach_score, 0)
        AND (
          SELECT count(*)
            FROM public.brand_applications existing
           WHERE existing.deal_id = brand_applications.deal_id
        ) < COALESCE(bd.application_limit, 30)
    )
  );
