import { createClient } from "@supabase/supabase-js";

// You need to replace these with your actual Supabase credentials
// Get them from your Supabase project settings
const supabaseUrl = "https://vnixswtxvuqtytnegqos.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
