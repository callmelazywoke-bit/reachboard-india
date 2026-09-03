/*
  # One application per creator per campaign

  The "already applied" state lived only in the browser as a Set of deal ids, so
  the same application could be replayed without limit, flooding the brand's
  pipeline. A unique index turns applying into an atomic claim instead of a
  read-then-write.

  1. Data
     - Collapse any existing duplicate (deal_id, creator_id) rows down to the
       earliest submission
  2. Constraints
     - Unique index on (deal_id, creator_id)
*/

DELETE FROM public.brand_applications a
USING public.brand_applications b
WHERE a.deal_id = b.deal_id
  AND a.creator_id = b.creator_id
  AND a.deal_id IS NOT NULL
  AND a.creator_id IS NOT NULL
  AND (
    a.created_at > b.created_at
    OR (a.created_at = b.created_at AND a.id > b.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS brand_applications_deal_creator_key
  ON public.brand_applications (deal_id, creator_id);
