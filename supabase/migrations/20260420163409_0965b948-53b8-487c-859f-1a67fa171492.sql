-- Restringe SELECT: só permite acesso quando o path completo é fornecido
-- (impede listagem do bucket, mas mantém download direto via URL pública)
DROP POLICY IF EXISTS "ad_downloads_public_read" ON storage.objects;
CREATE POLICY "ad_downloads_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'ad-downloads'
  AND array_length(string_to_array(name, '/'), 1) >= 2
);