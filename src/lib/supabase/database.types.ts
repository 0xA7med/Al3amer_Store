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
      orders: {
        Row: {
          id: string
          user_id: string | null
          order_number: string
          status: OrderStatus
          total_amount: number
          payment_method: string
          payment_status: string
          shipping_address: Json
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          order_number: string
          status?: OrderStatus
          total_amount: number
          payment_method: string
          payment_status?: string
          shipping_address: Json
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          order_number?: string
          status?: OrderStatus
          total_amount?: number
          payment_method?: string
          payment_status?: string
          shipping_address?: Json
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
      }
      // يمكنك إضافة المزيد من الجداول حسب الحاجة
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
      payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
      payment_method: 'cash_on_delivery' | 'paymob_card' | 'paymob_wallet' | 'bank_transfer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentMethod = Database['public']['Enums']['payment_method']
