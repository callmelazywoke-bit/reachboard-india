/*
  # Bound enquiry and pitch input at the database

  BrandInquiryForm trims and slices every field in the browser, but the enquiry
  insert policy is open to anonymous callers (by design: brands contact creators
  without an account), so a direct API call could store megabytes of text or a
  negative budget in any creator's inbox.

  1. Constraints on public.brand_inquiries (mirroring the form's own caps)
     - brand_name <= 100, contact_email <= 255, timeline <= 200,
       barter_details <= 500, deliverables <= 1000
     - contact_email must look like an address
     - budget_inr must be non-negative and within a sane ceiling
  2. Constraint on public.brand_applications
     - pitch_quote <= 140, matching the client cap

  Added NOT VALID so historical rows are left untouched; all new writes are
  checked.
*/

ALTER TABLE public.brand_inquiries
  ADD CONSTRAINT brand_inquiries_lengths_check
  CHECK (
    char_length(brand_name) BETWEEN 1 AND 100
    AND char_length(contact_email) BETWEEN 3 AND 255
    AND (timeline IS NULL OR char_length(timeline) <= 200)
    AND (barter_details IS NULL OR char_length(barter_details) <= 500)
    AND (deliverables IS NULL OR char_length(deliverables) <= 1000)
  ) NOT VALID;

ALTER TABLE public.brand_inquiries
  ADD CONSTRAINT brand_inquiries_email_format_check
  CHECK (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') NOT VALID;

ALTER TABLE public.brand_inquiries
  ADD CONSTRAINT brand_inquiries_budget_check
  CHECK (budget_inr IS NULL OR (budget_inr >= 0 AND budget_inr <= 1000000000)) NOT VALID;

ALTER TABLE public.brand_applications
  ADD CONSTRAINT brand_applications_pitch_length_check
  CHECK (pitch_quote IS NULL OR char_length(pitch_quote) <= 140) NOT VALID;
