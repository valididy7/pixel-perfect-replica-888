-- Função utilitária pra atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tabela de leads/captura em tempo real
CREATE TABLE public.ad_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  screen_id UUID REFERENCES public.ad_screens(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_leads_ad_session ON public.ad_leads(ad_id, session_id, created_at DESC);
CREATE INDEX idx_ad_leads_ad_created ON public.ad_leads(ad_id, created_at DESC);

ALTER TABLE public.ad_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_leads"
ON public.ad_leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_leads.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_delete_leads"
ON public.ad_leads FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_leads.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "public_insert_leads_active"
ON public.ad_leads FOR INSERT TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_leads.ad_id AND a.status = 'active'));

CREATE POLICY "public_select_active_leads"
ON public.ad_leads FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_leads.ad_id AND a.status = 'active'));

CREATE TRIGGER set_ad_leads_updated_at
BEFORE UPDATE ON public.ad_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_leads;
ALTER TABLE public.ad_leads REPLICA IDENTITY FULL;