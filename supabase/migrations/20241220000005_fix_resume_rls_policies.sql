-- Disable RLS on resume_data table to allow admin operations
ALTER TABLE public.resume_data DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can update their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can insert their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Authenticated users can manage resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Authenticated users can access resume data" ON public.resume_data;

-- Remove the trigger that was causing issues
DROP TRIGGER IF EXISTS set_resume_data_user_id ON public.resume_data;
DROP FUNCTION IF EXISTS update_resume_data_user_id();

-- Make user_id column nullable and set default
ALTER TABLE public.resume_data ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.resume_data ALTER COLUMN user_id SET DEFAULT NULL;

-- Grant full access to authenticated users and service role
GRANT ALL ON public.resume_data TO authenticated;
GRANT ALL ON public.resume_data TO service_role;
GRANT ALL ON public.resume_data TO anon;

-- Ensure the table is included in realtime
DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'resume_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resume_data;
  END IF;
END $$;