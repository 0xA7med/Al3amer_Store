import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Search, 
  Eye, 
  RefreshCw, 
  Download, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  User,
  Clock,
  CheckCircle,
  Settings,
  Truck,
  XCircle,
  Filter,
  BarChart3,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatCurrencySync } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { OrderWithDetails, OrderStatus, statusLabels, statusColors } from '@/types/order';
import type { ExtendedOrderWithDetails } from '@/components/orders/OrderDetailsDialog';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { Skeleton } from '@/components/ui/skeleton';


// أيقونات حالات الطلبات
const statusIcons = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  processing: <Settings className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <Package className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  returned: <RefreshCw className="h-4 w-4" />,
} as const;

// مكون اختيار الحالة الرئيسي مع معالجة الـ ref بشكل صحيح
const StatusSelect = forwardRef<HTMLButtonElement, {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}>(({ value, onValueChange, disabled, children }, ref) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger 
        ref={ref}
        className="h-8 w-8 p-0 border-0 shadow-none hover:bg-accent hover:text-accent-foreground"
      >
        <span className="sr-only">تغيير الحالة</span>
        <MoreHorizontal className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent align="end">
        <div className="px-1 py-1.5 text-xs font-medium text-muted-foreground mb-1">
          تغيير الحالة إلى:
        </div>
        {children}
      </SelectContent>
    </Select>
  );
});
StatusSelect.displayName = 'StatusSelect';

// خيارات حالة الطلب
const statusOptions: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'
];

// خيارات التبويبات
const tabOptions = [
  { value: 'all', label: 'الكل', count: 0 },
  { value: 'pending', label: 'قيد المراجعة', count: 0 },
  { value: 'processing', label: 'قيد التنفيذ', count: 0 },
  { value: 'shipped', label: 'تم الشحن', count: 0 },
  { value: 'delivered', label: 'تم التوصيل', count: 0 },
];

// خيارات الفترة الزمنية
const timeRangeOptions = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'آخر 30 يوم' },
  { value: 'all', label: 'كل الفترات' },
];

// خيارات ترتيب الطلبات
const sortOptions = [
  { value: 'created_at-desc', label: 'الأحدث أولاً' },
  { value: 'created_at-asc', label: 'الأقدم أولاً' },
  { value: 'total_amount-desc', label: 'الأعلى سعراً' },
  { value: 'total_amount-asc', label: 'الأقل سعراً' },
];

// خيارات طرق الدفع
const paymentOptions = [
  { value: 'all', label: 'كل الطرق' },
  { value: 'credit_card', label: 'بطاقة ائتمان' },
  { value: 'mada', label: 'مدى' },
  { value: 'apple_pay', label: 'آبل باي' },
  { value: 'cod', label: 'الدفع عند الاستلام' },
];

