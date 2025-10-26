export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          current_streak: number
          longest_streak: number
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          current_streak?: number
          longest_streak?: number
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          current_streak?: number
          longest_streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      submissions: {
        Row: {
          id: number
          created_at: string
          user_id: string
          date: string
          problem_name: string
          link: string | null
          difficulty: 'Easy' | 'Medium' | 'Hard'
          platform: string | null
          description: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          date: string
          problem_name: string
          link?: string | null
          difficulty: 'Easy' | 'Medium' | 'Hard'
          platform?: string | null
          description?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          date?: string
          problem_name?: string
          link?: string | null
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          platform?: string | null
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
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

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Submission = Database['public']['Tables']['submissions']['Row'];