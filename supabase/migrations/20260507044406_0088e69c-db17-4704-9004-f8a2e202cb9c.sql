ALTER TABLE public.ad_order_status
  ADD COLUMN IF NOT EXISTS driver_photo_url text,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS driver_plate text,
  ADD COLUMN IF NOT EXISTS driver_vehicle text,
  ADD COLUMN IF NOT EXISTS driver_color text,
  ADD COLUMN IF NOT EXISTS driver_rating text,
  ADD COLUMN IF NOT EXISTS driver_rides text,
  ADD COLUMN IF NOT EXISTS driver_eta text;