-- Permitir INSERT público em e-mails banidos (mesma lógica do ad_session_actions)
CREATE POLICY "public_insert_blocked_emails_active"
ON public.ad_blocked_emails
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.status = 'active'));

-- Permitir DELETE público em e-mails banidos (pra o admin desbanir do painel)
CREATE POLICY "public_delete_blocked_emails_active"
ON public.ad_blocked_emails
FOR DELETE
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.ads a WHERE a.id = ad_blocked_emails.ad_id AND a.status = 'active'));