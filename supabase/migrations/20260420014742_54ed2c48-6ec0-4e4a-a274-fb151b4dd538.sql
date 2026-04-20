CREATE TABLE IF NOT EXISTS public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Anúncio sem título',
  price text,
  slug text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  original_html text,
  edited_html text,
  thumbnail_url text,
  source_url text,
  view_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ads_owner_id_idx ON public.ads(owner_id);
CREATE INDEX IF NOT EXISTS ads_slug_idx ON public.ads(slug);
CREATE INDEX IF NOT EXISTS ads_status_idx ON public.ads(status);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select" ON public.ads
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "owner_insert" ON public.ads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner_update" ON public.ads
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner_delete" ON public.ads
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "public_active_read" ON public.ads
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ads_touch_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.increment_ad_view_count(ad_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ads
  SET view_count = view_count + 1
  WHERE slug = ad_slug AND status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_view_count(text) TO anon, authenticated;