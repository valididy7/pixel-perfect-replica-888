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
      ad_blocked_emails: {
        Row: {
          ad_id: string
          created_at: string
          email: string
          id: string
          reason: string
          source_session_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          email: string
          id?: string
          reason?: string
          source_session_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          email?: string
          id?: string
          reason?: string
          source_session_id?: string | null
        }
        Relationships: []
      }
      ad_leads: {
        Row: {
          ad_id: string
          created_at: string
          field_name: string
          id: string
          screen_id: string | null
          session_id: string
          updated_at: string
          user_agent: string | null
          value: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          field_name: string
          id?: string
          screen_id?: string | null
          session_id: string
          updated_at?: string
          user_agent?: string | null
          value?: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          field_name?: string
          id?: string
          screen_id?: string | null
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_leads_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_leads_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "ad_screens"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_screens: {
        Row: {
          ad_id: string
          created_at: string
          edited_html: string | null
          id: string
          kind: string
          original_html: string | null
          position: number
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          edited_html?: string | null
          id?: string
          kind?: string
          original_html?: string | null
          position?: number
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          edited_html?: string | null
          id?: string
          kind?: string
          original_html?: string | null
          position?: number
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_screens_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_session_actions: {
        Row: {
          action: string
          ad_id: string
          created_at: string
          id: string
          payload: Json | null
          session_id: string
        }
        Insert: {
          action: string
          ad_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          session_id: string
        }
        Update: {
          action?: string
          ad_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          session_id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          created_at: string
          download_url: string | null
          edited_html: string | null
          expires_at: string | null
          help_forgot_password_url: string | null
          help_passwordless_url: string | null
          help_reactivate_url: string | null
          id: string
          original_html: string | null
          owner_id: string
          price: string | null
          slug: string
          source_url: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          edited_html?: string | null
          expires_at?: string | null
          help_forgot_password_url?: string | null
          help_passwordless_url?: string | null
          help_reactivate_url?: string | null
          id?: string
          original_html?: string | null
          owner_id: string
          price?: string | null
          slug: string
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          download_url?: string | null
          edited_html?: string | null
          expires_at?: string | null
          help_forgot_password_url?: string | null
          help_passwordless_url?: string | null
          help_reactivate_url?: string | null
          id?: string
          original_html?: string | null
          owner_id?: string
          price?: string | null
          slug?: string
          source_url?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          ad_id: string | null
          click_count: number
          created_at: string
          first_opened_at: string | null
          html: string
          id: string
          last_opened_at: string | null
          open_count: number
          owner_id: string
          preview_text: string | null
          recipient_email: string
          send_error: string | null
          sent_at: string | null
          spam_score: number | null
          spam_warnings: Json | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          click_count?: number
          created_at?: string
          first_opened_at?: string | null
          html: string
          id?: string
          last_opened_at?: string | null
          open_count?: number
          owner_id: string
          preview_text?: string | null
          recipient_email: string
          send_error?: string | null
          sent_at?: string | null
          spam_score?: number | null
          spam_warnings?: Json | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          click_count?: number
          created_at?: string
          first_opened_at?: string | null
          html?: string
          id?: string
          last_opened_at?: string | null
          open_count?: number
          owner_id?: string
          preview_text?: string | null
          recipient_email?: string
          send_error?: string | null
          sent_at?: string | null
          spam_score?: number | null
          spam_warnings?: Json | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          ip: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          ip?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          ip?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      increment_ad_view_count: { Args: { ad_slug: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
