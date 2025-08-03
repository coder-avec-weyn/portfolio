import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ixqjqjqjqjqjqjqjqjqj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2NzI2NzAsImV4cCI6MjA1MDI0ODY3MH0.hardcoded_key_here";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
