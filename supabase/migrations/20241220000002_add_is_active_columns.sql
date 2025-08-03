-- Add is_active columns to portfolio tables if they don't exist
-- This ensures all portfolio content can be toggled active/inactive

-- Add is_active column to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to skills table  
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to experiences table
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to testimonials table
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE public.projects SET is_active = true WHERE is_active IS NULL;
UPDATE public.skills SET is_active = true WHERE is_active IS NULL;
UPDATE public.experiences SET is_active = true WHERE is_active IS NULL;
UPDATE public.testimonials SET is_active = true WHERE is_active IS NULL;

-- Add indexes for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_active ON public.skills(is_active);
CREATE INDEX IF NOT EXISTS idx_experiences_active ON public.experiences(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON public.testimonials(is_active);

-- Enable realtime for portfolio tables
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.skills;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.experiences;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
END
$$;