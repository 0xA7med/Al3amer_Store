import { supabase } from './client';

export interface SalesData {
  month: string;
  sales: number;
  orders: number;
}

export interface ProductData {
  name: string;
  value: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  revenue: number;
  quantity: number;
}

export interface DailySales {
  date: string;
  amount: number;
  orders: number;
}

export interface InventoryStatus {
  id: string;
  name: string;
  sku: string;
  image?: string;
  currentStock: number;
  minStock: number;
  lastUpdated: string;
}

export const getMonthlySalesSummary = async (from?: string, to?: string): Promise<SalesData[]> => {
  try {
    let query = supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .eq('status', 'completed') // فقط الطلبات المكتملة
      .order('created_at', { ascending: false });

    if (from && to) {
      query = query.gte('created_at', from).lte('created_at', to);
    } else {
      // الافتراضي: آخر 6 أشهر
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      query = query.gte('created_at', sixMonthsAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // تجميع البيانات الشهرية
    const monthlyData = (data || []).reduce((acc: Record<string, SalesData>, order: any) => {
      if (!order.created_at) return acc;
      
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          sales: 0,
          orders: 0
        };
      }
      
      acc[monthKey].sales += Number(order.total_amount) || 0;
      acc[monthKey].orders += 1;
      
      return acc;
    }, {});

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('Error fetching monthly sales summary:', error);
    return [];
  }
};

export const getProductCountByCategory = async (): Promise<ProductData[]> => {
  try {
    // جلب عدد المنتجات في كل فئة من جدول العلاقة product_categories
    const { data: productCategories, error } = await supabase
      .from('product_categories')
      .select(`
        category:categories!inner(name_ar, name_en)
      `);

    if (error) throw error;

    // تجميع عدد المنتجات في كل فئة
    const categoryCounts = productCategories.reduce((acc: Record<string, number>, item: any) => {
      const categoryName = item.category?.name_ar || 'غير مصنف';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value: value as number
    }));
  } catch (error) {
    console.error('Error fetching product count by category:', error);
    return [];
  }
};

export const getTopSellingProducts = async (limit = 5, from?: string, to?: string): Promise<TopProduct[]> => {
  try {
    let query = supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        product_id,
        product:products (
          product_id,
          title_ar,
          title_en,
          price,
          sale_count
        ),
        order:orders!inner(created_at)
      `)
      .order('created_at', { foreignTable: 'orders', ascending: false });

    if (from && to) {
      query = query.gte('orders.created_at', from).lte('orders.created_at', to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process and aggregate the data
    const productMap = new Map();
    
    data.forEach((item: any) => {
      const productId = item.product_id;
      const product = item.product;
      const revenue = (item.price || 0) * (item.quantity || 0);
      
      if (productMap.has(productId)) {
        const existing = productMap.get(productId);
        existing.quantity += item.quantity || 0;
        existing.revenue += revenue;
      } else if (product) {
        productMap.set(productId, {
          id: productId,
          name: product.title_ar || product.title_en || 'منتج غير معروف',
          category: 'عام',
          quantity: item.quantity || 0,
          revenue: revenue
        });
      }
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    return [];
  }
};

export const getDailySales = async (from?: string, to?: string): Promise<DailySales[]> => {
  try {
    let query = supabase
      .from('orders')
      .select('created_at, total_amount, status')
      .eq('status', 'completed') // فقط الطلبات المكتملة
      .order('created_at', { ascending: false });

    if (from && to) {
      query = query.gte('created_at', from).lte('created_at', to);
    } else {
      // الافتراضي: آخر 30 يوم
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // تجميع البيانات اليومية
    const dailyData = (data || []).reduce((acc: Record<string, DailySales>, order: any) => {
      if (!order.created_at) return acc;
      
      const date = new Date(order.created_at);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          amount: 0,
          orders: 0
        };
      }
      
      acc[dateKey].amount += Number(order.total_amount) || 0;
      acc[dateKey].orders += 1;
      
      return acc;
    }, {});

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    return [];
  }
};

export const getInventoryStatus = async (): Promise<InventoryStatus[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('product_id, title_ar, title_en, sku, stock as current_stock, min_stock_alert as min_stock, updated_at, image_urls, thumbnail_url')
      .order('stock', { ascending: true });

    if (error) throw error;

    return (data || []).map((product: any) => ({
      id: product.product_id,
      name: product.title_ar || product.title_en || 'منتج بدون عنوان',
      sku: product.sku || 'N/A',
      image: product.thumbnail_url || (Array.isArray(product.image_urls) ? product.image_urls[0] : null),
      currentStock: Number(product.current_stock) || 0,
      minStock: Number(product.min_stock) || 0,
      lastUpdated: product.updated_at ? new Date(product.updated_at).toLocaleDateString('ar-SA') : 'غير معروف'
    }));
  } catch (error) {
    console.error('Error fetching inventory status:', error);
    return [];
  }
};

export const getSalesByCategory = async (from?: string, to?: string): Promise<{name: string; sales: number}[]> => {
  try {
    // جلب بيانات المبيعات مع معلومات الفئات
    let query = supabase
      .from('order_items')
      .select(`
        price,
        quantity,
        created_at,
        product:products!inner(
          product_id,
          title_ar,
          product_categories (
            category:categories!inner(name_ar, name_en)
          )
        )
      `)
      .not('product.product_categories', 'is', null);

    if (from && to) {
      query = query.gte('created_at', from).lte('created_at', to);
    }

    const { data, error } = await query;

    if (error) throw error;

    // تجميع المبيعات حسب الفئة
    const categorySales = (data || []).reduce((acc: Record<string, number>, item: any) => {
      const categories = item.product?.product_categories;
      const total = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      
      if (categories && categories.length > 0) {
        categories.forEach((cat: any) => {
          const categoryName = cat.category?.name_ar || 'غير مصنف';
          acc[categoryName] = (acc[categoryName] || 0) + total;
        });
      } else {
        acc['غير مصنف'] = (acc['غير مصنف'] || 0) + total;
      }
      
      return acc;
    }, {});

    return Object.entries(categorySales).map(([name, sales]) => ({
      name,
      sales: Number(sales) || 0
    }));
  } catch (error) {
    console.error('Error fetching sales by category:', error);
    return [];
  }
};
