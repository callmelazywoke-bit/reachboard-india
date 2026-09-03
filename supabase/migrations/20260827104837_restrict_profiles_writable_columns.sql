/*
  # Restrict which profile columns the client may write

  Row-level policies on `profiles` only decide WHICH row a caller may touch, not
  which columns. Because `profiles.creator_id` and `profiles.role` carry
  authority (five other policies resolve ownership through `creator_id`, and
  `insert_brand_deals_own` gates on `role`), a signed-in user could previously
  escalate by updating their own row.

  1. Privileges
     - Revoke table-wide INSERT/UPDATE on public.profiles from anon, authenticated
     - Re-grant only the columns the application actually writes:
         INSERT (id, role, display_name)  -- chosen once at signup
         UPDATE (display_name)            -- the only self-service edit
     - `creator_id` becomes writable only by the service role (server-side linking)
     - `role` becomes fixed after signup

  2. Constraints
     - Unique index on profiles.creator_id so one creator row can never be
       claimed by two profiles

  Notes: SELECT and DELETE grants are unchanged; there is no DELETE policy, so
  deletes remain denied by RLS.
*/

CREATE UNIQUE INDEX IF NOT EXISTS profiles_creator_id_key
  ON public.profiles (creator_id)
  WHERE creator_id IS NOT NULL;

REVOKE INSERT, UPDATE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE ON public.profiles FROM authenticated;

GRANT INSERT (id, role, display_name) ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
