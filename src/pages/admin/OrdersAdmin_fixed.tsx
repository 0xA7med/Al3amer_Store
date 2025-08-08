import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Search, Filter as FilterIcon, X, Eye, RefreshCw, Check, X as XIcon, Truck, Package, CheckCircle, XCircle, Calendar, Download, MoreHorizontal, ArrowUpDown, CreditCard, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { OrderWithDetails, OrderStatus, statusLabels, statusColors, paymentMethods } from '@/types/order';
import { OrderDetailsDialog } from '@/components/orders/OrderDetailsDialog';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  
  // جلب الطلبات مع الفلاتر والترتيب
  const fetchOrders = useCallback(async (sortByParam: string) => {
    setLoading(true);
    setError(null);
    
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

      // محاكاة استدعاء API
      console.log('محاكاة استدعاء API...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة تأخير الشبكة
      
      // بيانات تجريبية
      const mockOrders: OrderWithDetails[] = [];
      setOrders(mockOrders);
      
    } catch (error) {
      console.error('حدث خطأ أثناء جلب الطلبات:', error);
      setError('حدث خطأ أثناء جلب الطلبات');
      toast.error('حدث خطأ أثناء جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPayment]);

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

  // تحديث حالة الطلب
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      setIsUpdating(prev => ({ ...prev, [orderId]: true }));
      
      // محاكاة تحديث حالة الطلب
      console.log(`تحديث حالة الطلب ${orderId} إلى ${status}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // تحديث حالة الطلب في القائمة
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );
      
      toast.success(`تم تحديث حالة الطلب إلى ${statusLabels[status] || status}`);
      return true;
    } catch (error) {
      console.error('فشل تحديث حالة الطلب:', error);
      toast.error('فشل تحديث حالة الطلب');
      return false;
    } finally {
      setIsUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  }, []);

  // فتح نافذة تفاصيل الطلب
  const openOrderDetails = useCallback((order: OrderWithDetails) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  // جلب الطلبات عند تحميل المكون
  useEffect(() => {
    fetchOrders(sortBy);
  }, [fetchOrders, sortBy]);

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إدارة الطلبات</h1>
            <p className="text-sm text-muted-foreground">
              عرض وإدارة طلبات المتجر
            </p>
          </div>
          
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
            
            <Button onClick={() => {}}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة طلب جديد
            </Button>
          </div>
        </div>

        {/* بقية الكود... */}
        
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
