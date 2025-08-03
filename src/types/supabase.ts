export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          user_flow: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          user_flow?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          user_flow?: string | null
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string
          company_logo: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          location: string | null
          order_index: number | null
          position: string
          start_date: string
        }
        Insert: {
          company: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position: string
          start_date: string
        }
        Update: {
          company?: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position?: string
          start_date?: string
        }
        Relationships: []
      }
      hire_contact_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          label: string
          options: Json | null
          order_index: number | null
          placeholder: string | null
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label?: string
          options?: Json | null
          order_index?: number | null
          placeholder?: string | null
        }
        Relationships: []
      }
      hire_experience: {
        Row: {
          achievements: string[] | null
          company: string
          company_logo: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_current: boolean | null
          location: string | null
          order_index: number | null
          position: string
          start_date: string
        }
        Insert: {
          achievements?: string[] | null
          company: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position: string
          start_date: string
        }
        Update: {
          achievements?: string[] | null
          company?: string
          company_logo?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_current?: boolean | null
          location?: string | null
          order_index?: number | null
          position?: string
          start_date?: string
        }
        Relationships: []
      }
      hire_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean | null
          order_index: number | null
          section_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          section_type: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          section_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hire_skills: {
        Row: {
          category: string
          color: string | null
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          proficiency: number | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          proficiency?: number | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          proficiency?: number | null
        }
        Relationships: []
      }
      hire_view_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          layout: string | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: string | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          layout?: string | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience: string | null
          full_name: string | null
          id: string
          is_employer_view: boolean | null
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string | null
          id: string
          is_employer_view?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string | null
          id?: string
          is_employer_view?: boolean | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean | null
          github_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          live_url: string | null
          long_description: string | null
          order_index: number | null
          tech_stack: string[] | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          live_url?: string | null
          long_description?: string | null
          order_index?: number | null
          tech_stack?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean | null
          github_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          live_url?: string | null
          long_description?: string | null
          order_index?: number | null
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      resume_data: {
        Row: {
          content: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          proficiency: number | null
        }
        Insert: {
          category: string
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          proficiency?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          proficiency?: number | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          featured: boolean | null
          id: string
          is_active: boolean | null
          name: string
          position: string | null
          rating: number | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          position?: string | null
          rating?: number | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_color: string | null
          background_gradient: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          accent_color?: string | null
          background_gradient?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          accent_color?: string | null
          background_gradient?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: []
      }
      visitor_analytics: {
        Row: {
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: unknown | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          time_spent: number | null
          user_agent: string | null
          user_flow: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          time_spent?: number | null
          user_agent?: string | null
          user_flow?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          time_spent?: number | null
          user_agent?: string | null
          user_flow?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      analytics_summary: {
        Row: {
          avg_time_spent: number | null
          date: string | null
          unique_sessions: number | null
          unique_visitors: number | null
          user_flow: string | null
          visits: number | null
        }
        Relationships: []
      }
      contact_summary: {
        Row: {
          count: number | null
          date: string | null
          priority: string | null
          status: string | null
          user_flow: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
