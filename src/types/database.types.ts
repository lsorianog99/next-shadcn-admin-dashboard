/**
 * Database Types - Generados desde el schema de Supabase
 * Estos tipos proporcionan autocompletado completo para queries de Supabase
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string;
          name: string;
          model: string;
          system_prompt: string;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          model?: string;
          system_prompt: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          model?: string;
          system_prompt?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          whatsapp_phone: string;
          contact_name: string | null;
          status: string;
          agent_id: string | null;
          last_message_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          whatsapp_phone: string;
          contact_name?: string | null;
          status?: string;
          agent_id?: string | null;
          last_message_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          whatsapp_phone?: string;
          contact_name?: string | null;
          status?: string;
          agent_id?: string | null;
          last_message_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          content: string;
          role: string;
          message_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          content: string;
          role: string;
          message_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          content?: string;
          role?: string;
          message_type?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      products: {
        Row: {
          sku: string;
          name: string;
          description: string | null;
          price: number;
          cost: number;
          category: string | null;
          stock: number;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          sku: string;
          name: string;
          description?: string | null;
          price: number;
          cost: number;
          category?: string | null;
          stock?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sku?: string;
          name?: string;
          description?: string | null;
          price?: number;
          cost?: number;
          category?: string | null;
          stock?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          chat_id: string;
          quote_number: string;
          subtotal: number;
          tax: number;
          total: number;
          status: string;
          notes: string | null;
          metadata: Json;
          sent_at: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          quote_number?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          status?: string;
          notes?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          quote_number?: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          status?: string;
          notes?: string | null;
          metadata?: Json;
          sent_at?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_sku: string;
          product_name: string;
          quantity: number;
          unit_price: number;
          unit_cost: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_sku: string;
          product_name: string;
          quantity?: number;
          unit_price: number;
          unit_cost: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          product_sku?: string;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          unit_cost?: number;
          subtotal?: number;
          created_at?: string;
        };
      };
      webhooks_log: {
        Row: {
          id: string;
          event_type: string;
          payload: Json;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          payload: Json;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          payload?: Json;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
