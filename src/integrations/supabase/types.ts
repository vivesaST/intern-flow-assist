export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          contact: string | null
          created_at: string
          filled: number
          id: string
          name: string
          rating: number | null
          sector: string | null
          slots: number
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          filled?: number
          id?: string
          name: string
          rating?: number | null
          sector?: string | null
          slots?: number
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          filled?: number
          id?: string
          name?: string
          rating?: number | null
          sector?: string | null
          slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string
          criterion: string
          evaluator_id: string | null
          final_score: number | null
          id: string
          mid_score: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          criterion: string
          evaluator_id?: string | null
          final_score?: number | null
          id?: string
          mid_score?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          criterion?: string
          evaluator_id?: string | null
          final_score?: number | null
          id?: string
          mid_score?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      log_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          entry_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          entry_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "log_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      log_entries: {
        Row: {
          activities: string | null
          attachments: string[]
          created_at: string
          entry_date: string
          feedback: string | null
          hours: number
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["log_status"]
          student_id: string
          title: string
          updated_at: string
          week: number
        }
        Insert: {
          activities?: string | null
          attachments?: string[]
          created_at?: string
          entry_date: string
          feedback?: string | null
          hours?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["log_status"]
          student_id: string
          title: string
          updated_at?: string
          week: number
        }
        Update: {
          activities?: string | null
          attachments?: string[]
          created_at?: string
          entry_date?: string
          feedback?: string | null
          hours?: number
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["log_status"]
          student_id?: string
          title?: string
          updated_at?: string
          week?: number
        }
        Relationships: []
      }
      placements: {
        Row: {
          academic_supervisor_id: string | null
          company_id: string | null
          created_at: string
          end_date: string | null
          id: string
          industry_supervisor_id: string | null
          position: string | null
          progress: number
          start_date: string | null
          status: Database["public"]["Enums"]["placement_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_supervisor_id?: string | null
          company_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          industry_supervisor_id?: string | null
          position?: string | null
          progress?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_supervisor_id?: string | null
          company_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          industry_supervisor_id?: string | null
          position?: string | null
          progress?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["placement_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "placements_academic_supervisor_id_fkey"
            columns: ["academic_supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_industry_supervisor_id_fkey"
            columns: ["industry_supervisor_id"]
            isOneToOne: false
            referencedRelation: "supervisors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          matric: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          matric?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          matric?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supervisors: {
        Row: {
          affiliation: string | null
          capacity: number
          created_at: string
          id: string
          load: number
          name: string
          pending: number
          type: Database["public"]["Enums"]["supervisor_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliation?: string | null
          capacity?: number
          created_at?: string
          id?: string
          load?: number
          name: string
          pending?: number
          type: Database["public"]["Enums"]["supervisor_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliation?: string | null
          capacity?: number
          created_at?: string
          id?: string
          load?: number
          name?: string
          pending?: number
          type?: Database["public"]["Enums"]["supervisor_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          grade: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          grade?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_log_entry: { Args: { _entry_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "academic" | "industry" | "admin"
      log_status: "draft" | "submitted" | "approved" | "revision"
      placement_status: "pending" | "placed" | "completed"
      supervisor_type: "academic" | "industry"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in-progress" | "submitted" | "graded"
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
    Enums: {
      app_role: ["student", "academic", "industry", "admin"],
      log_status: ["draft", "submitted", "approved", "revision"],
      placement_status: ["pending", "placed", "completed"],
      supervisor_type: ["academic", "industry"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "in-progress", "submitted", "graded"],
    },
  },
} as const
