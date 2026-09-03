/*
  # Enforce the campaign application limit reliably

  The previous migration put the application count inside the INSERT policy, but
  a subquery on the policy's own table is filtered by that table's SELECT policy,
  so an applicant would only ever count their own rows and the limit would not
  bind. Move the limit into a BEFORE INSERT trigger that runs with definer
  rights, and keep the policy focused on identity, campaign state and
  eligibility.

  1. Trigger
     - public.enforce_application_limit(): raises when the target deal already
       holds application_limit applications. SECURITY DEFINER with a pinned
       search_path; EXECUTE is revoked from client roles so it can only run as
       part of the trigger.

  2. Policy
     - Recreate insert_brand_apps_creator without the self-referencing count.
*/

CREATE OR REPLACE FUNCTION public.enforce_application_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT COALESCE(bd.application_limit, 30) INTO v_limit
    FROM public.brand_deals bd
   WHERE bd.id = NEW.deal_id;

  IF v_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_count
    FROM public.brand_applications ba
   WHERE ba.deal_id = NEW.deal_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'This campaign is no longer accepting applications';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_application_limit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_application_limit() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_application_limit() FROM authenticated;

DROP TRIGGER IF EXISTS trg_enforce_application_limit ON public.brand_applications;
CREATE TRIGGER trg_enforce_application_limit
  BEFORE INSERT ON public.brand_applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_application_limit();

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
    )
  );
