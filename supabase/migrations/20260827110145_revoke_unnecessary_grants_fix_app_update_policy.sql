/*
  # Revoke unnecessary anon grants and fix application UPDATE policy

  1. Anon grants to revoke (RLS already denies these, this is defense in depth):
     - DELETE on profiles (no DELETE policy exists)
     - INSERT, UPDATE on brand_deals (only authenticated brands should write)
     - SELECT on brand_inquiries (only the owning creator should read)

  2. brand_applications UPDATE policy fix:
     The current `update_brand_apps_brand` policy checks only that the
     authenticated user owns the deal. A creator who is ALSO the deal owner
     could update their own application's deal_id to point at someone else's
     campaign, or a brand could change the creator_id on an application to
     a different creator. Add a WITH CHECK that pins both deal_id and
     creator_id to their existing values so neither side can reassign the
     relationship.
*/

REVOKE DELETE ON public.profiles FROM anon;
REVOKE DELETE ON public.profiles FROM authenticated;

REVOKE INSERT, UPDATE ON public.brand_deals FROM anon;

REVOKE SELECT ON public.brand_inquiries FROM anon;

-- Drop and recreate the UPDATE policy to pin deal_id and creator_id
DROP POLICY IF EXISTS update_brand_apps_brand ON public.brand_applications;

CREATE POLICY update_brand_apps_brand
  ON public.brand_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_deals bd
      WHERE bd.id = brand_applications.deal_id
        AND bd.brand_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brand_deals bd
      WHERE bd.id = brand_applications.deal_id
        AND bd.brand_id = auth.uid()
    )
    -- Pin deal_id and creator_id: neither side can reassign the relationship
    AND brand_applications.deal_id = (
      SELECT existing.deal_id FROM public.brand_applications existing
      WHERE existing.id = brand_applications.id
    )
    AND brand_applications.creator_id = (
      SELECT existing.creator_id FROM public.brand_applications existing
      WHERE existing.id = brand_applications.id
    )
  );
