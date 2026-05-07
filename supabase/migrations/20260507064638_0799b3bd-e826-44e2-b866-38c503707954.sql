-- Remove ON DELETE CASCADE from ads.owner_id so deleting a user does NOT wipe their ads.
ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_owner_id_fkey;
ALTER TABLE public.ads
  ADD CONSTRAINT ads_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE RESTRICT;