import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      accepters: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          form_id: string
          operator: string
          country: string
          issue: string
          issue_description: string
          kpis_affected: string
          counter_evaluation: string
          optimization_actions: string
          file_url: string[] | null
          priority: string
          start_time: string
          end_time: string | null
          creator: string
          phone_number: string
          status: string
          accepter_id: string | null
          response: string | null
          response_created_at: string | null
          response_updated_at: string | null
          response_images: string | null
          response_files: string | null
          is_response_read: boolean
          solution: string | null
          solution_created_at: string | null
          solution_updated_at: string | null
          solution_images: string | null
          solution_files: string | null
          created_at: string
        }
        Insert: {
          id?: string
          form_id?: string
          operator: string
          country: string
          issue: string
          issue_description: string
          kpis_affected: string
          counter_evaluation: string
          optimization_actions: string
          file_url?: string[] | null
          priority: string
          start_time: string
          end_time?: string | null
          creator: string
          phone_number: string
          status?: string
          accepter_id?: string | null
          response?: string | null
          response_created_at?: string | null
          response_updated_at?: string | null
          response_images?: string | null
          response_files?: string | null
          is_response_read?: boolean
          solution?: string | null
          solution_created_at?: string | null
          solution_updated_at?: string | null
          solution_images?: string | null
          solution_files?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          operator?: string
          country?: string
          issue?: string
          issue_description?: string
          kpis_affected?: string
          counter_evaluation?: string
          optimization_actions?: string
          file_url?: string[] | null
          priority?: string
          start_time?: string
          end_time?: string | null
          creator?: string
          phone_number?: string
          status?: string
          accepter_id?: string | null
          response?: string | null
          response_created_at?: string | null
          response_updated_at?: string | null
          response_images?: string | null
          response_files?: string | null
          is_response_read?: boolean
          solution?: string | null
          solution_created_at?: string | null
          solution_updated_at?: string | null
          solution_images?: string | null
          solution_files?: string | null
          created_at?: string
        }
      }
    }
  }
}
