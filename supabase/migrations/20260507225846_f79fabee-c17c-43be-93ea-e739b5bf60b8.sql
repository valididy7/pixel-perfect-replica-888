ALTER TABLE public.ad_order_status
ADD COLUMN IF NOT EXISTS lock_resume_session boolean NOT NULL DEFAULT false;