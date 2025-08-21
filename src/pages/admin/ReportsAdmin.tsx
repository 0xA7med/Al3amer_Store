import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatCurrencySync } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface ReportData {
  // تقارير المبيعات
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesGrowth: number;
  orderGrowth: number;
  
  // تقارير المنتجات
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
  }>;
  
  // تقارير العملاء
  totalCustomers: number;
  newCustomers: number;
  customerGrowth: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    ordersCount: number;
  }>;
  
  // تقارير المخزون
  lowStockProducts: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
    image?: string;
  }>;
  
  // بيانات الرسوم البيانية
  salesChartData: Array<{
    date: string;
    sales: number;
    orders: number;
    customers: number;
  }>;
  
  // تقارير جغرافية
  topCities: Array<{
    city: string;
    orders: number;
    revenue: number;
  }>;
}

const ReportsAdmin: React.FC = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    salesGrowth: 0,
    orderGrowth: 0,
    topProducts: [],
    totalCustomers: 0,
    newCustomers: 0,
    customerGrowth: 0,
    topCustomers: [],
    lowStockProducts: [],
    salesChartData: [],
    topCities: [],
  });

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedReport, setSelectedReport] = useState<'sales' | 'products' | 'customers' | 'inventory'>('sales');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // جلب بيانات التقارير
  const fetchReportData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setLoading(true);

      // جلب الطلبات
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

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

      const orders = ordersData || [];
      const customers = customersData || [];
      const products = productsData || [];

      // حساب إحصائيات المبيعات
      const totalSales = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // حساب النمو
      const now = new Date();
      const periodStart = new Date(dateRange.start);
      const periodEnd = new Date(dateRange.end);
      const periodDuration = periodEnd.getTime() - periodStart.getTime();
      const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);
      const previousPeriodEnd = new Date(periodStart.getTime());

      const currentPeriodOrders = orders.filter(o => 
        new Date(o.created_at) >= periodStart && new Date(o.created_at) <= periodEnd
      );
      const previousPeriodOrders = orders.filter(o => 
        new Date(o.created_at) >= previousPeriodStart && new Date(o.created_at) < previousPeriodStart
      );

      const currentPeriodSales = currentPeriodOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const previousPeriodSales = previousPeriodOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const salesGrowth = previousPeriodSales > 0 ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100 : 0;
      const orderGrowth = previousPeriodOrders.length > 0 ? ((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 : 0;

      // أفضل المنتجات
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

      const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          sales: data.sales,
          revenue: data.revenue,
          image: data.image,
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10);

      // إحصائيات العملاء
      const totalCustomers = customers.length;
      const newCustomers = customers.filter(c => 
        new Date(c.created_at) >= periodStart && new Date(c.created_at) <= periodEnd
      ).length;

      const previousPeriodCustomers = customers.filter(c => 
        new Date(c.created_at) >= previousPeriodStart && new Date(c.created_at) < previousPeriodStart
      ).length;

      const customerGrowth = previousPeriodCustomers > 0 ? ((newCustomers - previousPeriodCustomers) / previousPeriodCustomers) * 100 : 0;

      // أفضل العملاء
      const customerSpending = new Map<string, { totalSpent: number; ordersCount: number; name: string }>();
      
      orders.forEach(order => {
        const customerId = order.customer_id;
        const existing = customerSpending.get(customerId) || { totalSpent: 0, ordersCount: 0, name: order.customer_name || 'غير محدد' };
        existing.totalSpent += order.total_amount || 0;
        existing.ordersCount += 1;
        customerSpending.set(customerId, existing);
      });

      const topCustomers = Array.from(customerSpending.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          totalSpent: data.totalSpent,
          ordersCount: data.ordersCount,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // المنتجات منخفضة المخزون
      const lowStockProducts = products
        .filter(p => p.stock_quantity <= (p.min_stock || 10))
        .map(p => ({
          id: p.id,
          name: p.name,
          currentStock: p.stock_quantity || 0,
          minStock: p.min_stock || 10,
          image: p.image,
        }))
        .slice(0, 10);

      // بيانات الرسم البياني
      const salesChartData = [];
      const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(periodStart.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        });
        
        salesChartData.push({
          date: format(date, 'dd/MM', { locale: ar }),
          sales: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          orders: dayOrders.length,
          customers: dayOrders.length > 0 ? 1 : 0,
        });
      }

      // أفضل المدن
      const cityOrders = new Map<string, { orders: number; revenue: number }>();
      
      orders.forEach(order => {
        const city = order.shipping_city || 'غير محدد';
        const existing = cityOrders.get(city) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += order.total_amount || 0;
        cityOrders.set(city, existing);
      });

      const topCities = Array.from(cityOrders.entries())
        .map(([city, data]) => ({
          city,
          orders: data.orders,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 10);

      setReportData({
        totalSales,
        totalOrders,
        averageOrderValue,
        salesGrowth,
        orderGrowth,
        topProducts,
        totalCustomers,
        newCustomers,
        customerGrowth,
        topCustomers,
        lowStockProducts,
        salesChartData,
        topCities,
      });

    } catch (error) {
      console.error('خطأ في جلب بيانات التقارير:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // تحديث البيانات
  const refreshData = () => {
    fetchReportData();
    toast.success('تم تحديث البيانات');
  };

  // تصدير التقرير
  const exportReport = (type: 'pdf' | 'excel' | 'csv') => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${selectedReport}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : type === 'csv' ? 'csv' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير التقرير بصيغة ${type.toUpperCase()}`);
  };

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // ألوان الرسوم البيانية
  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">التقارير والإحصائيات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            نظرة شاملة على أداء المتجر والمبيعات
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('excel')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* الفلاتر */}
        <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>الفترة الزمنية</Label>
              <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">آخر 7 أيام</SelectItem>
                  <SelectItem value="30d">آخر 30 يوم</SelectItem>
                  <SelectItem value="90d">آخر 90 يوم</SelectItem>
                  <SelectItem value="1y">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={selectedReport} onValueChange={(value: 'sales' | 'products' | 'customers' | 'inventory') => setSelectedReport(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">المبيعات</SelectItem>
                  <SelectItem value="products">المنتجات</SelectItem>
                  <SelectItem value="customers">العملاء</SelectItem>
                  <SelectItem value="inventory">المخزون</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs value={selectedReport} onValueChange={(value) => setSelectedReport(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            المبيعات
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            العملاء
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            المخزون
          </TabsTrigger>
        </TabsList>

        {/* تبويب المبيعات */}
        <TabsContent value="sales" className="space-y-6">
          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrencySync(reportData.totalSales, 'ج.م')}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {reportData.salesGrowth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${reportData.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(reportData.salesGrowth).toFixed(1)}%
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.totalOrders.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {reportData.orderGrowth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${reportData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(reportData.orderGrowth).toFixed(1)}%
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">متوسط قيمة الطلب</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrencySync(reportData.averageOrderValue, 'ج.م')}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
            </div>
          </CardContent>
        </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">العملاء الجدد</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{reportData.newCustomers.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {reportData.customerGrowth >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${reportData.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(reportData.customerGrowth).toFixed(1)}%
                      </span>
                    </div>
      </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      </div>
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
                  تطور المبيعات والطلبات
                </CardTitle>
                </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  أفضل المدن
                </CardTitle>
                </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={reportData.topCities}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8b5cf6" />
                  </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
        </TabsContent>

        {/* تبويب المنتجات */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                أفضل المنتجات مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">المبيعات: {product.sales}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                                                 {formatCurrencySync(product.revenue, 'ج.م')}
                              </div>
                      <Badge variant="secondary">{product.sales} وحدة</Badge>
                              </div>
                            </div>
                ))}
              </div>
                  </CardContent>
                </Card>
        </TabsContent>

        {/* تبويب العملاء */}
        <TabsContent value="customers" className="space-y-6">
                <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                أفضل العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-500">{customer.ordersCount} طلب</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                                                 {formatCurrencySync(customer.totalSpent, 'ج.م')}
                      </div>
                      <Badge variant="secondary">{customer.ordersCount} طلب</Badge>
                    </div>
                  </div>
                ))}
              </div>
                  </CardContent>
                </Card>
        </TabsContent>

        {/* تبويب المخزون */}
        <TabsContent value="inventory" className="space-y-6">
                <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                المنتجات منخفضة المخزون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.lowStockProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">الحد الأدنى: {product.minStock}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${product.currentStock <= product.minStock ? 'text-red-600' : 'text-orange-600'}`}>
                        {product.currentStock}
                      </div>
                      <Badge variant={product.currentStock <= product.minStock ? 'destructive' : 'secondary'}>
                        {product.currentStock <= product.minStock ? 'منخفض جداً' : 'منخفض'}
                      </Badge>
                    </div>
              </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsAdmin; 