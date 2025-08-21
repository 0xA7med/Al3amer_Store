import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings,
  Truck,
  XCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  CreditCard,
  Activity,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatCurrencySync } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueGrowth: number;
  orderGrowth: number;
}

interface ChartData {
  date: string;
  orders: number;
  revenue: number;
  customers: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // جلب إحصائيات لوحة التحكم
  const fetchDashboardStats = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setLoading(true);

      // جلب الطلبات
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

             // جلب العملاء
       const { data: customersData, error: customersError } = await supabase
         .from('users')
         .select('*');

       if (customersError) throw customersError;

      // جلب المنتجات
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // حساب الإحصائيات
      const orders = ordersData || [];
      const customers = customersData || [];
      const products = productsData || [];

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalCustomers = customers.length;
      const totalProducts = products.length;

      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const processingOrders = orders.filter(o => o.status === 'processing').length;
      const shippedOrders = orders.filter(o => o.status === 'shipped').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const returnedOrders = orders.filter(o => o.status === 'returned').length;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

      // حساب النمو
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentOrders = orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo);
      const previousOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      });

      const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const previousRevenue = previousOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const orderGrowth = previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0;

      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        returnedOrders,
        averageOrderValue,
        conversionRate,
        revenueGrowth,
        orderGrowth,
      });

      // إنشاء بيانات الرسم البياني
      const chartDataArray: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        
        chartDataArray.push({
          date: format(date, 'dd/MM', { locale: ar }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          customers: dayOrders.length > 0 ? 1 : 0,
        });
      }
      setChartData(chartDataArray);

      // جلب أفضل المنتجات
      const productSales = new Map<string, { sales: number; revenue: number; name: string; image?: string }>();
      
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach((item: any) => {
            const existing = productSales.get(item.product_id) || { sales: 0, revenue: 0, name: item.name || 'غير محدد', image: item.image };
            existing.sales += item.quantity || 0;
            existing.revenue += (item.price || 0) * (item.quantity || 0);
            productSales.set(item.product_id, existing);
          });
        }
      });

      const topProductsArray = Array.from(productSales.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          sales: data.sales,
          revenue: data.revenue,
          image: data.image,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      setTopProducts(topProductsArray);

      // جلب الطلبات الحديثة
      const recentOrdersArray = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          customer_name: order.customer_name || 'غير محدد',
          total_amount: order.total_amount || 0,
          status: order.status,
          created_at: order.created_at,
        }));

      setRecentOrders(recentOrdersArray);

    } catch (error) {
      console.error('خطأ في جلب إحصائيات لوحة التحكم:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // تحديث البيانات
  const refreshData = () => {
    fetchDashboardStats();
    toast.success('تم تحديث البيانات');
  };

  // ألوان الرسوم البيانية
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">لوحة تحكم المدير</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نظرة شاملة على أداء المتجر والإحصائيات
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.orderGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${stats.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.orderGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                     {formatCurrencySync(stats.totalRevenue, 'ج.م')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">العملاء</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                  معدل التحويل: {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المنتجات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProducts.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">
                                     متوسط قيمة الطلب: {formatCurrencySync(stats.averageOrderValue, 'ج.م')}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* حالة الطلبات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">حالة الطلبات</h3>
              <Badge variant="outline">{stats.totalOrders}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">قيد المراجعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.pendingOrders}</span>
                                     <Progress value={stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0} className="w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">قيد التنفيذ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.processingOrders}</span>
                                     <Progress value={stats.totalOrders > 0 ? (stats.processingOrders / stats.totalOrders) * 100 : 0} className="w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">تم الشحن</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.shippedOrders}</span>
                                     <Progress value={stats.totalOrders > 0 ? (stats.shippedOrders / stats.totalOrders) * 100 : 0} className="w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">تم التوصيل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{stats.deliveredOrders}</span>
                                     <Progress value={stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0} className="w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">أفضل المنتجات</h3>
              <Badge variant="outline">المبيعات</Badge>
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    <span className="text-sm truncate max-w-24">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{product.sales}</div>
                    <div className="text-xs text-gray-500">
                                             {formatCurrencySync(product.revenue, 'ج.م')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
                         <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold">الطلبات الحديثة</h3>
               <Badge variant="outline">آخر 5 طلبات</Badge>
             </div>
            <div className="space-y-3">
              {recentOrders.map((order, idx) => (
                <div key={order.id || idx} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{order.customer_name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(order.created_at), 'dd/MM HH:mm', { locale: ar })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                                             {formatCurrencySync(order.total_amount, 'ج.م')}
                    </div>
                                         <Badge variant="secondary" className="text-xs">
                       {order.status === 'delivered' ? 'تم التوصيل' : 
                        order.status === 'processing' ? 'قيد التنفيذ' : 
                        order.status === 'confirmed' ? 'مؤكد' : 
                        order.status === 'pending' ? 'قيد المراجعة' : 
                        order.status === 'shipped' ? 'تم الشحن' : 
                        order.status === 'cancelled' ? 'ملغي' : 
                        order.status === 'returned' ? 'مرتجع' : order.status}
                     </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              نشاط الطلبات والإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              توزيع الطلبات حسب الحالة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'قيد المراجعة', value: stats.pendingOrders, color: '#f59e0b' },
                { name: 'قيد التنفيذ', value: stats.processingOrders, color: '#3b82f6' },
                { name: 'تم الشحن', value: stats.shippedOrders, color: '#8b5cf6' },
                { name: 'تم التوصيل', value: stats.deliveredOrders, color: '#10b981' },
                { name: 'ملغي', value: stats.cancelledOrders, color: '#ef4444' },
                { name: 'مرتجع', value: stats.returnedOrders, color: '#6b7280' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ملخص سريع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ملخص سريع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                                 {stats.totalOrders > 0 ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-gray-600">معدل نجاح الطلبات</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                                 {stats.averageOrderValue > 0 ? formatCurrencySync(stats.averageOrderValue, 'ج.م') : '0'}
              </div>
              <div className="text-sm text-gray-600">متوسط قيمة الطلب</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.conversionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">معدل تحويل العملاء</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 