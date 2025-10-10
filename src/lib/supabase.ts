import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
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
          file_url: string | null
          priority: string
          service_impacted: boolean
          start_time: string
          end_time: string
          creator: string
          status: string
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
          file_url?: string | null
          priority: string
          service_impacted: boolean
          start_time: string
          end_time: string
          creator: string
          status?: string
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
          file_url?: string | null
          priority?: string
          service_impacted?: boolean
          start_time?: string
          end_time?: string
          creator?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}
