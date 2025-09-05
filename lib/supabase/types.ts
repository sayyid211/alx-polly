// Supabase database types
import { Database } from '@supabase/supabase-js';

export type Tables = Database['public']['Tables'];

// Profiles table types
export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

// Polls table types
export type Poll = Tables['polls']['Row'];
export type PollInsert = Tables['polls']['Insert'];
export type PollUpdate = Tables['polls']['Update'];

// Votes table types
export type Vote = Tables['votes']['Row'];
export type VoteInsert = Tables['votes']['Insert'];
export type VoteUpdate = Tables['votes']['Update'];

// Database schema definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      polls: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          options: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          options: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          options?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string | null;
          option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id?: string | null;
          option_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string | null;
          option_index?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_poll_results: {
        Args: { poll_id: string };
        Returns: { option_index: number; count: number }[];
      };
      has_user_voted: {
        Args: { poll_id: string; user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};