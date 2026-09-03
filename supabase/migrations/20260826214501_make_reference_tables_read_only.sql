/*
  # F7: Make benchmark and metrics data read-only for public clients

  `cohort_benchmarks` holds the cohort medians every ReachScore is divided by,
  and `creator_metrics` is not touched by the application at all. Both carried a
  `FOR ALL` policy to `anon, authenticated` with `USING (true) WITH CHECK (true)`,
  so anyone could rewrite the benchmarks and shift every creator's score.

  The application only ever reads `cohort_benchmarks` (during Instagram profile
  sync) and never reads or writes `creator_metrics`, so removing write access
  changes no working behaviour.

  Also revokes UPDATE on `brand_inquiries`: nothing in the source updates an
  enquiry row, but the grant let anyone rewrite a brand's budget or terms.
*/

DROP POLICY IF EXISTS "public_write_cohort_benchmarks" ON cohort_benchmarks;
DROP POLICY IF EXISTS "public_write_creator_metrics" ON creator_metrics;

REVOKE INSERT, UPDATE ON cohort_benchmarks FROM anon, authenticated;
REVOKE INSERT, UPDATE ON creator_metrics FROM anon, authenticated;

DROP POLICY IF EXISTS "anon_update_inquiries" ON brand_inquiries;
REVOKE UPDATE ON brand_inquiries FROM anon, authenticated;
