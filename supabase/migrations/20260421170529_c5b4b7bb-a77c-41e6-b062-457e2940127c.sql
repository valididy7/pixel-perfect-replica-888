-- Campanhas de e-mail enviadas pelo painel
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  ad_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  preview_text TEXT,
  spam_score INTEGER,
  spam_warnings JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  send_error TEXT,
  sent_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_campaigns" ON public.email_campaigns
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "owner_insert_campaigns" ON public.email_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner_update_campaigns" ON public.email_campaigns
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner_delete_campaigns" ON public.email_campaigns
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_email_campaigns_owner ON public.email_campaigns(owner_id, created_at DESC);

-- Eventos (abertura, clique) por campanha
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  url TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Dono pode ler eventos de suas campanhas
CREATE POLICY "owner_select_events" ON public.email_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_campaigns c
    WHERE c.id = email_events.campaign_id AND c.owner_id = auth.uid()
  ));

-- Qualquer pessoa pode inserir abertura/clique (necessário pro pixel)
CREATE POLICY "public_insert_events" ON public.email_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (event_type IN ('open', 'click'));

CREATE INDEX idx_email_events_campaign ON public.email_events(campaign_id, created_at DESC);

-- Função pra atualizar contadores automaticamente quando entra um evento
CREATE OR REPLACE FUNCTION public.bump_email_campaign_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'open' THEN
    UPDATE public.email_campaigns
    SET
      open_count = open_count + 1,
      first_opened_at = COALESCE(first_opened_at, NEW.created_at),
      last_opened_at = NEW.created_at
    WHERE id = NEW.campaign_id;
  ELSIF NEW.event_type = 'click' THEN
    UPDATE public.email_campaigns
    SET click_count = click_count + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_email_campaign_counters
  AFTER INSERT ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.bump_email_campaign_counters();