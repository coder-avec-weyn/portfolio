import { supabase } from "../../supabase/supabase";

export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...");
    // Since we're using hardcoded values, we can't check env vars
    console.log("Using hardcoded Supabase credentials");

    // Test basic connection
    const { data, error } = await supabase
      .from("hire_sections")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
      return { success: false, error: error.message };
    }

    console.log("Supabase connection successful!");
    return { success: true, data };
  } catch (error: any) {
    console.error("Connection test failed:", error);
    return { success: false, error: error.message };
  }
}

// Test all required tables
export async function testAllTables() {
  const tables = [
    "hire_sections",
    "hire_skills",
    "hire_experience",
    "hire_contact_fields",
    "contact_submissions",
    "profiles",
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);

      results.push({
        table,
        success: !error,
        error: error?.message,
        hasData: data && data.length > 0,
      });
    } catch (error: any) {
      results.push({
        table,
        success: false,
        error: error.message,
        hasData: false,
      });
    }
  }

  return results;
}
