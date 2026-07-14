-- Allow admin approval regardless of payment; keep membership number generation but change prefix to SHG-YYYY-XXXX
CREATE OR REPLACE FUNCTION public.generate_membership_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_val bigint;
  year_part text := to_char(now(), 'YYYY');
BEGIN
  next_val := nextval('public.membership_number_seq');
  RETURN 'SHG-' || year_part || '-' || lpad(next_val::text, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_member(_member_id uuid)
 RETURNS TABLE(membership_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_number text;
  current_number text;
  current_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT status::text, membership_number
    INTO current_status, current_number
  FROM public.members WHERE id = _member_id;

  IF current_status IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Reuse existing membership number if already assigned; otherwise generate
  IF current_number IS NULL OR current_number = '' THEN
    new_number := public.generate_membership_number();
  ELSE
    new_number := current_number;
  END IF;

  UPDATE public.members
  SET status = 'active',
      membership_number = new_number,
      approved_at = now(),
      approved_by = auth.uid(),
      updated_at = now()
  WHERE id = _member_id;

  RETURN QUERY SELECT new_number;
END;
$function$;