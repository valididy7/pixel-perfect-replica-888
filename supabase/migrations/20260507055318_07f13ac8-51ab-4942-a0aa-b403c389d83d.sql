
CREATE TABLE public.ad_session_orders (
  ad_id uuid NOT NULL,
  session_id text NOT NULL,
  delivery_address jsonb,
  driver_requested_at timestamptz,
  driver_photo_url text,
  driver_name text,
  driver_plate text,
  driver_vehicle text,
  driver_color text,
  driver_rating text,
  driver_rides text,
  driver_eta text,
  driver_dispatched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ad_id, session_id)
);

ALTER TABLE public.ad_session_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_session_orders"
  ON public.ad_session_orders
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "public_read_session_orders_active"
  ON public.ad_session_orders
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.status = 'active'));

CREATE POLICY "public_insert_session_orders_active"
  ON public.ad_session_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.status = 'active'));

CREATE POLICY "public_update_session_orders_active"
  ON public.ad_session_orders
  FOR UPDATE
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.status = 'active'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_orders.ad_id AND a.status = 'active'));

CREATE TRIGGER ad_session_orders_touch
  BEFORE UPDATE ON public.ad_session_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX ad_session_orders_pending_idx
  ON public.ad_session_orders (ad_id, driver_requested_at DESC)
  WHERE driver_requested_at IS NOT NULL AND driver_dispatched_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_session_orders;
ALTER TABLE public.ad_session_orders REPLICA IDENTITY FULL;
