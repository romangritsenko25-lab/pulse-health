-- Add bio field to specialists table
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create Supabase Storage bucket for specialist photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('specialist-photos', 'specialist-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to specialist photos
CREATE POLICY "specialist_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'specialist-photos');

-- Allow authenticated users to upload their own photos
CREATE POLICY "specialist_photos_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'specialist-photos' AND auth.uid() IS NOT NULL);
