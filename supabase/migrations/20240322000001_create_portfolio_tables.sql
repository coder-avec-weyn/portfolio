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
('Sarah Johnson', 'Product Manager', 'Tech Startup Inc.', 'Working with this developer has been an absolute pleasure. Their attention to detail and ability to deliver high-quality code on time is exceptional. They bring creative solutions to complex problems.', 5, true),
('Mike Chen', 'CEO', 'Digital Agency', 'One of the most talented developers I have worked with. Their technical skills combined with excellent communication make them a valuable team member. Highly recommended!', 5, true),
('Emily Rodriguez', 'Startup Founder', 'InnovateCorp', 'They helped us build our MVP from scratch and guided us through the entire development process. The final product exceeded our expectations and launched successfully.', 5, false);

INSERT INTO public.theme_settings (name, primary_color, secondary_color, accent_color, background_gradient, is_active) VALUES
('Professional Blue', '#1e40af', '#3b82f6', '#06b6d4', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', true),
('Creative Purple', '#7c3aed', '#a855f7', '#ec4899', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', false),
('Elegant Dark', '#1f2937', '#374151', '#10b981', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', false);

alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table skills;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table experiences;
alter publication supabase_realtime add table testimonials;
alter publication supabase_realtime add table visitor_analytics;
alter publication supabase_realtime add table contact_submissions;
alter publication supabase_realtime add table theme_settings;