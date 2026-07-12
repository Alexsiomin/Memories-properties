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
      assistant_memory: {
        Row: {
          created_at: string
          preferences: Json
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferences?: Json
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferences?: Json
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_settings: {
        Row: {
          enabled: boolean
          greeting: string
          id: string
          model: string
          singleton: boolean
          system_prompt: string
          temperature: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          greeting?: string
          id?: string
          model?: string
          singleton?: boolean
          system_prompt?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          greeting?: string
          id?: string
          model?: string
          singleton?: boolean
          system_prompt?: string
          temperature?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      auth_modal_settings: {
        Row: {
          benefits: Json
          button_text: string
          divider_text: string
          heading: string
          singleton: boolean
          subheading: string
          terms_text: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          button_text?: string
          divider_text?: string
          heading?: string
          singleton?: boolean
          subheading?: string
          terms_text?: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          button_text?: string
          divider_text?: string
          heading?: string
          singleton?: boolean
          subheading?: string
          terms_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_words: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      client_activities: {
        Row: {
          actor_id: string | null
          body: string | null
          client_id: string
          created_at: string
          id: string
          metadata: Json
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          client_id: string
          created_at?: string
          id?: string
          metadata?: Json
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          client_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tasks: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          looking_for: string
          min_baths: number | null
          min_beds: number | null
          min_plot_size: number | null
          min_size: number | null
          must_have_features: string[]
          notes: string | null
          phone: string | null
          pipeline_stage: string
          preferred_categories: string[]
          preferred_category: string | null
          preferred_regions: string[]
          status: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          looking_for?: string
          min_baths?: number | null
          min_beds?: number | null
          min_plot_size?: number | null
          min_size?: number | null
          must_have_features?: string[]
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string
          preferred_categories?: string[]
          preferred_category?: string | null
          preferred_regions?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          looking_for?: string
          min_baths?: number | null
          min_beds?: number | null
          min_plot_size?: number | null
          min_size?: number | null
          must_have_features?: string[]
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string
          preferred_categories?: string[]
          preferred_category?: string | null
          preferred_regions?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          metadata: Json
          name: string | null
          phone: string | null
          preferred_date: string | null
          preferred_time: string | null
          property_id: string | null
          property_title: string | null
          status: string
          subject: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          name?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
          subject?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          name?: string | null
          phone?: string | null
          preferred_date?: string | null
          preferred_time?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
          subject?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      developers: {
        Row: {
          created_at: string
          feed_format: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          xml_url: string | null
        }
        Insert: {
          created_at?: string
          feed_format?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          xml_url?: string | null
        }
        Update: {
          created_at?: string
          feed_format?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          xml_url?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          message: string | null
          phone: string
          property_type: string | null
          region: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          message?: string | null
          phone: string
          property_type?: string | null
          region?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          message?: string | null
          phone?: string
          property_type?: string | null
          region?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          property_image: string | null
          property_location: string | null
          property_price: string | null
          property_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          property_image?: string | null
          property_location?: string | null
          property_price?: string | null
          property_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          property_image?: string | null
          property_location?: string | null
          property_price?: string | null
          property_title?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          numeric_value: number | null
          numeric_x: number | null
          numeric_y: number | null
          section: string
          sort_order: number
          sub: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          numeric_value?: number | null
          numeric_x?: number | null
          numeric_y?: number | null
          section: string
          sort_order?: number
          sub?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          numeric_value?: number | null
          numeric_x?: number | null
          numeric_y?: number | null
          section?: string
          sort_order?: number
          sub?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_alerts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          property_id: string
          score: number
          seen_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          property_id: string
          score?: number
          seen_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          property_id?: string
          score?: number
          seen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_alerts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          property_slug: string | null
          referrer: string | null
          session_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          property_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          property_slug?: string | null
          referrer?: string | null
          session_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          dob: string | null
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          phone_country: string | null
          phone_number: string | null
          situation: string | null
          updated_at: string
          whatsapp_verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          phone_country?: string | null
          phone_number?: string | null
          situation?: string | null
          updated_at?: string
          whatsapp_verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          phone_country?: string | null
          phone_number?: string | null
          situation?: string | null
          updated_at?: string
          whatsapp_verified?: boolean
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line: string | null
          available_from: string | null
          baths: number | null
          beds: number | null
          category: string
          city: string | null
          client_id: string | null
          condition: string | null
          cooling: string | null
          country: string | null
          cover_image: string | null
          covered_verandas: string | null
          created_at: string
          deposit_value: number | null
          description: string | null
          developer_id: string | null
          district: string | null
          energy_rating: string | null
          external_ref: string | null
          floor: number | null
          furnished: string | null
          heating: string | null
          hoa_fees: string | null
          id: string
          image_key: string
          images: string[]
          internal_area: string | null
          latitude: number | null
          listing_type: string
          location: string
          longitude: number | null
          lot_size: string | null
          orientation: string | null
          parking_spaces: number | null
          pet_friendly: boolean
          postal_code: string | null
          price: string
          price_value: number
          reference_code: string | null
          region: string | null
          seller_type: string
          share_description: string | null
          share_image: string | null
          share_title: string | null
          size: string | null
          slug: string | null
          sort_order: number
          status: string
          tags: string[]
          title: string
          total_floors: number | null
          updated_at: string
          vat_included: boolean
          year_built: number | null
          yield: string | null
        }
        Insert: {
          address_line?: string | null
          available_from?: string | null
          baths?: number | null
          beds?: number | null
          category: string
          city?: string | null
          client_id?: string | null
          condition?: string | null
          cooling?: string | null
          country?: string | null
          cover_image?: string | null
          covered_verandas?: string | null
          created_at?: string
          deposit_value?: number | null
          description?: string | null
          developer_id?: string | null
          district?: string | null
          energy_rating?: string | null
          external_ref?: string | null
          floor?: number | null
          furnished?: string | null
          heating?: string | null
          hoa_fees?: string | null
          id?: string
          image_key: string
          images?: string[]
          internal_area?: string | null
          latitude?: number | null
          listing_type?: string
          location: string
          longitude?: number | null
          lot_size?: string | null
          orientation?: string | null
          parking_spaces?: number | null
          pet_friendly?: boolean
          postal_code?: string | null
          price: string
          price_value: number
          reference_code?: string | null
          region?: string | null
          seller_type?: string
          share_description?: string | null
          share_image?: string | null
          share_title?: string | null
          size?: string | null
          slug?: string | null
          sort_order?: number
          status: string
          tags?: string[]
          title: string
          total_floors?: number | null
          updated_at?: string
          vat_included?: boolean
          year_built?: number | null
          yield?: string | null
        }
        Update: {
          address_line?: string | null
          available_from?: string | null
          baths?: number | null
          beds?: number | null
          category?: string
          city?: string | null
          client_id?: string | null
          condition?: string | null
          cooling?: string | null
          country?: string | null
          cover_image?: string | null
          covered_verandas?: string | null
          created_at?: string
          deposit_value?: number | null
          description?: string | null
          developer_id?: string | null
          district?: string | null
          energy_rating?: string | null
          external_ref?: string | null
          floor?: number | null
          furnished?: string | null
          heating?: string | null
          hoa_fees?: string | null
          id?: string
          image_key?: string
          images?: string[]
          internal_area?: string | null
          latitude?: number | null
          listing_type?: string
          location?: string
          longitude?: number | null
          lot_size?: string | null
          orientation?: string | null
          parking_spaces?: number | null
          pet_friendly?: boolean
          postal_code?: string | null
          price?: string
          price_value?: number
          reference_code?: string | null
          region?: string | null
          seller_type?: string
          share_description?: string | null
          share_image?: string | null
          share_title?: string | null
          size?: string | null
          slug?: string | null
          sort_order?: number
          status?: string
          tags?: string[]
          title?: string
          total_floors?: number | null
          updated_at?: string
          vat_included?: boolean
          year_built?: number | null
          yield?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_alert_matches: {
        Row: {
          alert_id: string
          created_at: string
          email: string
          emailed_at: string | null
          id: string
          property_id: string
          property_slug: string | null
          property_title: string | null
          seen_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_id: string
          created_at?: string
          email: string
          emailed_at?: string | null
          id?: string
          property_id: string
          property_slug?: string | null
          property_title?: string | null
          seen_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string
          created_at?: string
          email?: string
          emailed_at?: string | null
          id?: string
          property_id?: string
          property_slug?: string | null
          property_title?: string | null
          seen_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_alert_matches_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "property_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_alert_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_alerts: {
        Row: {
          active: boolean
          budget_max: number | null
          budget_min: number | null
          categories: string[] | null
          created_at: string
          email: string
          filters: Json
          id: string
          label: string | null
          last_notified_at: string | null
          listing_type: string | null
          min_baths: number | null
          min_beds: number | null
          regions: string[] | null
          tags: string[] | null
          unsubscribe_token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          budget_max?: number | null
          budget_min?: number | null
          categories?: string[] | null
          created_at?: string
          email: string
          filters?: Json
          id?: string
          label?: string | null
          last_notified_at?: string | null
          listing_type?: string | null
          min_baths?: number | null
          min_beds?: number | null
          regions?: string[] | null
          tags?: string[] | null
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          budget_max?: number | null
          budget_min?: number | null
          categories?: string[] | null
          created_at?: string
          email?: string
          filters?: Json
          id?: string
          label?: string | null
          last_notified_at?: string | null
          listing_type?: string | null
          min_baths?: number | null
          min_beds?: number | null
          regions?: string[] | null
          tags?: string[] | null
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      property_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          property_id: string
          property_title: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          property_id: string
          property_title?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          property_id?: string
          property_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_status_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          mode: string | null
          name: string
          query: string | null
          region: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          mode?: string | null
          name: string
          query?: string | null
          region?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          mode?: string | null
          name?: string
          query?: string | null
          region?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          noindex: boolean
          og_image: string | null
          path: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          noindex?: boolean
          og_image?: string | null
          path: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          noindex?: boolean
          og_image?: string | null
          path?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tour_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          preferred_date: string
          preferred_time: string
          property_id: string
          status: string
          tour_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date: string
          preferred_time: string
          property_id: string
          status?: string
          tour_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          preferred_date?: string
          preferred_time?: string
          property_id?: string
          status?: string
          tour_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      compute_property_alert_matches: {
        Args: { _property_id: string }
        Returns: undefined
      }
      compute_property_matches: {
        Args: { _property_id: string }
        Returns: undefined
      }
      generate_property_ref_code: { Args: never; Returns: string }
      get_assistant_public: {
        Args: never
        Returns: {
          enabled: boolean
          greeting: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
