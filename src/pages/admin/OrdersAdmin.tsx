import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Search, Filter as FilterIcon, X, Eye, RefreshCw, Check, X as XIcon, Truck, Package, CheckCircle, XCircle, Calendar, Download, MoreHorizontal, ArrowUpDown, CreditCard, Plus, Clock, Settings, PackageCheck } from 'lucide-react';
import { formatCurrencySync } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { OrderWithDetails, OrderStatus, statusLabels, statusColors, paymentMethods } from '@/types/order';
import type { ExtendedOrderWithDetails } from '@/components/orders/OrderDetailsDialog';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { motion } from 'framer-motion';
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
  { value: 'all', label: 'الكل' },
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'processing', label: 'قيد التنفيذ' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'delivered', label: 'تم التوصيل' },
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
  // حالة التحميل والأخطاء
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // حالة الفلاتر والبحث
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at_desc');
  
  // حالات إضافية
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderWithDetails | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  
  // تحديث حالة الطلب
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!orderId) return false;
    if (!isSupabaseConfigured) {
      toast.error('تغيير الحالة غير متاح حالياً بدون إعداد مفاتيح Supabase');
      return false;
    }
    
    try {
      setIsUpdating(prev => ({ ...prev, [orderId]: true }));
      
      // تحديث حالة الطلب في قاعدة البيانات
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('order_id', orderId);  // تم التغيير من 'id' إلى 'order_id'
      
      if (error) {
        console.error('خطأ في تحديث حالة الطلب:', error);
        toast.error('حدث خطأ أثناء تحديث حالة الطلب');
        return false;
      }
      
      // تحديث حالة الطلب في الواجهة
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                updated_at: new Date().toISOString()
              } 
            : order
        )
      );
      
      toast.success('تم تحديث حالة الطلب بنجاح');
      return true;
    } catch (error) {
      console.error('حدث خطأ غير متوقع:', error);
      toast.error('حدث خطأ غير متوقع');
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // جلب الطلبات مع الفلاتر والترتيب
  const fetchOrders = useCallback(async (sortByParam: string) => {
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setOrders([]);
      setError('لوحة الطلبات تعمل حالياً بدون اتصال بقاعدة البيانات. الرجاء تهيئة مفاتيح Supabase على Vercel');
      setLoading(false);
      return [];
    }
    
    try {
      console.log('جاري جلب الطلبات...');
      console.log('معايير الفرز:', { sortByParam, filterStatus, filterPayment });
      
      // تقسيم معاملات الفرز بشكل صحيح
      // استخراج قيم الترتيب
      const lastUnderscoreIndex = sortByParam.lastIndexOf('_');
      const sortField = sortByParam.substring(0, lastUnderscoreIndex) || 'created_at';
      const sortOrder = sortByParam.substring(lastUnderscoreIndex + 1) || 'desc';

      // استدعاء دالة RPC لجلب الطلبات
      console.log('استدعاء دالة get_admin_orders مع المعلمات:', {
        p_status: filterStatus || 'all',
        p_sort_by: sortField,
        p_sort_order: sortOrder,
      });

      const { data, error } = await supabase.rpc('get_admin_orders', {
        p_status: filterStatus || 'all',
        p_sort_by: sortField,
        p_sort_order: sortOrder,
      });

      if (error) {
        console.error('خطأ في جلب الطلبات:', error);
        throw new Error(`فشل جلب الطلبات: ${error.message}`);
      }

      console.log('تم استلام البيانات بنجاح:', data);
      
      // تنسيق البيانات لتتوافق مع النوع المتوقع في الواجهة
      const formattedData = (data || []).map((order: any) => {
        try {
          const formattedOrder = {
            ...order,
            // تعيين total_amount من total_price إذا كان غير محدد
            total_amount: order.total_amount || order.total_price || 0,
            // بناء user و order_items حسب هيكل الدالة
            user: order.user || { id: '', full_name: 'عميل غير معروف', email: '', phone: '' },
            order_items: (order.order_items || []).map((item: any) => ({
              ...item,
              product: item.product || { 
                id: '',
                title_ar: 'منتج غير معروف', 
                title_en: 'Unknown Product', 
                image_urls: [] 
              },
            })),
          };
          
          console.log('تم تنسيق الطلب:', formattedOrder.id);
          return formattedOrder;
        } catch (err) {
          console.error('خطأ في تنسيق بيانات الطلب:', order, err);
          return null;
        }
      }).filter(Boolean); // إزالة القيم الفارغة الناتجة عن الأخطاء

      setOrders(formattedData as OrderWithDetails[]);
      setError(null);
    } catch (err: any) {
      console.error('حدث خطأ في جلب الطلبات:', err);
      const errorMessage = err?.message || 'حدث خطأ غير معروف';
      console.error('تفاصيل الخطأ:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        error: err
      });
      
      setError(`حدث خطأ أثناء جلب الطلبات: ${errorMessage}`);
      toast.error(`خطأ: ${errorMessage}`);
      
      // إعادة تعيين حالة التحميل
      setLoading(false);
      return []; // إرجاع مصفوفة فارغة بدلاً من رمي الخطأ
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPayment, sortBy]);

  // جلب الطلبات عند تغيير معايير الفرز
  useEffect(() => {
    fetchOrders(sortBy);
  }, [sortBy, filterStatus, filterPayment, fetchOrders]);

  // تصفية الطلبات بناءً على معايير البحث والتصفية
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // تصفية حسب حالة الطلب
      if (filterStatus !== 'all' && order.status !== filterStatus) {
        return false;
      }
      
      // تصفية حسب طريقة الدفع
      if (filterPayment && filterPayment !== 'all' && order.payment_method !== filterPayment) {
        return false;
      }
      
      // تصفية حسب نص البحث
      if (search) {
        const searchLower = search.toLowerCase();
        const orderId = order.id || '';
        const customerName = (order as any).customer_name || '';
        const phoneNumber = (order as any).phone_number || '';
        
        const matchesSearch = 
          orderId.toString().toLowerCase().includes(searchLower) ||
          customerName.toLowerCase().includes(searchLower) ||
          phoneNumber.includes(search);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    });
  }, [orders, filterStatus, filterPayment, search]);
  
  // تحديث حالة الطلبات المحددة
  const handleBulkUpdateStatus = useCallback(async (status: OrderStatus) => {
    if (!isSupabaseConfigured) {
      toast.error('التعديل الجماعي غير متاح بدون إعداد Supabase');
      return;
    }
    const orderIds = orders
      .filter(order => selectedOrders.includes(order.id))
      .map(order => order.id);

    if (orderIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;

      // تحديث حالة الطلبات في القائمة
      setOrders(prev => prev.map(order => 
        orderIds.includes(order.id) ? { ...order, status } : order
      ));

      // مسح التحديد
      setSelectedOrders([]);
    } catch (err) {
      console.error('فشل تحديث حالات الطلبات:', err);
    }
  }, [orders, selectedOrders]);

  // فتح تفاصيل الطلب
  const handleViewOrderDetails = (order: OrderWithDetails) => {
    // Transform the order to match ExtendedOrderWithDetails
    const extendedOrder: ExtendedOrderWithDetails = {
      ...order,
      // Ensure all required fields are present
      customer_name: order.user?.full_name || order.customer_name,
      customer_email: order.user?.email || order.customer_email,
      customer_phone: order.user?.phone || order.customer_phone,
      // Ensure order_items has the correct structure
      order_items: order.order_items.map(item => ({
        ...item,
        // Map the product details to match the expected structure
        product: {
          title_ar: item.product?.title_ar || 'منتج غير معروف',
          title_en: item.product?.title_en || 'Unknown Product',
          image_url: item.product?.image_url || null
        }
      }))
    };
    setSelectedOrder(extendedOrder);
    setIsOrderDetailsOpen(true);
  };

  // إغلاق تفاصيل الطلب
  const closeOrderDetails = () => {
    setIsOrderDetailsOpen(false);
    // إعادة تحميل الطلبات بعد التحديث
    fetchOrders(sortBy);
  };
  
  // تحديث حالة الطلب
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      toast.error('تحديث الحالة غير متاح بدون إعداد Supabase');
      return false;
    }
    try {
      setIsUpdating(prev => ({ ...prev, [orderId]: true }));
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // تحديث حالة الطلب في القائمة
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      return true;
    } catch (err) {
      console.error('فشل تحديث حالة الطلب:', err);
      toast.error('فشل تحديث حالة الطلب');
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  }, []);

  // تحديث الطلب المحدد
  const refreshOrder = useCallback(async (orderId: string) => {
    if (!isSupabaseConfigured) {
      return null;
    }
    try {
      // جلب أحدث بيانات الطلب
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // تحديث حالة الطلب في القائمة
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, ...orderData } : order
        )
      );

      // إذا كان الطلب المحدد مفتوحاً، قم بتحديثه
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...orderData } : null);
      }

      return orderData;
    } catch (error) {
      console.error('فشل تحديث بيانات الطلب:', error);
      toast.error('فشل تحديث بيانات الطلب');
      return null;
    }
  }, [selectedOrder]);

  useEffect(() => {
    fetchOrders(sortBy);
  }, [fetchOrders, sortBy]);

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">إدارة الطلبات</h1>
          <p className="text-muted-foreground">عرض وإدارة طلبات المتجر</p>
        </div>
        
        {/* تبويبات حالة الطلبات */}
        <Tabs 
          defaultValue="all" 
          onValueChange={(value) => setFilterStatus(value as OrderStatus | 'all')}
          className="space-y-4"
        >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList className="grid w-full md:w-auto grid-cols-5">
            {tabOptions.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="py-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fetchOrders(sortBy)} 
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="sr-only">تحديث</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>تحديث القائمة</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                  <span className="sr-only">تصدير</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>تصدير البيانات</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* بطاقة الفلاتر والبحث */}
        <Card className="bg-white dark:bg-gray-800/50 border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث برقم الطلب أو اسم العميل..."
                  className="w-full bg-background pl-10 pr-4 h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as OrderStatus | 'all')}>
                <SelectTrigger className="w-full">
                  <FilterIcon className="ml-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="حالة الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          status === 'pending' ? 'bg-yellow-500' :
                          status === 'confirmed' ? 'bg-blue-500' :
                          status === 'processing' ? 'bg-purple-500' :
                          status === 'shipped' ? 'bg-indigo-500' :
                          status === 'delivered' ? 'bg-green-500' :
                          'bg-red-500'
                        }`} />
                        {statusLabels[status]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full">
                  <CreditCard className="ml-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                  <SelectValue placeholder="ترتيب النتائج" />
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
            
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center">
                <span className="hidden sm:inline ml-1">الفترة:</span>
                <Select defaultValue="week">
                  <SelectTrigger className="h-8 w-auto border-0 p-0 pl-1 text-sm font-medium text-foreground shadow-none hover:bg-accent hover:text-accent-foreground">
                    <Calendar className="ml-1 h-4 w-4 opacity-50" />
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </span>
              
              <span className="mx-2 text-muted-foreground/50">|</span>
              
              <span className="flex items-center">
                <span className="hidden sm:inline ml-1">إظهار:</span>
                <Select defaultValue="10">
                  <SelectTrigger className="h-8 w-16 border-0 p-0 pl-1 text-sm font-medium text-foreground shadow-none hover:bg-accent hover:text-accent-foreground">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="mr-1">عنصر</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* قائمة الطلبات */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-[120px] text-right font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-end gap-2">
                      <span>رقم الطلب</span>
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-medium text-gray-500 dark:text-gray-400">العميل</TableHead>
                  <TableHead className="text-right font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-end gap-2">
                      <span>التاريخ</span>
                      <Calendar className="h-3.5 w-3.5 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-end gap-2">
                      <span>المجموع</span>
                      <span>ر.س</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-medium text-gray-500 dark:text-gray-400">طريقة الدفع</TableHead>
                  <TableHead className="text-right font-medium text-gray-500 dark:text-gray-400">الحالة</TableHead>
                  <TableHead className="w-[150px] text-right font-medium text-gray-500 dark:text-gray-400">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">#{order.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ar })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{(order as any).customer_name || 'عميل'}</span>
                        <span className="text-xs text-muted-foreground">{(order as any).customer_email || ''}</span>
                        <span className="text-xs text-muted-foreground">{(order as any).customer_phone || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm">
                          {format(new Date(order.created_at), 'dd MMM yyyy', { locale: ar })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), 'hh:mm a', { locale: ar })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencySync(order.total_amount, 'ر.س', 2)}
                      {(order as any).discount_amount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          خصم {formatCurrencySync((order as any).discount_amount, 'ر.س', 2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="capitalize border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 text-foreground rounded-md px-2 py-1 text-xs"
                      >
                        {paymentMethods[order.payment_method as keyof typeof paymentMethods] || order.payment_method || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <div 
                          className={`${statusColors[order.status]} px-2.5 py-1 text-xs font-medium rounded-md`}
                        >
                          <span className="flex items-center gap-1.5">
                            {statusIcons[order.status]}
                            {statusLabels[order.status]}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">عرض التفاصيل</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">عرض التفاصيل</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <StatusSelect
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                              disabled={isUpdating[order.id]}
                            >
                              {statusOptions.map((status) => (
                                <SelectItem 
                                  key={status} 
                                  value={status}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${
                                      status === 'pending' ? 'bg-yellow-500' :
                                      status === 'confirmed' ? 'bg-blue-500' :
                                      status === 'processing' ? 'bg-purple-500' :
                                      status === 'shipped' ? 'bg-indigo-500' :
                                      status === 'delivered' ? 'bg-green-500' :
                                      'bg-red-500'
                                    }`} />
                                    {statusLabels[status]}
                                  </div>
                                </SelectItem>
                              ))}
                            </StatusSelect>
                          </TooltipTrigger>
                          <TooltipContent side="left">تغيير الحالة</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* تذييل الجدول */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="text-sm text-muted-foreground">
              عرض <span className="font-medium">1</span> إلى <span className="font-medium">{filteredOrders.length}</span> من{' '}
              <span className="font-medium">{filteredOrders.length}</span> طلب
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm" disabled>
                السابق
              </Button>
              <Button variant="outline" size="sm" disabled>
                التالي
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            {search || filterStatus !== 'all' || filterPayment !== 'all'
              ? 'لا توجد نتائج للبحث'
              : 'لا توجد طلبات حتى الآن'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {search || filterStatus !== 'all' || filterPayment !== 'all'
              ? 'لم نتمكن من العثور على أي طلبات تطابق معايير البحث المحددة. حاول تغيير الفلاتر أو مسحها للعثور على ما تبحث عنه.'
              : 'عندما يقوم العملاء بعمل طلبات، ستظهر هنا. تأكد من أن متجرك جاهز لاستقبال الطلبات.'}
          </p>
          
          <div className="flex justify-center gap-3">
            {(search || filterStatus !== 'all' || filterPayment !== 'all') ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterPayment('all');
                }}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            ) : (
              <Button variant="outline" onClick={() => fetchOrders(sortBy)} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                تحديث القائمة
              </Button>
            )}
            
            {!search && filterStatus === 'all' && filterPayment === 'all' && (
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                إضافة طلب جديد
              </Button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* نافذة عرض تفاصيل الطلب */}
      <OrderDetailsDialog
        isOpen={isOrderDetailsOpen}
        onOpenChange={setIsOrderDetailsOpen}
        order={selectedOrder}
        onStatusChange={handleUpdateOrderStatus}
        isUpdating={isUpdating}
      />
      </div>
    </TooltipProvider>
  );
};

export default OrdersAdmin; 