/*
  # F3: Remove delete rights from public clients

  Every table granted DELETE to `anon`/`authenticated` under an always-true
  policy, letting anyone wipe the leaderboard, campaigns and enquiries with the
  public key that ships in the browser bundle.

  No application code deletes any of these tables. The only `.delete()` calls in
  the source target `media`, during Instagram profile sync, so `media` keeps its
  delete right and is left untouched.

  1. Drops the permissive DELETE policies that allowed unrestricted deletes.
  2. Revokes the DELETE privilege itself, so the `FOR ALL` policies on
     reach_scores / cohort_benchmarks / creator_metrics can no longer be used to
     delete either.
*/

DROP POLICY IF EXISTS "anon_delete_creators" ON creators;
DROP POLICY IF EXISTS "anon_delete_brand_deals" ON brand_deals;
DROP POLICY IF EXISTS "anon_delete_brand_apps" ON brand_applications;
DROP POLICY IF EXISTS "anon_delete_inquiries" ON brand_inquiries;

REVOKE DELETE ON creators FROM anon, authenticated;
REVOKE DELETE ON brand_deals FROM anon, authenticated;
REVOKE DELETE ON brand_applications FROM anon, authenticated;
REVOKE DELETE ON brand_inquiries FROM anon, authenticated;
REVOKE DELETE ON reach_scores FROM anon, authenticated;
REVOKE DELETE ON cohort_benchmarks FROM anon, authenticated;
REVOKE DELETE ON creator_metrics FROM anon, authenticated;
