-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Upload Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update Own Avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Own Avatar" ON storage.objects;

-- Create storage policies
-- Allow public read access to avatars
CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users Can Upload Avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'::text 
        AND auth.role() = 'authenticated'::text
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to update their own avatar
CREATE POLICY "Users Can Update Own Avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'::text 
        AND auth.role() = 'authenticated'::text
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own avatar
CREATE POLICY "Users Can Delete Own Avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'::text 
        AND auth.role() = 'authenticated'::text
        AND (storage.foldername(name))[1] = auth.uid()::text
    );