export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          venue_id: string
          player_name: string
          player_phone: string
          player_email: string | null
          booking_date: string
          start_time: string
          end_time: string
          total_hours: number
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          whatsapp_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          player_name: string
          player_phone: string
          player_email?: string | null
          booking_date: string
          start_time: string
          end_time: string
          total_hours: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          whatsapp_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          player_name?: string
          player_phone?: string
          player_email?: string | null
          booking_date?: string
          start_time?: string
          end_time?: string
          total_hours?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          whatsapp_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          whatsapp_number: string | null
          role: 'venue_owner' | 'player' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          role?: 'venue_owner' | 'player' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          whatsapp_number?: string | null
          role?: 'venue_owner' | 'player' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      venues: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          slug: string
          sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city: string
          province: string | null
          area: string | null
          sub_area: string | null
          address: string
          description: string | null
          amenities: string[] | null
          price_per_hour: number
          number_of_courts: number
          opening_time: string | null
          closing_time: string | null
          is_24_7: boolean
          whatsapp_number: string
          google_maps_url: string | null
          subdomain: string | null
          is_featured: boolean
          status: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured: boolean
          rating: number
          total_bookings: number
          logo_url: string | null
          tagline: string | null
          facebook_url: string | null
          instagram_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          slug: string
          sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city: string
          province?: string | null
          area?: string | null
          sub_area?: string | null
          address: string
          description?: string | null
          amenities?: string[] | null
          price_per_hour: number
          number_of_courts?: number
          opening_time?: string | null
          closing_time?: string | null
          is_24_7?: boolean
          whatsapp_number: string
          google_maps_url?: string | null
          subdomain?: string | null
          is_featured?: boolean
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured?: boolean
          rating?: number
          total_bookings?: number
          logo_url?: string | null
          tagline?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          slug?: string
          sport_type?: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel'
          city?: string
          province?: string | null
          area?: string | null
          sub_area?: string | null
          address?: string
          description?: string | null
          amenities?: string[] | null
          price_per_hour?: number
          number_of_courts?: number
          opening_time?: string | null
          closing_time?: string | null
          is_24_7?: boolean
          google_maps_url?: string | null
          subdomain?: string | null
          is_featured?: boolean
          whatsapp_number?: string
          status?: 'pending' | 'approved' | 'rejected' | 'inactive'
          featured?: boolean
          rating?: number
          total_bookings?: number
          logo_url?: string | null
          tagline?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_photos: {
        Row: {
          id: string
          venue_id: string
          photo_url: string
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          photo_url: string
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          photo_url?: string
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      review_reports: {
        Row: {
          id: string
          review_id: string
          venue_id: string
          reporter_id: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          review_id: string
          venue_id: string
          reporter_id: string
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          review_id?: string
          venue_id?: string
          reporter_id?: string
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "venue_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_reviews: {
        Row: {
          id: string
          venue_id: string
          customer_name: string
          customer_photo_url: string | null
          rating: number
          review_text: string
          photo_urls: string[] | null
          date: string
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          customer_name: string
          customer_photo_url?: string | null
          rating: number
          review_text: string
          photo_urls?: string[] | null
          date: string
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          customer_name?: string
          customer_photo_url?: string | null
          rating?: number
          review_text?: string
          photo_urls?: string[] | null
          date?: string
          is_featured?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      special_offers: {
        Row: {
          id: string
          venue_id: string
          offer_name: string
          description: string | null
          original_price: number
          offer_price: number
          discount_percentage: number | null
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          offer_name: string
          description?: string | null
          original_price: number
          offer_price: number
          discount_percentage?: number | null
          valid_from: string
          valid_until: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          offer_name?: string
          description?: string | null
          original_price?: number
          offer_price?: number
          discount_percentage?: number | null
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_offers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_pricing_rules: {
        Row: {
          id: string
          venue_id: string
          day_of_week: string
          start_time: string
          end_time: string
          price_per_hour: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          day_of_week: string
          start_time: string
          end_time: string
          price_per_hour: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          day_of_week?: string
          start_time?: string
          end_time?: string
          price_per_hour?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_pricing_rules_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      venue_loyalty_tiers: {
        Row: {
          id: string
          venue_id: string
          tier_name: string
          min_bookings: number
          discount_percent: number
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          tier_name: string
          min_bookings: number
          discount_percent: number
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          tier_name?: string
          min_bookings?: number
          discount_percent?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_loyalty_tiers_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_venue_slug: {
        Args: {
          venue_name: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: Record<string, never>
        Returns: void
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
