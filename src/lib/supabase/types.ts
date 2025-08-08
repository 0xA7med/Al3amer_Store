import { Database } from './database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// أنواع الطلبات
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderWithDetails extends Order {
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      title_ar: string;
      title_en: string;
      image_url: string | null;
    };
  }>;
  user: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
  shipping_address: {
    city: string;
    address: string;
    notes?: string;
  };
}

// إعدادات الموقع
export type SiteSetting = {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
};

// أنواع المستخدمين
export type UserRole = 'admin' | 'user' | 'vendor';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// أنواع المنتجات
// يمكنك إضافة المزيد من الأنواع حسب الحاجة
