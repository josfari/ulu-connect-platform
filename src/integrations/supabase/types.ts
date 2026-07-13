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
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string
          id: string
          member_id: string
          note: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          contribution_date?: string
          created_at?: string
          id?: string
          member_id: string
          note?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string
          id?: string
          member_id?: string
          note?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number
          title: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          title?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          title?: string | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          interest_rate: number
          issued_date: string
          member_id: string
          note: string | null
          principal: number
          recorded_by: string | null
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          issued_date?: string
          member_id: string
          note?: string | null
          principal: number
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          issued_date?: string
          member_id?: string
          note?: string | null
          principal?: number
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          mpesa_code: string
          note: string | null
          paid_on: string
          payer_phone: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          member_id: string
          mpesa_code: string
          note?: string | null
          paid_on?: string
          payer_phone: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          mpesa_code?: string
          note?: string | null
          paid_on?: string
          payer_phone?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bio: string | null
          county: string | null
          created_at: string
          date_joined: string
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          full_name: string
          gender: string | null
          id: string
          id_back_path: string | null
          id_front_path: string | null
          membership_category: string
          membership_number: string | null
          national_id: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          occupation: string | null
          phone: string | null
          photo_url: string | null
          physical_location: string | null
          reason_for_joining: string | null
          role: string | null
          show_contact: boolean
          status: Database["public"]["Enums"]["member_status"]
          sub_county: string | null
          updated_at: string
          user_id: string | null
          ward: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          county?: string | null
          created_at?: string
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name: string
          gender?: string | null
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          membership_category?: string
          membership_number?: string | null
          national_id?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          physical_location?: string | null
          reason_for_joining?: string | null
          role?: string | null
          show_contact?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          sub_county?: string | null
          updated_at?: string
          user_id?: string | null
          ward?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bio?: string | null
          county?: string | null
          created_at?: string
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          membership_category?: string
          membership_number?: string | null
          national_id?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          physical_location?: string | null
          reason_for_joining?: string | null
          role?: string | null
          show_contact?: boolean
          status?: Database["public"]["Enums"]["member_status"]
          sub_county?: string | null
          updated_at?: string
          user_id?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          category: string
          created_at: string
          date_started: string | null
          description: string
          featured: boolean
          id: string
          image_url: string | null
          impact_summary: string | null
          progress: number
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          category?: string
          created_at?: string
          date_started?: string | null
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          impact_summary?: string | null
          progress?: number
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          category?: string
          created_at?: string
          date_started?: string | null
          description?: string
          featured?: boolean
          id?: string
          image_url?: string | null
          impact_summary?: string | null
          progress?: number
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          note: string | null
          recorded_by: string | null
          repayment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          note?: string | null
          recorded_by?: string | null
          repayment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          note?: string | null
          recorded_by?: string | null
          repayment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          footer_text: string | null
          hero_subtitle: string | null
          hero_title: string | null
          homepage_stats: Json
          id: string
          location: string | null
          logo_url: string | null
          mpesa_account: string | null
          mpesa_paybill: string | null
          mpesa_till: string | null
          org_name: string
          registration_fee: number
          socials: Json
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          homepage_stats?: Json
          id?: string
          location?: string | null
          logo_url?: string | null
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          org_name?: string
          registration_fee?: number
          socials?: Json
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          footer_text?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          homepage_stats?: Json
          id?: string
          location?: string | null
          logo_url?: string | null
          mpesa_account?: string | null
          mpesa_paybill?: string | null
          mpesa_till?: string | null
          org_name?: string
          registration_fee?: number
          socials?: Json
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string
          role_description: string | null
          show_contact: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role: string
          role_description?: string | null
          show_contact?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          role_description?: string | null
          show_contact?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
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
      approve_member: {
        Args: { _member_id: string }
        Returns: {
          membership_number: string
        }[]
      }
      generate_membership_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "editor" | "treasurer" | "viewer"
      loan_status: "active" | "repaid" | "defaulted"
      member_status:
        | "pending"
        | "active"
        | "executive"
        | "volunteer"
        | "inactive"
        | "pending_payment"
        | "payment_submitted"
        | "payment_verified"
        | "approved"
        | "rejected"
        | "suspended"
      post_status: "draft" | "published"
      project_status: "planned" | "ongoing" | "completed"
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
      app_role: ["super_admin", "admin", "editor", "treasurer", "viewer"],
      loan_status: ["active", "repaid", "defaulted"],
      member_status: [
        "pending",
        "active",
        "executive",
        "volunteer",
        "inactive",
        "pending_payment",
        "payment_submitted",
        "payment_verified",
        "approved",
        "rejected",
        "suspended",
      ],
      post_status: ["draft", "published"],
      project_status: ["planned", "ongoing", "completed"],
    },
  },
} as const
