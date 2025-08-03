-- Create public profile images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-profile-images', 'public-profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public profile images bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- Public read access for profile images
CREATE POLICY "Public profile images access" ON storage.objects
FOR SELECT USING (bucket_id = 'public-profile-images');

-- Authenticated users can upload profile images
CREATE POLICY "Authenticated users can upload public profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public-profile-images' AND auth.role() = 'authenticated');

-- Users can update profile images
CREATE POLICY "Users can update public profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'public-profile-images' AND auth.role() = 'authenticated');

-- Users can delete profile images
CREATE POLICY "Users can delete public profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'public-profile-images' AND auth.role() = 'authenticated');

-- Update profiles table to ensure avatar_url column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update existing profile with default avatar if none exists
UPDATE public.profiles 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100'
WHERE avatar_url IS NULL OR avatar_url = '';
