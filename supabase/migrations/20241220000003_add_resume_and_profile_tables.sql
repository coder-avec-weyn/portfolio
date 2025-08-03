-- Create resume_data table for storing manual resume information
CREATE TABLE IF NOT EXISTS public.resume_data (
  id TEXT PRIMARY KEY DEFAULT 'main',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for profile images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- Insert default resume data structure
INSERT INTO public.resume_data (id, content) VALUES (
  'main',
  '{
    "personalInfo": {
      "fullName": "Ramya Lakhani",
      "email": "lakhani.ramya.u@gmail.co",
      "phone": "+91 7202800803",
      "location": "India",
      "website": "",
      "linkedin": "",
      "github": "",
      "summary": "Passionate full-stack developer with expertise in modern web technologies, creating scalable applications and innovative digital solutions."
    },
    "education": [],
    "certifications": [],
    "languages": ["English", "Hindi"],
    "interests": "Web Development, Open Source, Technology Innovation"
  }'
) ON CONFLICT (id) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resume_data_updated_at ON public.resume_data(updated_at DESC);

-- Enable realtime for resume_data table
ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_data;

-- Create function for updating updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$ language 'plpgsql';

-- Add trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_resume_data_updated_at ON public.resume_data;
CREATE TRIGGER update_resume_data_updated_at 
  BEFORE UPDATE ON public.resume_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update default profile avatar to boy developer with glasses and code shirt
UPDATE public.profiles 
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=boydev&accessories=prescription02&accessoriesChance=100&clothingGraphic=code&top=shortHair&topChance=100&facialHair=light&facialHairChance=100&skinColor=light'
WHERE avatar_url IS NULL OR avatar_url = '';

-- Ensure storage policies are properly set
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (bucket_id = 'profile-images' AND auth.role() = 'authenticated');
