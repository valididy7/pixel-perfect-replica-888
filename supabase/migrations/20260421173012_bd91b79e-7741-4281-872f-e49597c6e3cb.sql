
-- Sincroniza email_send_log -> email_campaigns
CREATE OR REPLACE FUNCTION public.sync_campaign_status_from_send_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- message_id da fila é o próprio id da campanha (custom-email)
  IF NEW.message_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'sent' THEN
    UPDATE public.email_campaigns
    SET status = 'sent',
        sent_at = COALESCE(sent_at, NEW.created_at),
        send_error = NULL
    WHERE id::text = NEW.message_id
      AND status <> 'sent';
  ELSIF NEW.status = 'failed' OR NEW.status = 'dlq' THEN
    UPDATE public.email_campaigns
    SET status = 'failed',
        send_error = COALESCE(NEW.error_message, send_error)
    WHERE id::text = NEW.message_id
      AND status <> 'sent';
  ELSIF NEW.status = 'suppressed' THEN
    UPDATE public.email_campaigns
    SET status = 'failed',
        send_error = COALESCE(NEW.error_message, 'Destinatário bloqueado')
    WHERE id::text = NEW.message_id
      AND status <> 'sent';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_campaign_status_from_send_log ON public.email_send_log;
CREATE TRIGGER sync_campaign_status_from_send_log
AFTER INSERT ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.sync_campaign_status_from_send_log();

-- Backfill das duas campanhas que já saíram mas continuam pending
UPDATE public.email_campaigns c
SET status = 'sent',
    sent_at = COALESCE(c.sent_at, l.created_at),
    send_error = NULL
FROM public.email_send_log l
WHERE l.message_id = c.id::text
  AND l.status = 'sent'
  AND c.status <> 'sent';

-- Habilita realtime para email_campaigns e email_events
ALTER TABLE public.email_campaigns REPLICA IDENTITY FULL;
ALTER TABLE public.email_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'email_campaigns'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaigns';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'email_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.email_events';
  END IF;
END $$;
