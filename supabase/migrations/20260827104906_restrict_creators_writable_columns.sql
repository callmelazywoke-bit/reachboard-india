/*
  # Restrict which creator columns the owner may write

  `update_creators_own` correctly limits a creator to their own row, but a row
  rule permits every column of that row. The audience metrics are the value of
  the product (the leaderboard ranks on them and brand campaigns gate eligibility
  on them), and `username` / `instagram_id` are identifiers used for public
  profile routing and for matching the Instagram sync.

  1. Privileges
     - Revoke table-wide UPDATE on public.creators from anon, authenticated
     - Re-grant UPDATE only on the settings the dashboard actually saves:
         collab_status, whatsapp_number, contact_email, custom_rates, updated_at
     - followers_count, engagement_rate, reel_views_30d, median_reel_views_30d,
       avg_likes, avg_comments, is_verified, media_count, rate_card, top_media,
       category_id, niche_badge, state, username and instagram_id become
       writable only by the server-side Instagram sync (service role)

  Notes: public SELECT is unchanged, so every existing read keeps working.
*/

REVOKE UPDATE ON public.creators FROM anon;
REVOKE UPDATE ON public.creators FROM authenticated;

GRANT UPDATE (collab_status, whatsapp_number, contact_email, custom_rates, updated_at)
  ON public.creators TO authenticated;
