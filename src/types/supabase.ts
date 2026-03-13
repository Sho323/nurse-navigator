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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          is_resolved: boolean
          tenant_id: string
          visit_record_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean
          tenant_id: string
          visit_record_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean
          tenant_id?: string
          visit_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_alerts_visit_record_id_fkey"
            columns: ["visit_record_id"]
            isOneToOne: false
            referencedRelation: "visit_records"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_events: {
        Row: {
          action: string
          consent_id: string
          consent_status_after: string
          consent_status_before: string | null
          consent_type: string
          consented_by_kind: string | null
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          patient_id: string
          performed_by_user_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          consent_id: string
          consent_status_after: string
          consent_status_before?: string | null
          consent_type: string
          consented_by_kind?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          patient_id: string
          performed_by_user_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          consent_id?: string
          consent_status_after?: string
          consent_status_before?: string | null
          consent_type?: string
          consented_by_kind?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          patient_id?: string
          performed_by_user_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_events_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_events_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          consent_type: string
          consented_at: string
          consented_by_kind: string
          consented_by_user_id: string | null
          created_at: string
          id: string
          notes: string | null
          patient_id: string
          policy_version: string
          revoked_at: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consent_type: string
          consented_at?: string
          consented_by_kind?: string
          consented_by_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id: string
          policy_version?: string
          revoked_at?: string | null
          source?: string
          status: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consent_type?: string
          consented_at?: string
          consented_by_kind?: string
          consented_by_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          policy_version?: string
          revoked_at?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_consented_by_user_id_fkey"
            columns: ["consented_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system_alert: boolean
          patient_id: string | null
          sender_id: string
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system_alert?: boolean
          patient_id?: string | null
          sender_id: string
          tenant_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system_alert?: boolean
          patient_id?: string | null
          sender_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          care_level: string | null
          created_at: string
          id: string
          insurance_type: string | null
          kana_name: string | null
          name: string
          tenant_id: string
          diagnosis: string | null
          current_illness: string | null
          medical_history: string | null
          primary_physician: string | null
          family_structure: string | null
          key_person_contact: string | null
          emergency_response: string | null
          precautions: string | null
          monthly_schedule: string | null
        }
        Insert: {
          care_level?: string | null
          created_at?: string
          id?: string
          insurance_type?: string | null
          kana_name?: string | null
          name: string
          tenant_id: string
          diagnosis?: string | null
          current_illness?: string | null
          medical_history?: string | null
          primary_physician?: string | null
          family_structure?: string | null
          key_person_contact?: string | null
          emergency_response?: string | null
          precautions?: string | null
          monthly_schedule?: string | null
        }
        Update: {
          care_level?: string | null
          created_at?: string
          id?: string
          insurance_type?: string | null
          kana_name?: string | null
          name?: string
          tenant_id?: string
          diagnosis?: string | null
          current_illness?: string | null
          medical_history?: string | null
          primary_physician?: string | null
          family_structure?: string | null
          key_person_contact?: string | null
          emergency_response?: string | null
          precautions?: string | null
          monthly_schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_data: {
        Row: {
          ai_comment: string | null
          billed_amount: number
          created_at: string
          id: string
          patient_name: string
          received_amount: number | null
          status: Database["public"]["Enums"]["sales_status"]
          target_month: string
          tenant_id: string
        }
        Insert: {
          ai_comment?: string | null
          billed_amount: number
          created_at?: string
          id?: string
          patient_name: string
          received_amount?: number | null
          status?: Database["public"]["Enums"]["sales_status"]
          target_month: string
          tenant_id: string
        }
        Update: {
          ai_comment?: string | null
          billed_amount?: number
          created_at?: string
          id?: string
          patient_name?: string
          received_amount?: number | null
          status?: Database["public"]["Enums"]["sales_status"]
          target_month?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      visit_records: {
        Row: {
          blood_pressure: string | null
          created_at: string
          id: string
          image_urls: string[] | null
          nurse_id: string
          patient_id: string
          temperature: number | null
          tenant_id: string
          text_record: string | null
          visit_type: string
        }
        Insert: {
          blood_pressure?: string | null
          created_at?: string
          id?: string
          image_urls?: string[] | null
          nurse_id: string
          patient_id: string
          temperature?: number | null
          tenant_id: string
          text_record?: string | null
          visit_type: string
        }
        Update: {
          blood_pressure?: string | null
          created_at?: string
          id?: string
          image_urls?: string[] | null
          nurse_id?: string
          patient_id?: string
          temperature?: number | null
          tenant_id?: string
          text_record?: string | null
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_records_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      sales_status: "matched" | "inferred" | "error" | "pending"
      user_role: "admin" | "nurse"
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
      sales_status: ["matched", "inferred", "error", "pending"],
      user_role: ["admin", "nurse"],
    },
  },
} as const
