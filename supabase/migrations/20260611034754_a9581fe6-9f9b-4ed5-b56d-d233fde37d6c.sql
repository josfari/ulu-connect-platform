
-- Extend members table
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS national_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS sub_county text,
  ADD COLUMN IF NOT EXISTS ward text,
  ADD COLUMN IF NOT EXISTS physical_location text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS next_of_kin_name text,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS reason_for_joining text,
  ADD COLUMN IF NOT EXISTS id_front_path text,
  ADD COLUMN IF NOT EXISTS id_back_path text,
  ADD COLUMN IF NOT EXISTS membership_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Anyone can submit a membership application" ON public.members;
CREATE POLICY "Anyone can submit a membership application"
  ON public.members FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending_payment');

GRANT INSERT ON public.members TO anon;

-- Member payments
CREATE TABLE IF NOT EXISTS public.member_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 300,
  mpesa_code text NOT NULL,
  payer_phone text NOT NULL,
  paid_on date NOT NULL DEFAULT current_date,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_payments TO authenticated;
GRANT INSERT ON public.member_payments TO anon;
GRANT ALL ON public.member_payments TO service_role;

ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a payment record"
  ON public.member_payments FOR INSERT
  TO anon, authenticated
  WITH CHECK (verified = false);

CREATE POLICY "Staff can read all payments"
  ON public.member_payments FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins can update payments"
  ON public.member_payments FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete payments"
  ON public.member_payments FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Site settings (single row)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'main',
  org_name text NOT NULL DEFAULT 'The Ulu We Want SHG',
  logo_url text,
  contact_phone text,
  contact_email text,
  location text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  hero_title text,
  hero_subtitle text,
  footer_text text,
  homepage_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  mpesa_paybill text,
  mpesa_account text,
  mpesa_till text,
  registration_fee numeric NOT NULL DEFAULT 300,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are public"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can write activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- Membership number generator
CREATE SEQUENCE IF NOT EXISTS public.membership_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_membership_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
  year_part text := to_char(now(), 'YYYY');
BEGIN
  next_val := nextval('public.membership_number_seq');
  RETURN 'ULU-SHG-' || year_part || '-' || lpad(next_val::text, 4, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.generate_membership_number() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_membership_number() TO service_role;
