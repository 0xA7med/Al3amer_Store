import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs';

// قراءة المتغيرات البيئية مع التعامل الآمن عند غيابها
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(envUrl && envKey);
if (!envUrl || !envKey) {
  console.error('[Supabase] Missing environment variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Running in degraded mode.');
}

// تكوين Supabase (قيمة افتراضية آمنة لتفادي تعطل التطبيق)
const supabaseUrl = envUrl || 'https://invalid.supabase.local';
const supabaseAnonKey = envKey || 'invalid-anon-key';

// تكوين خيارات العميل
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// إنشاء العميل مع معالجة الأخطاء
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// اختبار الاتصال
try {
  console.log('Supabase client initialized with URL:', supabaseUrl.substring(0, 30) + '...');
} catch (_) {
  // تجاهل في حال كانت القيمة قصيرة
}

// Database types
export interface Category {
  category_id: string
  name_ar: string
  name_en?: string
  description_ar?: string
  image_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  product_id: string
  title_ar: string
  title_en?: string
  short_desc_ar?: string
  short_desc_en?: string
  full_desc_ar?: string
  full_desc_en?: string
  price: number
  original_price?: number
  stock: number
  min_stock_alert: number
  category_id?: string
  category_name?: string
  technical_specs_ar?: string
  technical_specs_en?: string
  image_urls?: string[]
  thumbnail_url?: string
  video_review_links?: string[]
  whatsapp_message_text?: string
  discount_percentage: number
  discount_expiry_date?: string
  weight?: number
  dimensions?: string
  sku?: string
  barcode?: string
  tags?: string[]
  is_featured: boolean
  is_active: boolean
  view_count: number
  sale_count: number
  rating_average: number
  rating_count: number
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  customer_id: string
  phone: string
  full_name?: string
  email?: string
  governorate?: string
  city?: string
  address?: string
  postal_code?: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  is_active: boolean
  total_orders: number
  total_spent: number
  preferred_payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Order {
  order_id: string
  order_number: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  governorate: string
  city: string
  address: string
  postal_code?: string
  payment_method: 'cash_on_delivery' | 'paymob_card' | 'paymob_wallet' | 'bank_transfer'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  subtotal: number
  shipping_cost: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  currency: string
  notes?: string
  admin_notes?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  paymob_transaction_id?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  order_item_id: string
  order_id: string
  product_id?: string
  product_title: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_applied: number
  product_snapshot?: any
  created_at: string
}

export interface SiteSettings {
  setting_id: string
  setting_key: string
  setting_value?: string
  setting_type: 'text' | 'number' | 'boolean' | 'json'
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  message_id: string
  name: string
  email?: string
  phone?: string
  subject?: string
  message: string
  status: 'unread' | 'read' | 'replied' | 'archived'
  admin_reply?: string
  replied_by?: string
  replied_at?: string
  created_at: string
}

export interface CartItem {
  cart_id: string
  session_id?: string
  customer_id?: string
  product_id: string
  quantity: number
  added_at: string
  updated_at: string
}

// API functions for products
export const getProducts = async (isActive = true) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', isActive)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Product[]
}

export const getFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('view_count', { ascending: false })
    .limit(8)

  if (error) throw error
  return data as Product[]
}

export const getProductById = async (productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data as Product
}

export const getProductsByCategory = async (categoryName: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_name', categoryName)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Product[]
}

// API functions for categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data as Category[]
}

// API functions for site settings
export const getSiteSettings = async () => {
  if (!isSupabaseConfigured) {
    return [] as SiteSettings[];
  }
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('is_public', true)

  if (error) throw error
  return data as SiteSettings[]
}

export const getSiteSettingByKey = async (key: string) => {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('setting_key', key)
    .eq('is_public', true)
    .single()

  if (error) throw error
  return data as SiteSettings
}

export const updateSiteSetting = async (key: string, value: string | boolean | number) => {
  const { error } = await supabase
    .from('site_settings')
    .update({ setting_value: String(value) })
    .eq('setting_key', key);
  if (error) throw error;
  return true;
};

// API functions for orders
export const createOrder = async (orderData: Partial<Order>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export const createOrderItems = async (items: Partial<OrderItem>[]) => {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select()

  if (error) throw error
  return data as OrderItem[]
}

// API functions for contact messages
export const createContactMessage = async (messageData: Partial<ContactMessage>) => {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert([messageData])
    .select()
    .single()

  if (error) throw error
  return data as ContactMessage
}

// API functions for customers
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Customer[];
};

// Utility functions
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(price)
}

export const generateWhatsAppUrl = (phone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
}

// دالة تسجيل دخول الأدمن
export const adminLogin = async (email: string, password: string) => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .ilike('email', email)
    .single();
  if (error || !data) return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  const isMatch = await bcrypt.compare(password, data.password_hash);
  if (!isMatch) return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  await supabase.from('admins').update({ last_login: new Date().toISOString() }).eq('admin_id', data.admin_id);
  return { success: true, admin: data };
};

// جلب ملخص المبيعات لكل شهر
export const getMonthlySalesSummary = async (from?: string, to?: string) => {
  let query = supabase
    .from('orders')
    .select('total_amount, created_at')
    .order('created_at', { ascending: true });
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  const { data, error } = await query;
  if (error) throw error;
  // تجميع حسب الشهر
  const summary: { [month: string]: number } = {};
  data?.forEach((order: any) => {
    const date = new Date(order.created_at);
    const month = date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
    summary[month] = (summary[month] || 0) + (order.total_amount || 0);
  });
  return Object.entries(summary).map(([month, sales]) => ({ month, sales }));
};

// جلب عدد المنتجات حسب الفئة
export const getProductCountByCategory = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('category_name')
    .eq('is_active', true);
  if (error) throw error;
  const summary: { [cat: string]: number } = {};
  data?.forEach((p: any) => {
    const cat = p.category_name || 'غير محدد';
    summary[cat] = (summary[cat] || 0) + 1;
  });
  return Object.entries(summary).map(([name, value]) => ({ name, value }));
};
