-- Migration: Create store-logos bucket and RLS policies
-- Purpose: Set up storage for seller store logos with proper access controls
-- Date: 2025-11-11
-- NOTE: RLS is already enabled by default on storage.objects in Supabase
-- If you get "must be owner of table objects" error, skip the RLS enable step

-- Step 1: Create the store-logos bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('store-logos', 'store-logos', true)
on conflict (id) do nothing;

-- Step 2: Drop existing policies for store-logos bucket (idempotent)
drop policy if exists "Public read store logos" on storage.objects;
drop policy if exists "Authenticated users can upload store logos" on storage.objects;
drop policy if exists "Users can update own store logos" on storage.objects;
drop policy if exists "Users can delete own store logos" on storage.objects;
drop policy if exists "Admins can delete store logos" on storage.objects;

-- Step 3: Create RLS policies for store-logos bucket

-- Public read access to store logos
create policy "Public read store logos"
on storage.objects for select
using ( bucket_id = 'store-logos' );

-- Authenticated users (sellers) can upload store logos
create policy "Authenticated users can upload store logos"
on storage.objects for insert
with check (
  bucket_id = 'store-logos' 
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'))
  -- size check omitted: storage.objects does not expose a 'content' column in this role/setup
);

-- Users can update their own store logos
create policy "Users can update own store logos"
on storage.objects for update
using (
  bucket_id = 'store-logos'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  (lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'))
  -- size check omitted: storage.objects does not expose a 'content' column in this role/setup
);

-- Users can delete their own store logos
create policy "Users can delete own store logos"
on storage.objects for delete
using (
  bucket_id = 'store-logos'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete any store logos (for moderation)
create policy "Admins can delete store logos"
on storage.objects for delete
using (
  bucket_id = 'store-logos'
  and auth.role() = 'authenticated'
  and exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'admin'
    and status = 'active'
  )
);

-- Step 4: Verify bucket was created
select id, name, public from storage.buckets where id = 'store-logos';
