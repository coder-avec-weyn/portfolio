-- Add user_id column to resume_data table for RLS
ALTER TABLE public.resume_data 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing resume_data records to have a user_id
-- This assumes there's only one main record and we'll assign it to the first admin user
DO $$
BEGIN
  -- Try to find an admin user or any user to assign the existing resume data to
  UPDATE public.resume_data 
  SET user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'Art1204' OR email LIKE '%admin%' 
    LIMIT 1
  )
  WHERE user_id IS NULL;
  
  -- If no admin user found, create a placeholder user_id (this should not happen in practice)
  -- The admin login process will handle creating the proper user
END $$;

-- Enable RLS on resume_data table
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can update their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can insert their own resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Authenticated users can access resume data" ON public.resume_data;

-- Create RLS policies for resume_data table
CREATE POLICY "Users can view their own resume data" ON public.resume_data
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own resume data" ON public.resume_data
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own resume data" ON public.resume_data
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Allow authenticated users to upsert resume data (for admin functionality)
CREATE POLICY "Authenticated users can manage resume data" ON public.resume_data
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_resume_data_user_id ON public.resume_data(user_id);

-- Update the trigger function to handle user_id
CREATE OR REPLACE FUNCTION update_resume_data_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id is set to the current authenticated user if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-setting user_id and updated_at
DROP TRIGGER IF EXISTS set_resume_data_user_id ON public.resume_data;
CREATE TRIGGER set_resume_data_user_id
  BEFORE INSERT OR UPDATE ON public.resume_data
  FOR EACH ROW EXECUTE FUNCTION update_resume_data_user_id();

-- Grant necessary permissions
GRANT ALL ON public.resume_data TO authenticated;
GRANT ALL ON public.resume_data TO service_role;

-- Ensure the table is included in realtime (only if not already added)
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