-- Tabela de e-mails banidos por anúncio
CREATE TABLE public.ad_blocked_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'manual',
  source_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email sempre minúsculo + único por anúncio
CREATE UNIQUE INDEX ad_blocked_emails_ad_email_key
  ON public.ad_blocked_emails (ad_id, lower(email));

CREATE INDEX ad_blocked_emails_ad_id_idx ON public.ad_blocked_emails (ad_id);

ALTER TABLE public.ad_blocked_emails ENABLE ROW LEVEL SECURITY;

-- Dono do anúncio: tudo
CREATE POLICY "owner_select_blocked_emails"
ON public.ad_blocked_emails
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_insert_blocked_emails"
ON public.ad_blocked_emails
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.owner_id = auth.uid()));

CREATE POLICY "owner_delete_blocked_emails"
ON public.ad_blocked_emails
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.owner_id = auth.uid()));

-- Visitante público (anúncio ativo) pode consultar a lista pra checar se o e-mail está banido
CREATE POLICY "public_read_blocked_emails_active"
ON public.ad_blocked_emails
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.status = 'active'));