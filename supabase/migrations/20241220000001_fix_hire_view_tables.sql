-- Comprehensive database verification and setup for hire view tables
-- This migration ensures all tables exist with proper structure and data

-- First, let's verify and create the hire view tables if they don't exist
CREATE TABLE IF NOT EXISTS public.hire_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'skills', 'experience', 'contact', 'resume')),
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hire_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 100),
  icon_url TEXT,
  color TEXT DEFAULT '#8b5cf6',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hire_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  company_logo TEXT,
  achievements TEXT[],
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hire_contact_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'textarea', 'select', 'checkbox')),
  label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security for hire view tables to allow full access
ALTER TABLE public.hire_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_contact_fields DISABLE ROW LEVEL SECURITY;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hire_sections_type ON public.hire_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_hire_sections_order ON public.hire_sections(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_sections_active ON public.hire_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_hire_skills_category ON public.hire_skills(category);
CREATE INDEX IF NOT EXISTS idx_hire_skills_order ON public.hire_skills(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_experience_order ON public.hire_experience(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_contact_fields_order ON public.hire_contact_fields(order_index);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_hire_sections_updated_at ON public.hire_sections;
CREATE TRIGGER update_hire_sections_updated_at 
  BEFORE UPDATE ON public.hire_sections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clear existing data to ensure fresh start (only if tables are empty or have test data)
DO $$
BEGIN
    -- Only clear if we have default/test data
    IF EXISTS (SELECT 1 FROM public.hire_sections WHERE title = 'Professional Summary') THEN
        DELETE FROM public.hire_sections;
        DELETE FROM public.hire_skills;
        DELETE FROM public.hire_experience;
        DELETE FROM public.hire_contact_fields;
    END IF;
END
$$;

-- Insert default hire sections with proper structure (only if empty)
INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'hero', 'Professional Summary', '{
  "headline": "Ramya Lakhani - Full-Stack Developer",
  "tagline": "Building scalable web applications with modern technologies",
  "bio": "Passionate developer creating amazing digital experiences with modern technologies",
  "email": "lakhani.ramya.u@gmail.co",
  "phone": "+91 7202800803",
  "location": "India",
  "cta_text": "Let''s Work Together",
  "background_image": "",
  "show_avatar": true,
  "avatar_text": "RL"
}', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'hero');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'skills', 'Technical Skills', '{
  "description": "Comprehensive skill set across the full development stack",
  "show_proficiency": true,
  "layout": "grid"
}', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'skills');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'experience', 'Professional Experience', '{
  "description": "Career progression and key achievements",
  "show_timeline": true,
  "show_achievements": true
}', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'experience');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'contact', 'Get In Touch', '{
  "description": "Ready to discuss your next project",
  "submit_text": "Send Message",
  "success_message": "Thank you for your message! I''ll get back to you within 24 hours."
}', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'contact');

INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active)
SELECT 'resume', 'Download Resume', '{
  "button_text": "Download PDF Resume",
  "file_url": "",
  "version": "1.0",
  "last_updated": "2024-03-15"
}', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.hire_sections WHERE section_type = 'resume');

-- Insert default skills with proper validation (only if empty)
INSERT INTO public.hire_skills (name, category, proficiency, color, order_index, is_active)
SELECT * FROM (VALUES
  ('React', 'Frontend', 90, '#61dafb', 1, true),
  ('TypeScript', 'Language', 88, '#3178c6', 2, true),
  ('Node.js', 'Backend', 85, '#339933', 3, true),
  ('Python', 'Language', 82, '#3776ab', 4, true),
  ('PostgreSQL', 'Database', 80, '#336791', 5, true),
  ('AWS', 'Cloud', 75, '#ff9900', 6, true),
  ('Docker', 'DevOps', 78, '#2496ed', 7, true),
  ('GraphQL', 'API', 85, '#e10098', 8, true)
) AS v(name, category, proficiency, color, order_index, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.hire_skills LIMIT 1);

-- Insert default experience with proper validation (only if empty)
INSERT INTO public.hire_experience (company, position, description, start_date, end_date, is_current, location, achievements, order_index, is_active)
SELECT * FROM (VALUES
  ('Tech Startup Inc.', 'Senior Full-Stack Developer', 'Led development of scalable web applications serving 100K+ users. Architected microservices infrastructure and implemented CI/CD pipelines.', '2023-01-01'::date, NULL, true, 'Remote', ARRAY['Increased application performance by 40%', 'Reduced deployment time from 2 hours to 15 minutes', 'Mentored 3 junior developers'], 1, true),
  ('Digital Agency', 'Full-Stack Developer', 'Developed custom web solutions for enterprise clients. Collaborated with design teams to create pixel-perfect, responsive interfaces.', '2022-01-01'::date, '2022-12-31'::date, false, 'New York, NY', ARRAY['Delivered 15+ client projects on time', 'Implemented automated testing reducing bugs by 60%', 'Led migration to modern React architecture'], 2, true),
  ('Freelance', 'Web Developer', 'Provided end-to-end web development services for small businesses and startups. Specialized in e-commerce and content management systems.', '2021-01-01'::date, '2021-12-31'::date, false, 'Remote', ARRAY['Built 20+ websites from scratch', 'Achieved 98% client satisfaction rate', 'Established long-term partnerships with 5 agencies'], 3, true)
) AS v(company, position, description, start_date, end_date, is_current, location, achievements, order_index, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.hire_experience LIMIT 1);

-- Insert default contact fields with proper validation (only if empty)
INSERT INTO public.hire_contact_fields (field_type, label, placeholder, is_required, order_index, is_active)
SELECT * FROM (VALUES
  ('text', 'Full Name', 'Enter your full name', true, 1, true),
  ('email', 'Email Address', 'your.email@company.com', true, 2, true),
  ('text', 'Company', 'Your company name', false, 3, true),
  ('text', 'Subject', 'Brief subject line', true, 4, true),
  ('textarea', 'Message', 'Tell me about your project or opportunity...', true, 5, true)
) AS v(field_type, label, placeholder, is_required, order_index, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.hire_contact_fields LIMIT 1);

-- Try to add tables to realtime publication (ignore errors if already added)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_sections;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_skills;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_experience;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_contact_fields;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
END
$$;