ALTER TABLE public.ad_order_status
  ADD COLUMN IF NOT EXISTS driver_dispatched_at TIMESTAMPTZ;