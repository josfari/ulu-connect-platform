
-- Fix is_staff privilege escalation: only actual staff roles count
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin','editor')
  )
$$;

-- Allow members to read their own record and financial history
CREATE POLICY "Members read own record"
ON public.members FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members read own contributions"
ON public.contributions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = contributions.member_id AND m.user_id = auth.uid()));

CREATE POLICY "Members read own loans"
ON public.loans FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = loans.member_id AND m.user_id = auth.uid()));

CREATE POLICY "Members read own repayments"
ON public.repayments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.loans l
  JOIN public.members m ON m.id = l.member_id
  WHERE l.id = repayments.loan_id AND m.user_id = auth.uid()
));
