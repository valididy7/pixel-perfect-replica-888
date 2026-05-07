ALTER TABLE public.ad_order_status
  ADD COLUMN IF NOT EXISTS delivery_address JSONB,
  ADD COLUMN IF NOT EXISTS delivery_address_session_id TEXT;

CREATE POLICY "public_upsert_order_status_active_for_address"
ON public.ad_order_status
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.status = 'active'));

CREATE POLICY "public_update_order_status_active_for_address"
ON public.ad_order_status
FOR UPDATE
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.status = 'active'))
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.status = 'active'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_order_status;