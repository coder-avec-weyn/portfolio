-- Fix analytics section and profile image system with enhanced Supabase integration

-- Ensure visitor_analytics table has proper structure
ALTER TABLE public.visitor_analytics 
ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Ensure contact_submissions table has proper structure
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create admin user in auth.users first (required for foreign key constraint)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@portfolio.com',
  crypt('admin123', gen_salt('bf')),
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Ramya Lakhani"}',
  false
) ON CONFLICT (id) DO NOTHING;

-- Update profiles table to use a proper UUID as primary key
INSERT INTO public.profiles (id, full_name, role, bio, avatar_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ramya Lakhani',
  'Full-Stack Developer',
  'Passionate full-stack developer with expertise in modern web technologies, creating scalable applications and innovative digital solutions.',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  updated_at = timezone('utc'::text, now());

-- Ensure public-profile-images bucket exists with 10MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-profile-images', 
  'public-profile-images', 
  true, 
  10485760, -- 10MB limit as requested
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public profile images access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload public profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update public profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete public profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete for profile images" ON storage.objects;

-- Create comprehensive storage policies for public profile images (no authentication required as requested)
CREATE POLICY "Public read access for profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'public-profile-images');

-- Allow uploads without authentication (defaults to admin user as requested)
CREATE POLICY "Public upload for profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public-profile-images');

-- Allow updates without authentication (defaults to admin user as requested)
CREATE POLICY "Public update for profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'public-profile-images');

-- Allow deletes without authentication (defaults to admin user as requested)
CREATE POLICY "Public delete for profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'public-profile-images');

-- Disable RLS for profiles table to allow admin operations
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS for analytics tables to ensure proper admin access
ALTER TABLE public.visitor_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;

-- Add enhanced indexes for better analytics performance
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_created_at ON public.visitor_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_user_flow ON public.visitor_analytics(user_flow);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_session ON public.visitor_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_page_path ON public.visitor_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_user_flow ON public.contact_submissions(user_flow);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON public.contact_submissions(priority);

-- Enable realtime for analytics tables (only if not already added)
DO $$
BEGIN
  -- Add visitor_analytics to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'visitor_analytics' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_analytics;
  END IF;
  
  -- Add contact_submissions to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'contact_submissions' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
  END IF;
  
  -- Add profiles to realtime publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'profiles' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- Insert enhanced sample analytics data for testing
INSERT INTO public.visitor_analytics (session_id, user_flow, page_path, user_agent, referrer, ip_address, country, device_type)
VALUES 
  ('test-session-1', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'https://google.com', '192.168.1.1'::inet, 'United States', 'desktop'),
  ('test-session-2', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 'https://linkedin.com', '192.168.1.2'::inet, 'Canada', 'mobile'),
  ('test-session-3', 'employer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'direct', '192.168.1.3'::inet, 'United Kingdom', 'desktop'),
  ('test-session-4', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (Android 11; Mobile)', 'https://twitter.com', '192.168.1.4'::inet, 'Australia', 'mobile'),
  ('test-session-5', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'https://github.com', '192.168.1.5'::inet, 'Germany', 'desktop')
ON CONFLICT DO NOTHING;

-- Insert enhanced sample contact submissions for testing
INSERT INTO public.contact_submissions (name, email, subject, message, user_flow, status, priority, tags)
VALUES 
  ('John Doe', 'john@example.com', 'Hiring Inquiry', 'I would like to discuss a potential full-time opportunity for a senior developer role.', 'employer', 'unread', 'high', ARRAY['hiring', 'full-time']),
  ('Jane Smith', 'jane@example.com', 'Project Collaboration', 'Interested in collaborating on a React project.', 'viewer', 'read', 'normal', ARRAY['collaboration', 'react']),
  ('Mike Johnson', 'mike@startup.com', 'Freelance Work', 'Looking for a freelance developer for a 3-month project.', 'employer', 'unread', 'normal', ARRAY['freelance', 'short-term']),
  ('Sarah Wilson', 'sarah@agency.com', 'Partnership Opportunity', 'Would like to discuss a potential partnership.', 'viewer', 'replied', 'low', ARRAY['partnership', 'business'])
ON CONFLICT DO NOTHING;

-- Create a function to automatically update profile image URLs
CREATE OR REPLACE FUNCTION update_profile_avatar_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the main profile with the new avatar URL when a new image is uploaded
  IF NEW.bucket_id = 'public-profile-images' AND NEW.name LIKE '%/avatar.%' THEN
    UPDATE public.profiles 
    SET avatar_url = NEW.name, 
        updated_at = timezone('utc'::text, now())
    WHERE id = '00000000-0000-0000-0000-000000000001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile when new avatar is uploaded
DROP TRIGGER IF EXISTS trigger_update_profile_avatar ON storage.objects;
CREATE TRIGGER trigger_update_profile_avatar
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_avatar_url();

-- Create analytics summary view for better performance
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
  DATE(created_at) as date,
  user_flow,
  COUNT(*) as visits,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT ip_address) as unique_visitors,
  AVG(time_spent) as avg_time_spent
FROM public.visitor_analytics 
GROUP BY DATE(created_at), user_flow
ORDER BY date DESC, user_flow;

-- Create contact submissions summary view
CREATE OR REPLACE VIEW contact_summary AS
SELECT 
  DATE(created_at) as date,
  user_flow,
  status,
  priority,
  COUNT(*) as count
FROM public.contact_submissions 
GROUP BY DATE(created_at), user_flow, status, priority
ORDER BY date DESC, user_flow, status, priority;