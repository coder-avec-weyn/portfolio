CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'Full-Stack Developer',
  experience TEXT DEFAULT '1 year professional',
  status TEXT DEFAULT 'Available for freelance',
  bio TEXT,
  avatar_url TEXT,
  is_employer_view BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 100),
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  tech_stack TEXT[],
  github_url TEXT,
  live_url TEXT,
  image_url TEXT,
  video_url TEXT,
  featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  company_logo TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  company TEXT,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.visitor_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_flow TEXT CHECK (user_flow IN ('employer', 'viewer')),
  page_path TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  user_flow TEXT CHECK (user_flow IN ('employer', 'viewer')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_gradient TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.skills (name, category, proficiency, icon_url) VALUES
('React', 'Frontend', 90, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg'),
('Node.js', 'Backend', 85, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg'),
('TypeScript', 'Language', 88, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg'),
('Supabase', 'Database', 80, 'https://supabase.com/favicon.ico'),
('Tailwind CSS', 'Styling', 92, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg'),
('Next.js', 'Framework', 87, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg');

INSERT INTO public.projects (title, description, long_description, tech_stack, github_url, live_url, image_url, featured, order_index) VALUES
('E-Commerce Platform', 'Full-stack e-commerce solution with payment integration', 'A comprehensive e-commerce platform built with React and Node.js, featuring user authentication, product management, shopping cart functionality, and Stripe payment integration. The application includes an admin dashboard for inventory management and order tracking.', ARRAY['React', 'Node.js', 'MongoDB', 'Stripe', 'Express'], 'https://github.com/example/ecommerce', 'https://ecommerce-demo.vercel.app', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', true, 1),
('Task Management App', 'Collaborative project management tool', 'A modern task management application with real-time collaboration features. Built using React and Supabase, it includes drag-and-drop functionality, team collaboration, file attachments, and progress tracking with beautiful data visualizations.', ARRAY['React', 'Supabase', 'TypeScript', 'Framer Motion'], 'https://github.com/example/taskmanager', 'https://taskmanager-demo.vercel.app', 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80', true, 2),
('Weather Dashboard', 'Real-time weather monitoring application', 'An interactive weather dashboard that provides real-time weather data, forecasts, and beautiful visualizations. Features include location-based weather, historical data charts, and responsive design optimized for all devices.', ARRAY['React', 'Chart.js', 'OpenWeather API', 'CSS3'], 'https://github.com/example/weather', 'https://weather-demo.vercel.app', 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80', false, 3),
('Portfolio Website', 'Personal portfolio with dual user flows', 'This very website! A modern portfolio with dual user experiences - one optimized for employers and another for general viewers. Features glass morphism design, particle animations, and a comprehensive admin CMS.', ARRAY['React', 'Supabase', 'Framer Motion', 'Tailwind CSS'], 'https://github.com/example/portfolio', 'https://portfolio-demo.vercel.app', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', true, 4);

INSERT INTO public.experiences (company, position, description, start_date, end_date, is_current, location, order_index) VALUES
('Tech Startup Inc.', 'Full-Stack Developer', 'Developed and maintained web applications using React, Node.js, and PostgreSQL. Collaborated with cross-functional teams to deliver high-quality software solutions. Implemented CI/CD pipelines and improved application performance by 40%.', '2023-01-01', NULL, true, 'Remote', 1),
('Digital Agency', 'Frontend Developer', 'Created responsive web interfaces for various clients using React and Vue.js. Worked closely with designers to implement pixel-perfect designs and ensure optimal user experience across all devices.', '2022-06-01', '2022-12-31', false, 'New York, NY', 2),
('Freelance', 'Web Developer', 'Provided web development services to small businesses and startups. Built custom websites and web applications using modern technologies. Managed client relationships and project timelines effectively.', '2021-08-01', '2022-05-31', false, 'Remote', 3);

INSERT INTO public.testimonials (name, position, company, content, rating, featured) VALUES
('Sarah Johnson', 'Product Manager', 'Tech Startup Inc.', 'Working with Ramya has been an absolute pleasure. Her attention to detail and ability to deliver high-quality code on time is exceptional. She brings creative solutions to complex problems.', 5, true),
('Mike Chen', 'CEO', 'Digital Agency', 'One of the most talented developers I have worked with. Ramya''s technical skills combined with excellent communication make her a valuable team member. Highly recommended!', 5, true),
('Emily Rodriguez', 'Startup Founder', 'InnovateCorp', 'Ramya helped us build our MVP from scratch and guided us through the entire development process. The final product exceeded our expectations and launched successfully.', 5, false);

INSERT INTO public.theme_settings (name, primary_color, secondary_color, accent_color, background_gradient, is_active) VALUES
('Professional Blue', '#1e40af', '#3b82f6', '#06b6d4', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', true),
('Creative Purple', '#7c3aed', '#a855f7', '#ec4899', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', false),
('Elegant Dark', '#1f2937', '#374151', '#10b981', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', false);

-- Hire View Dynamic System Tables
CREATE TABLE IF NOT EXISTS public.hire_view_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme TEXT DEFAULT 'professional',
  layout TEXT DEFAULT 'standard',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- Insert default hire view settings
INSERT INTO public.hire_view_settings (theme, layout, is_active) VALUES
('professional', 'standard', true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hire_sections_type ON public.hire_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_hire_sections_order ON public.hire_sections(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_sections_active ON public.hire_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_hire_skills_category ON public.hire_skills(category);
CREATE INDEX IF NOT EXISTS idx_hire_skills_order ON public.hire_skills(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_experience_order ON public.hire_experience(order_index);
CREATE INDEX IF NOT EXISTS idx_hire_contact_fields_order ON public.hire_contact_fields(order_index);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_flow ON public.contact_submissions(user_flow);
CREATE INDEX IF NOT EXISTS idx_visitor_analytics_flow ON public.visitor_analytics(user_flow);

-- Add foreign key constraints
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_user_id FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Disable Row Level Security for hire view tables to allow full access
-- This ensures admin operations work without authentication issues
ALTER TABLE public.hire_view_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_contact_fields DISABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_hire_view_settings_updated_at BEFORE UPDATE ON public.hire_view_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hire_sections_updated_at BEFORE UPDATE ON public.hire_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hire_experience_updated_at BEFORE UPDATE ON public.hire_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enhanced indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hire_sections_updated_at ON public.hire_sections(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hire_skills_updated ON public.hire_skills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hire_experience_updated ON public.hire_experience(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hire_contact_fields_updated ON public.hire_contact_fields(created_at DESC);

-- RLS policies removed - tables now have full public access for admin operations
-- This ensures CRUD operations work without authentication barriers

-- Insert default hire sections
INSERT INTO public.hire_sections (section_type, title, content, order_index, is_active) VALUES
('hero', 'Professional Summary', '{
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
}', 1, true),
('skills', 'Technical Skills', '{
  "description": "Comprehensive skill set across the full development stack",
  "show_proficiency": true,
  "layout": "grid"
}', 2, true),
('experience', 'Professional Experience', '{
  "description": "Career progression and key achievements",
  "show_timeline": true,
  "show_achievements": true
}', 3, true),
('contact', 'Get In Touch', '{
  "description": "Ready to discuss your next project",
  "submit_text": "Send Message",
  "success_message": "Thank you for your message! I''ll get back to you within 24 hours."
}', 4, true),
('resume', 'Download Resume', '{
  "button_text": "Download PDF Resume",
  "file_url": "",
  "version": "1.0",
  "last_updated": "2024-03-15"
}', 5, true);

-- Insert default skills
INSERT INTO public.hire_skills (name, category, proficiency, color, order_index) VALUES
('React', 'Frontend', 90, '#61dafb', 1),
('TypeScript', 'Language', 88, '#3178c6', 2),
('Node.js', 'Backend', 85, '#339933', 3),
('Python', 'Language', 82, '#3776ab', 4),
('PostgreSQL', 'Database', 80, '#336791', 5),
('AWS', 'Cloud', 75, '#ff9900', 6),
('Docker', 'DevOps', 78, '#2496ed', 7),
('GraphQL', 'API', 85, '#e10098', 8);

-- Insert default experience
INSERT INTO public.hire_experience (company, position, description, start_date, end_date, is_current, location, achievements, order_index) VALUES
('Tech Startup Inc.', 'Senior Full-Stack Developer', 'Led development of scalable web applications serving 100K+ users. Architected microservices infrastructure and implemented CI/CD pipelines.', '2023-01-01', NULL, true, 'Remote', ARRAY['Increased application performance by 40%', 'Reduced deployment time from 2 hours to 15 minutes', 'Mentored 3 junior developers'], 1),
('Digital Agency', 'Full-Stack Developer', 'Developed custom web solutions for enterprise clients. Collaborated with design teams to create pixel-perfect, responsive interfaces.', '2022-01-01', '2022-12-31', false, 'New York, NY', ARRAY['Delivered 15+ client projects on time', 'Implemented automated testing reducing bugs by 60%', 'Led migration to modern React architecture'], 2),
('Freelance', 'Web Developer', 'Provided end-to-end web development services for small businesses and startups. Specialized in e-commerce and content management systems.', '2021-01-01', '2021-12-31', false, 'Remote', ARRAY['Built 20+ websites from scratch', 'Achieved 98% client satisfaction rate', 'Established long-term partnerships with 5 agencies'], 3);

-- Insert default contact fields
INSERT INTO public.hire_contact_fields (field_type, label, placeholder, is_required, order_index) VALUES
('text', 'Full Name', 'Enter your full name', true, 1),
('email', 'Email Address', 'your.email@company.com', true, 2),
('text', 'Company', 'Your company name', false, 3),
('text', 'Subject', 'Brief subject line', true, 4),
('textarea', 'Message', 'Tell me about your project or opportunity...', true, 5);

-- Enable realtime for hire view tables only (other tables already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_view_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_skills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_experience;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hire_contact_fields;