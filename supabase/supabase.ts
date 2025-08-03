import { createClient } from "@supabase/supabase-js";

// You need to replace these with your actual Supabase credentials
// Get them from your Supabase project settings
const supabaseUrl = "https://fwizozqegwzmyunggfxv.supabase.co";
const supabaseAnonKey = "sbp_2a1a31cd77e583a94d8515e09214e667d5263f25";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
