/*
  # Restrict which application columns each side may write

  `insert_brand_apps_creator` only checks that the applicant is the caller's own
  creator; INSERT was granted on every column, so an applicant could submit a
  row already marked accepted, staged as won, and carrying a self-chosen counter
  offer. Those three columns are the brand's decision fields and all have safe
  defaults ('pending', 'new', NULL).

  1. Privileges
     - Revoke table-wide INSERT/UPDATE on public.brand_applications from anon, authenticated
     - Re-grant INSERT (deal_id, creator_id, pitch_quote) to authenticated
     - Re-grant UPDATE (status, stage, counter_offer) to authenticated; the
       existing UPDATE policy already limits updates to the owning brand and the
       applicant creator
*/

REVOKE INSERT, UPDATE ON public.brand_applications FROM anon;
REVOKE INSERT, UPDATE ON public.brand_applications FROM authenticated;

GRANT INSERT (deal_id, creator_id, pitch_quote) ON public.brand_applications TO authenticated;
GRANT UPDATE (status, stage, counter_offer) ON public.brand_applications TO authenticated;
