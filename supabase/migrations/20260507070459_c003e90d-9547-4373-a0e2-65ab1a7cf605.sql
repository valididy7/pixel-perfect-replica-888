
CREATE TABLE IF NOT EXISTS public.ad_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  ad_id uuid,
  slug text,
  kind text,
  title text,
  html text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_snapshots_ad_id ON public.ad_snapshots(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_snapshots_source ON public.ad_snapshots(source_table, source_id);

ALTER TABLE public.ad_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_read_snapshots ON public.ad_snapshots;
CREATE POLICY admin_read_snapshots ON public.ad_snapshots
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.snapshot_ad()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h text; t text; s text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    h := COALESCE(OLD.edited_html, OLD.original_html); t := OLD.title; s := OLD.slug;
    IF h IS NOT NULL AND length(h) > 0 THEN
      INSERT INTO public.ad_snapshots(source_table, source_id, ad_id, slug, title, html, reason)
      VALUES ('ads', OLD.id, OLD.id, s, t, h, 'delete');
    END IF;
    RETURN OLD;
  ELSE
    IF (COALESCE(OLD.edited_html,'') IS DISTINCT FROM COALESCE(NEW.edited_html,''))
       OR (COALESCE(OLD.original_html,'') IS DISTINCT FROM COALESCE(NEW.original_html,'')) THEN
      h := COALESCE(OLD.edited_html, OLD.original_html);
      IF h IS NOT NULL AND length(h) > 0 THEN
        INSERT INTO public.ad_snapshots(source_table, source_id, ad_id, slug, title, html, reason)
        VALUES ('ads', OLD.id, OLD.id, OLD.slug, OLD.title, h, 'update');
      END IF;
    END IF;
    RETURN NEW;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.snapshot_ad_screen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE h text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    h := COALESCE(OLD.edited_html, OLD.original_html);
    IF h IS NOT NULL AND length(h) > 0 THEN
      INSERT INTO public.ad_snapshots(source_table, source_id, ad_id, kind, title, html, reason)
      VALUES ('ad_screens', OLD.id, OLD.ad_id, OLD.kind, OLD.title, h, 'delete');
    END IF;
    RETURN OLD;
  ELSE
    IF (COALESCE(OLD.edited_html,'') IS DISTINCT FROM COALESCE(NEW.edited_html,''))
       OR (COALESCE(OLD.original_html,'') IS DISTINCT FROM COALESCE(NEW.original_html,'')) THEN
      h := COALESCE(OLD.edited_html, OLD.original_html);
      IF h IS NOT NULL AND length(h) > 0 THEN
        INSERT INTO public.ad_snapshots(source_table, source_id, ad_id, kind, title, html, reason)
        VALUES ('ad_screens', OLD.id, OLD.ad_id, OLD.kind, OLD.title, h, 'update');
      END IF;
    END IF;
    RETURN NEW;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_snapshot_ad ON public.ads;
CREATE TRIGGER trg_snapshot_ad BEFORE UPDATE OR DELETE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.snapshot_ad();

DROP TRIGGER IF EXISTS trg_snapshot_ad_screen ON public.ad_screens;
CREATE TRIGGER trg_snapshot_ad_screen BEFORE UPDATE OR DELETE ON public.ad_screens
FOR EACH ROW EXECUTE FUNCTION public.snapshot_ad_screen();
