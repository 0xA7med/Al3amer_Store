import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrencySync } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Package, ShoppingCart, DollarSign, ArrowRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { settings } = useSettings();
  const [stats, setStats] = React.useState({ products: 0, orders: 0, sales: 0 });
  const [salesData, setSalesData] = React.useState<any[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/admin-login');
  }, [authLoading, isAuthenticated, navigate]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isSupabaseConfigured) {
        setError('لوحة التحكم غير متصلة بقاعدة البيانات.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('order_id, total_amount, created_at, status, customer_details')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('product_id', { count: 'exact', head: true });

        if (productsError) throw productsError;

        const totalSales = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        setStats({
          products: productsCount || 0,
          orders: ordersData.length || 0,
          sales: totalSales,
        });

        const dailySales = ordersData
          .filter(order => new Date(order.created_at) >= sevenDaysAgo)
          .reduce((acc, order) => {
            const date = new Date(order.created_at).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' });
            acc[date] = (acc[date] || 0) + order.total_amount;
            return acc;
          }, {} as Record<string, number>);

        const chartData = Object.entries(dailySales).map(([date, sales]) => ({ date, sales })).reverse();
        setSalesData(chartData);

        setRecentOrders(ordersData.slice(0, 5));

      } catch (e: any) {
        setError('فشل في جلب بيانات لوحة التحكم: ' + e.message);
      }
      setLoading(false);
    };

    if (isAuthenticated) fetchDashboardData();
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>;
  }

  const chartConfig = {
    sales: { label: 'المبيعات', color: '#3b82f6' },
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <Link to="/admin/products/new">
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            إضافة منتج جديد
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencySync(stats.sales, settings.currency_symbol)}</div>
            <p className="text-xs text-muted-foreground">مجموع المبيعات الكلي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">مجموع الطلبات الكلي</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">المنتجات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">عدد المنتجات في المتجر</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات</CardTitle>
            <CardDescription>آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={salesData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis width={80} tickFormatter={(val) => formatCurrencySync(val as number, settings.currency_symbol)} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value) => formatCurrencySync(value as number, settings.currency_symbol)} />} />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>أحدث الطلبات</CardTitle>
            <Link to="/admin/orders">
              <Button variant="link" className="p-0 h-auto">
                عرض الكل
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.order_id} className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">
                      {order.customer_details?.name || 'زبون غير مسجل'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">
                      {formatCurrencySync(order.total_amount, settings.currency_symbol)}
                    </p>
                    <Badge className={`${statusStyles[order.status as OrderStatus] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard; 