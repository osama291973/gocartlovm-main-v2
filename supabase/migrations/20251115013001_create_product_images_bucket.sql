-- Create product-images bucket and RLS policies
-- This migration creates the storage bucket for product images

-- Note: Supabase storage buckets are managed via the REST API, not SQL
-- However, we can create the RLS policies once the bucket exists
-- The bucket creation must be done via Supabase UI or via Node.js script

-- For now, we'll create the RLS policies that will be applied when the bucket is created

-- Policy 1: Anyone can view/download product images (public read)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy 2: Public read access for product images
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Policy 3: Authenticated users can upload product images (no folder restriction)
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Policy 4: Users can update their own product images
DROP POLICY IF EXISTS "Users can update product images" ON storage.objects;
CREATE POLICY "Users can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner_id = auth.uid())
  WITH CHECK (bucket_id = 'product-images' AND owner_id = auth.uid());

-- Policy 5: Users can delete their own product images
DROP POLICY IF EXISTS "Users can delete product images" ON storage.objects;
CREATE POLICY "Users can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND owner_id = auth.uid());
