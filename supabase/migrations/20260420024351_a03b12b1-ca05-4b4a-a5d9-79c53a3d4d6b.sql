ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS help_reactivate_url TEXT,
  ADD COLUMN IF NOT EXISTS help_forgot_password_url TEXT,
  ADD COLUMN IF NOT EXISTS help_passwordless_url TEXT;