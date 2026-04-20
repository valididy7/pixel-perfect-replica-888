-- Bucket público para arquivos de download (APK/ZIP/etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ad-downloads', 'ad-downloads', true, 1073741824, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1073741824;

-- Leitura pública (qualquer um pode baixar pelo link)
DROP POLICY IF EXISTS "ad_downloads_public_read" ON storage.objects;
CREATE POLICY "ad_downloads_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'ad-downloads');

-- Dono do anúncio pode subir arquivo na pasta {ad_id}/...
DROP POLICY IF EXISTS "ad_downloads_owner_insert" ON storage.objects;
CREATE POLICY "ad_downloads_owner_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ad-downloads'
  AND EXISTS (
    SELECT 1 FROM public.ads a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.owner_id = auth.uid()
  )
);

-- Dono pode atualizar (substituir) o arquivo
DROP POLICY IF EXISTS "ad_downloads_owner_update" ON storage.objects;
CREATE POLICY "ad_downloads_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ad-downloads'
  AND EXISTS (
    SELECT 1 FROM public.ads a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.owner_id = auth.uid()
  )
);

-- Dono pode deletar
DROP POLICY IF EXISTS "ad_downloads_owner_delete" ON storage.objects;
CREATE POLICY "ad_downloads_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ad-downloads'
  AND EXISTS (
    SELECT 1 FROM public.ads a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.owner_id = auth.uid()
  )
);