CREATE POLICY "public_insert_session_actions_active"
ON public.ad_session_actions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ads a
    WHERE a.id = ad_session_actions.ad_id AND a.status = 'active'
  )
);