-- Tabela de a\u00e7\u00f5es enviadas pelo dono do an\u00fancio para sess\u00f5es ativas dos visitantes
CREATE TABLE public.ad_session_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_session_actions_lookup ON public.ad_session_actions(ad_id, session_id, created_at DESC);

ALTER TABLE public.ad_session_actions ENABLE ROW LEVEL SECURITY;

-- Dono do an\u00fancio pode tudo (insert/select/delete)
CREATE POLICY "owner_all_session_actions"
ON public.ad_session_actions
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_actions.ad_id AND a.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_actions.ad_id AND a.owner_id = auth.uid()));

-- Visitante (an\u00f4nimo) pode ler a\u00e7\u00f5es da sua pr\u00f3pria sess\u00e3o em an\u00fancios ativos
CREATE POLICY "public_read_session_actions_active"
ON public.ad_session_actions
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_session_actions.ad_id AND a.status = 'active'));

-- Habilita realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_session_actions;
ALTER TABLE public.ad_session_actions REPLICA IDENTITY FULL;