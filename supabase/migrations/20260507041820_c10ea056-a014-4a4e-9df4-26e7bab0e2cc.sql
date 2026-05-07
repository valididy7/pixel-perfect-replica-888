CREATE TABLE public.ad_order_status (
  ad_id UUID NOT NULL PRIMARY KEY,
  product_image_url TEXT,
  product_title TEXT,
  product_price TEXT,
  order_number TEXT,
  order_date TEXT,
  pickup_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_order_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all_order_status"
ON public.ad_order_status
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "public_read_order_status_active"
ON public.ad_order_status
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_order_status.ad_id AND a.status = 'active'));

CREATE TRIGGER update_ad_order_status_updated_at
BEFORE UPDATE ON public.ad_order_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();