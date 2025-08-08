import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';
import { Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, RefreshCw } from 'lucide-react';

// تعريف الأنواع
import type { ReactNode } from 'react';

declare module 'react' {
  interface Attributes {
    children?: ReactNode;
  }
}

// استيراد المكونات
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { OrderWithDetails, OrderStatus } from '@/lib/supabase/types';

interface OrdersTableProps {
  orders: OrderWithDetails[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
  onSelectOrder: (order: OrderWithDetails) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isUpdating: Record<string, boolean>;
}

type SortField = 'created_at' | 'total_amount' | 'order_number';
type SortDirection = 'asc' | 'desc';

export function OrdersTable({
  orders,
  onStatusChange,
  onSelectOrder,
  onRefresh,
  isLoading,
  isUpdating,
}: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{ key: SortField; direction: SortDirection }>({
    key: 'created_at',
    direction: 'desc',
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // الحالة الافتراضية للطلبات مع الترجمات
  const statusLabels: Record<OrderStatus, string> = {
    pending: t('pending', 'قيد المراجعة'),
    confirmed: t('confirmed', 'تم التأكيد'),
    processing: t('processing', 'قيد التنفيذ'),
    shipped: t('shipped', 'تم الشحن'),
    delivered: t('delivered', 'تم التوصيل'),
    cancelled: t('cancelled', 'ملغي'),
    returned: t('returned', 'مرتجع'),
  };

  // ألوان الحالات
  const statusColors: Record<OrderStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    returned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  // طرق الدفع
  const paymentMethods: Record<string, string> = {
    all: 'الكل',
    cash_on_delivery: 'الدفع عند الاستلام',
    paymob_card: 'بطاقة ائتمانية',
    paymob_wallet: 'محفظة إلكترونية',
    bank_transfer: 'تحويل بنكي',
  };

  // تصفية الطلبات
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      // تصفية حسب البحث
      const matchesSearch =
        searchTerm === '' ||
        order.order_number.toString().includes(searchTerm) ||
        order.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.phone?.includes(searchTerm) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // تصفية حسب الحالة
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // تصفية حسب طريقة الدفع
      const matchesPayment = paymentFilter === 'all' || order.payment_method === paymentFilter;

      // تصفية حسب النطاق الزمني
      const orderDate = new Date(order.created_at);
      const matchesDateRange =
        (!dateRange.from || orderDate >= dateRange.from) &&
        (!dateRange.to || orderDate <= new Date(dateRange.to.setHours(23, 59, 59, 999)));

      return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, dateRange]);

  // ترتيب الطلبات
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'total_amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'order_number':
          comparison = Number(a.order_number) - Number(b.order_number);
          break;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredOrders, sortConfig.key, sortConfig.direction]);

  // تغيير ترتيب الجدول
  const handleSort = (field: SortField) => {
    if (sortConfig.key === field) {
      setSortConfig(prev => ({
        ...prev,
        direction: prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setSortConfig({ key: field, direction: 'asc' });
    }
  };

  // تحديد/إلغاء تحديد كل الطلبات
  const toggleSelectAll = () => {
    if (selectedOrders.size === sortedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(sortedOrders.map((order) => order.id)));
    }
  };

  // تحديد/إلغاء تحديد طلب محدد
  const toggleSelectOrder = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  // تغيير حالة الطلبات المحددة
  const bulkUpdateStatus = async (newStatus: OrderStatus) => {
    const updates = Array.from(selectedOrders).map((orderId) => 
      onStatusChange(orderId, newStatus)
    );
    
    const results = await Promise.all(updates);
    const success = results.every(Boolean);
    
    if (success) {
      setSelectedOrders(new Set());
    }
  };

  // عرض أيقونة السهم للترتيب
  const renderSortIcon = (field: SortField) => {
    if (sortConfig.key !== field) return <ChevronUp className="w-4 h-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* شريط البحث والتصفية */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="ابحث برقم الطلب، اسم العميل، البريد أو الهاتف..."
            className="pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>تصفية</span>
                {(statusFilter !== 'all' || paymentFilter !== 'all' || dateRange.from || dateRange.to) && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">حالة الطلب</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                >
                  <option value="all">الكل</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                >
                  {Object.entries(paymentMethods).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">التاريخ من</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md text-sm"
                  value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      from: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">إلى</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md text-sm"
                  value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      to: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              
              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setDateRange({});
                  }}
                >
                  إعادة تعيين
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  تطبيق
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          {selectedOrders.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <span>إجراءات ({selectedOrders.size})</span>
                  <ChevronDown className="h-4 w-4 mr-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bulkUpdateStatus('confirmed')}>
                  تأكيد الطلبات
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus('processing')}>
                  جارٍ المعالجة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus('shipped')}>
                  تم الشحن
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdateStatus('delivered')}>
                  تم التوصيل
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => bulkUpdateStatus('cancelled')}>
                  إلغاء الطلبات
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* جدول الطلبات */}
      <div className="rounded-md border
      ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedOrders.size === sortedOrders.length && sortedOrders.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="تحديد الكل"
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-medium"
                  onClick={() => handleSort('order_number')}
                >
                  {renderSortIcon('order_number')}
                  رقم الطلب
                </Button>
              </TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-medium"
                  onClick={() => handleSort('created_at')}
                >
                  {renderSortIcon('created_at')}
                  التاريخ
                </Button>
              </TableHead>
              <TableHead>طريقة الدفع</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-medium"
                  onClick={() => handleSort('total_amount')}
                >
                  {renderSortIcon('total_amount')}
                  المبلغ
                </Button>
              </TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  لا توجد طلبات متطابقة مع معايير البحث
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleSelectOrder(order.id)}
                      aria-label={`تحديد الطلب ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.user?.full_name || 'زائر'}</span>
                      <span className="text-sm text-gray-500">{order.user?.phone || order.user?.email || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {(() => {
                        const formatDate = (dateString: string) => {
                          try {
                            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ar });
                          } catch (error) {
                            console.error('خطأ في تنسيق التاريخ:', error);
                            return 'تاريخ غير صالح';
                          }
                        };
                        return (
                          <div>
                            <span>{formatDate(order.created_at)}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(order.created_at), 'hh:mm a', { locale: ar })}
                            </span>
                          </div>
                        );
                      })()}
                        {format(new Date(order.created_at), 'hh:mm a', { locale: ar })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="px-2 py-1 border rounded-md text-xs font-medium">
                      {paymentMethods[order.payment_method as keyof typeof paymentMethods] || order.payment_method}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <div className={`${statusColors[order.status]} whitespace-nowrap text-xs font-medium rounded px-2 py-1`}>
                      {t(`status.${order.status}`, statusLabels[order.status])}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectOrder(order)}>
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {order.status !== 'confirmed' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'confirmed')}>
                            تأكيد الطلب
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'processing' && order.status !== 'cancelled' && order.status !== 'returned' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'processing')}>
                            جارٍ المعالجة
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'returned' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'shipped')}>
                            تم الشحن
                          </DropdownMenuItem>
                        )}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'returned' && (
                          <DropdownMenuItem onClick={() => onStatusChange(order.id, 'delivered')}>
                            تم التوصيل
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {order.status !== 'cancelled' && (
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => onStatusChange(order.id, 'cancelled')}
                          >
                            إلغاء الطلب
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* تذييل الجدول */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          إجمالي {filteredOrders.length} من {orders.length} طلب
        </div>
        <div className="flex items-center space-x-2">
          <span>الصفوف في الصفحة:</span>
          <select className="border rounded p-1">
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm">
              السابق
            </Button>
            <Button variant="outline" size="sm">
              التالي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون مساعد لعرض فاصل القوائم المنسدلة
function DropdownMenuSeparator() {
  return <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
}
