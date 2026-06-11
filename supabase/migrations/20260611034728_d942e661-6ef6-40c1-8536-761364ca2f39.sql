
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'treasurer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'payment_submitted';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'payment_verified';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.member_status ADD VALUE IF NOT EXISTS 'suspended';
