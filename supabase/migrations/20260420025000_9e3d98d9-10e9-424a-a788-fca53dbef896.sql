-- Tabela de telas filhas vinculadas a um anúncio
CREATE TABLE IF NOT EXISTS public.ad_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'custom',
  title TEXT NOT NULL DEFAULT 'Tela sem título',
  source_url TEXT,
  original_html TEXT,
  edited_html TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_screens_ad_id_idx ON public.ad_screens(ad_id);
CREATE INDEX IF NOT EXISTS ad_screens_kind_idx ON public.ad_screens(kind);

ALTER TABLE public.ad_screens ENABLE ROW LEVEL SECURITY;

-- Dono do ad pai pode tudo
CREATE POLICY "owner_select_screens" ON public.ad_screens
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_insert_screens" ON public.ad_screens
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_update_screens" ON public.ad_screens
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_delete_screens" ON public.ad_screens
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.owner_id = auth.uid()));

-- Público lê telas de anúncios ativos
CREATE POLICY "public_active_read_screens" ON public.ad_screens
FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_screens.ad_id AND a.status = 'active'));

-- Trigger updated_at
CREATE TRIGGER ad_screens_touch_updated_at
BEFORE UPDATE ON public.ad_screens
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();