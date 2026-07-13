
-- Public read policy for the "images" bucket so passport photos and post covers can be served
CREATE POLICY "Public read images bucket" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'images');

-- Authenticated users can upload to images bucket (admins use it from the admin panel;
-- registration goes through service role and bypasses RLS)
CREATE POLICY "Staff can upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can update images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'images' AND public.is_staff(auth.uid()));

-- Ensure the private "media" bucket (which stores ID documents in members/ids/*)
-- is not readable by anon/authenticated - only service role.
-- Existing policies (if any) allowing broader reads are left intact for other paths;
-- this adds an explicit staff-only read policy for members/ids/*.
CREATE POLICY "Staff can read member id docs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = 'members'
  AND (storage.foldername(name))[2] = 'ids'
  AND public.is_staff(auth.uid())
);

-- Approve member RPC: validates paid amount >= 300, generates membership number, sets status active
CREATE OR REPLACE FUNCTION public.approve_member(_member_id uuid)
RETURNS TABLE(membership_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid numeric;
  new_number text;
  current_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT status::text INTO current_status FROM public.members WHERE id = _member_id;
  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.member_payments
  WHERE member_id = _member_id;

  IF total_paid < 300 THEN
    RAISE EXCEPTION 'Payment not completed (Ksh % of Ksh 300 received)', total_paid;
  END IF;

  new_number := public.generate_membership_number();

  UPDATE public.members
  SET status = 'active',
      membership_number = new_number,
      approved_at = now(),
      approved_by = auth.uid(),
      updated_at = now()
  WHERE id = _member_id;

  -- Mark all payments verified
  UPDATE public.member_payments
  SET verified = true, verified_at = now(), verified_by = auth.uid()
  WHERE member_id = _member_id AND verified = false;

  RETURN QUERY SELECT new_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_member(uuid) TO authenticated;
