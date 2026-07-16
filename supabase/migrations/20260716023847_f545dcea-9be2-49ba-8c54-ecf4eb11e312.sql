-- Remove insecure public read on the media bucket (ID documents live there)
DROP POLICY IF EXISTS "Public read media bucket" ON storage.objects;