const OrdersAdmin: React.FC = () => {

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderWithDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('created_at-desc');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  // جلب الطلبات من قاعدة البيانات
  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setLoading(true);
      
      // استخدام الدالة المخصصة لجلب الطلبات
      const { data, error } = await supabase.rpc('get_admin_orders');
      
      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        toast.error('فشل في جلب الطلبات');
        return;
      }

      if (data) {
        const processedOrders = data.map((order: any) => ({
          ...order,
          // التأكد من وجود id
          id: order.id || order.order_id,
          // التأكد من وجود customer_name
          customer_name: order.customer_name || order.user?.full_name || 'غير محدد',
          customer_email: order.customer_email || order.user?.email || 'غير محدد',
          customer_phone: order.customer_phone || order.user?.phone || 'غير محدد',
          // الاحتفاظ بالتاريخ كنص للتوافق مع النوع
          created_at: order.created_at,
          updated_at: order.updated_at || null,
        }));
        
        setOrders(processedOrders);
        updateStats(processedOrders);
      }
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
      toast.error('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  // تحديث الإحصائيات
  const updateStats = useCallback((ordersList: OrderWithDetails[]) => {
    const total = ordersList.length;
    const pending = ordersList.filter(o => o.status === 'pending').length;
    const processing = ordersList.filter(o => o.status === 'processing').length;
    const shipped = ordersList.filter(o => o.status === 'shipped').length;
    const delivered = ordersList.filter(o => o.status === 'delivered').length;
    const cancelled = ordersList.filter(o => o.status === 'cancelled').length;
    const returned = ordersList.filter(o => o.status === 'returned').length;
    const totalRevenue = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const averageOrderValue = total > 0 ? totalRevenue / total : 0;

    setStats({
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      returned,
      totalRevenue,
      averageOrderValue,
    });
  }, []);

  // تحديث حالة الطلب
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return false;
    }

    try {
      setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('خطأ في تحديث الحالة:', error);
        toast.error('فشل في تحديث حالة الطلب');
        return false;
      }

      // تحديث الطلب محلياً
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));

      toast.success(`تم تحديث حالة الطلب إلى ${statusLabels[newStatus]}`);
      
      // إعادة جلب الطلبات لتحديث الإحصائيات
      await fetchOrders();
      return true;
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
      return false;
          } finally {
        setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
      }
  }, [fetchOrders]);

  // تصفية الطلبات
  useEffect(() => {
    let filtered = [...orders];

    // تصفية حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm)
      );
    }

    // تصفية حسب الحالة
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // تصفية حسب الفترة الزمنية
    if (selectedTimeRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (selectedTimeRange) {
        case 'today':
          filtered = filtered.filter(order => new Date(order.created_at) >= today);
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const dayBeforeYesterday = new Date(today);
          dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= dayBeforeYesterday && orderDate < today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.created_at) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setDate(monthAgo.getDate() - 30);
          filtered = filtered.filter(order => new Date(order.created_at) >= monthAgo);
          break;
      }
    }

    // تصفية حسب طريقة الدفع
    if (selectedPayment !== 'all') {
      filtered = filtered.filter(order => order.payment_method === selectedPayment);
    }

    // ترتيب الطلبات
    filtered.sort((a, b) => {
      const [field, direction] = selectedSort.split('-');
      
      if (field === 'created_at') {
        return direction === 'desc' 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      if (field === 'total_amount') {
        return direction === 'desc' 
          ? (b.total_amount || 0) - (a.total_amount || 0)
          : (a.total_amount || 0) - (b.total_amount || 0);
      }
      
      return 0;
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm, selectedStatus, selectedTimeRange, selectedSort, selectedPayment]);

  // جلب الطلبات عند تحميل المكون
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // حساب الطلبات المعروضة
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // تغيير الصفحة
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // تصدير البيانات
  const exportData = useCallback(() => {
    const csvContent = [
      ['رقم الطلب', 'اسم العميل', 'البريد الإلكتروني', 'الهاتف', 'الحالة', 'المبلغ الإجمالي', 'تاريخ الإنشاء', 'طريقة الدفع'],
      ...filteredOrders.map(order => [
        order.id,
        order.customer_name || '',
        order.customer_email || '',
        order.customer_phone || '',
        statusLabels[order.status],
                 formatCurrencySync(order.total_amount || 0, 'ج.م'),
        format(order.created_at, 'yyyy-MM-dd HH:mm', { locale: ar }),
        order.payment_method || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredOrders]);

  // تحديث عدد الطلبات في التبويبات
  const updateTabCounts = useCallback(() => {
    const counts = {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };

    tabOptions.forEach(tab => {
      tab.count = counts[tab.value as keyof typeof counts] || 0;
    });
  }, [orders]);

  useEffect(() => {
    updateTabCounts();
  }, [updateTabCounts]);

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
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة جميع طلبات العملاء وتتبع حالاتها
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
          </Button>
          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير البيانات
          </Button>
          <Button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
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
                                     {formatCurrencySync(stats.averageOrderValue, 'ج.م')}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الطلبات المعلقة</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              {tabOptions.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <span className="text-sm font-medium">{tab.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* الفلاتر */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">البحث</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في الطلبات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الفترة الزمنية</label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الترتيب</label>
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">طريقة الدفع</label>
                <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول الطلبات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>الطلبات ({filteredOrders.length})</span>
            <div className="text-sm text-gray-500">
              عرض {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, filteredOrders.length)} من {filteredOrders.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : (
                  currentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                                             <TableCell>
                         <div className="flex flex-col">
                           <Button
                             variant="link"
                             className="h-auto p-0 text-left font-medium hover:underline"
                             onClick={() => {
                               // هنا يمكن إضافة منطق لعرض طلبات العميل السابقة
                               toast.info(`سيتم إضافة صفحة طلبات العميل ${order.customer_name} قريباً`);
                             }}
                           >
                             {order.customer_name || 'غير محدد'}
                           </Button>
                           <span className="text-sm text-gray-500">{order.customer_email}</span>
                         </div>
                       </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {format(order.created_at, 'dd/MM/yyyy', { locale: ar })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(order.created_at, 'HH:mm', { locale: ar })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrencySync(order.total_amount || 0, 'ج.م')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${statusColors[order.status]} flex items-center gap-1`}
                        >
                          {statusIcons[order.status]}
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.payment_method === 'credit_card' && <CreditCard className="h-4 w-4" />}
                          {order.payment_method === 'mada' && <CreditCard className="h-4 w-4 text-green-600" />}
                          {order.payment_method === 'apple_pay' && <CreditCard className="h-4 w-4 text-blue-600" />}
                          {order.payment_method === 'cod' && <Package className="h-4 w-4 text-orange-600" />}
                          <span className="text-sm">
                            {paymentOptions.find(p => p.value === order.payment_method)?.label || order.payment_method}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order as ExtendedOrderWithDetails);
                                    setShowOrderDetails(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>عرض التفاصيل</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <StatusSelect
                                  value={order.status}
                                  onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus as OrderStatus)}
                                  disabled={updatingStatus[order.id]}
                                >
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        {statusIcons[status]}
                                        {statusLabels[status]}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </StatusSelect>
                              </TooltipTrigger>
                              <TooltipContent>تغيير الحالة</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                صفحة {currentPage} من {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تفاصيل الطلب */}
              <OrderDetailsDialog
          order={selectedOrder}
          isOpen={showOrderDetails}
          onOpenChange={setShowOrderDetails}
          onStatusChange={updateOrderStatus}
          isUpdating={updatingStatus}
        />
    </div>
  );
};

export default OrdersAdmin; 