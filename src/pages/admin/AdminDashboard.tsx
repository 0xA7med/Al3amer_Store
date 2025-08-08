import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    products: 0,
    orders: 0,
    sales: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // جلب عدد المنتجات
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('product_id', { count: 'exact', head: true });
        // جلب عدد الطلبات وإجمالي المبيعات
        const { data: ordersData, count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount', { count: 'exact' });
        if (productsError || ordersError) {
          setError('فشل في جلب الإحصائيات');
        } else {
          const totalSales = ordersData?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
          setStats({
            products: productsCount || 0,
            orders: ordersCount || 0,
            sales: totalSales,
          });
        }
      } catch (e) {
        setError('حدث خطأ أثناء جلب البيانات');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'عدد المنتجات',
      value: stats.products,
      link: '/admin/products',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'عدد الطلبات',
      value: stats.orders,
      link: '/admin/orders',
      color: 'bg-green-100 text-green-800',
    },
    {
      label: 'إجمالي المبيعات',
      value: stats.sales.toLocaleString('ar-EG') + ' ج.م',
      link: '/admin/reports',
      color: 'bg-yellow-100 text-yellow-800',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat, i) => (
            <Link to={stat.link} key={i} className="block">
              <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className={`text-lg font-semibold ${stat.color}`}>{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2 text-center">{stat.value}</div>
                  <Button variant="outline" className="w-full mt-4">عرض التفاصيل</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Link to="/admin/products">
          <Button className="w-full">إدارة المنتجات</Button>
        </Link>
        <Link to="/admin/orders">
          <Button className="w-full">إدارة الطلبات</Button>
        </Link>
        <Link to="/admin/reports">
          <Button className="w-full">التقارير والإحصائيات</Button>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard; 