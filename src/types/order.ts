import { Order as BaseOrder } from '@/lib/supabase/types';

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    title_ar: string;
    title_en: string;
    image_url: string | null;
  };
}

// Define the base order interface that matches the database schema
export interface BaseOrder {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  payment_status: string;  // This should match the database type
  shipping_address: any;   // This will be overridden in OrderWithDetails
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface OrderWithDetails extends Omit<BaseOrder, 'shipping_address' | 'payment_status'> {
  // Override the payment_status to be more specific
  payment_status: 'paid' | 'pending' | 'failed' | string;
  
  // Make shipping_address more specific
  shipping_address: {
    city: string;
    address: string;
    notes?: string;
  } | string;
  
  // Add related data
  order_items: OrderItem[];
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  } | null;
  
  // Additional fields that might be added by the admin
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_status?: string;
  order_id?: string;
  transaction_id?: string;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  tax_amount?: number;
  tracking_number?: string;
  tracking_url?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'قيد المراجعة',
  confirmed: 'تم التأكيد',
  processing: 'قيد التنفيذ',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
  returned: 'مرتجع',
};

export const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  returned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export const paymentMethods: Record<string, string> = {
  cash_on_delivery: 'الدفع عند الاستلام',
  paymob_card: 'بطاقة ائتمانية',
  paymob_wallet: 'محفظة إلكترونية',
  bank_transfer: 'تحويل بنكي',
};
