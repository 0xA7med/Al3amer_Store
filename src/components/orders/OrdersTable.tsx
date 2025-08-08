import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TimeDisplay, DateDisplay } from '@/components/ui/TimeDisplay';
import { Search, Filter, ChevronDown, ChevronUp, MoreHorizontal, RefreshCw } from 'lucide-react';

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
    all: t('all'),
    cash_on_delivery: t('paymentMethods.cashOnDelivery', 'الدفع عند الاستلام'),
    paymob_card: t('paymentMethods.creditCard', 'بطاقة ائتمانية'),
    paymob_wallet: t('paymentMethods.eWallet', 'محفظة إلكترونية'),
    bank_transfer: t('paymentMethods.bankTransfer', 'تحويل بنكي'),
  };
  
  // مفاتيح حالات الطلب
  const orderStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
  ];

  // تحويل التاريخ إلى تنسيق مقروء
  const formatDate = (dateString: string) => {
    return <DateDisplay date={dateString} />;
  };

  // تصفية الطلبات
  const filteredOrders = useMemo(() => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="w-full bg-background pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="ml-2 h-4 w-4" />
                {t('filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2 space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">{t('status')}</p>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  >
                    <option value="all">{t('all')}</option>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`orderStatus.${status}`, status)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">{t('paymentMethod')}</p>
                  <select
                    className="w-full p-2 border rounded-md"
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
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOrders(new Set(filteredOrders.map((order) => order.id)));
                    } else {
                      setSelectedOrders(new Set());
                    }
                  }}
                  aria-label="تحديد الكل"
                />
              </TableHead>
              <TableHead className="w-[100px]" onClick={() => handleSort('order_number')}>
                <div className="flex items-center cursor-pointer">
                  {t('orderNumber')}
                  {renderSortIcon('order_number')}
                </div>
              </TableHead>
              <TableHead>{t('customer')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('paymentMethod')}</TableHead>
              <TableHead className="text-right" onClick={() => handleSort('total_amount')}>
                <div className="flex items-center justify-end cursor-pointer">
                  {t('amount')}
                  {renderSortIcon('total_amount')}
                </div>
              </TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.length > 0 ? (
              sortedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedOrders);
                        if (checked) {
                          newSelected.add(order.id);
                        } else {
                          newSelected.delete(order.id);
                        }
                        setSelectedOrders(newSelected);
                      }}
                      aria-label={`تحديد الطلب ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{order.user?.full_name || 'مجهول'}</div>
                    <div className="text-sm text-muted-foreground">{order.user?.phone || order.user?.email || '-'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatDate(order.created_at)}</span>
                      <TimeDisplay date={order.created_at} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="px-2 py-1 border rounded-md text-xs font-medium">
                      {paymentMethods[order.payment_method as keyof typeof paymentMethods] || order.payment_method}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-right">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <div className={`${statusColors[order.status]} whitespace-nowrap text-xs font-medium rounded px-2 py-1`}>
                      {t(`orderStatus.${order.status}`, order.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">فتح القائمة</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectOrder(order)}>
                          {t('viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/admin/orders/${order.id}/print`, '_blank')}>
                          {t('printInvoice')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onStatusChange(order.id, 'cancelled')}
                          disabled={isUpdating[order.id]}
                        >
                          {isUpdating[order.id] ? t('cancelling') : t('cancelOrder')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {t('noOrders')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// مكون مساعد لعرض فاصل القوائم المنسدلة
function DropdownMenuSeparator() {
  return <div className="-mx-2 my-1 h-px bg-muted" />;
}
