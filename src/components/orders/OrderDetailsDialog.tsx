import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { X, Package, Truck, CreditCard, MapPin, User, Phone, Mail, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatCurrencySync } from '@/lib/utils';
import type { OrderStatus, OrderWithDetails } from '@/types/order';

// Extended type based on OrderWithDetails with additional UI-specific properties
export type ExtendedOrderWithDetails = Omit<OrderWithDetails, 'order_items'> & {
  // Add any additional UI-specific properties here
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address: {
    city: string;
    address: string;
    notes?: string;
  } | string;
  // Ensure these are properly typed
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  tax_amount?: number;
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  order_items: Array<{
    id: string;
    product: {
      title_ar: string;
      title_en: string;
      image_url: string | null;
    };
    quantity: number;
    price: number;
  }>;
}

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: ExtendedOrderWithDetails | null;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;
  isUpdating: Record<string, boolean>;
}

const OrderDetailsDialogComponent = ({
  isOpen,
  onOpenChange,
  order,
  onStatusChange,
  isUpdating = {},
}: OrderDetailsDialogProps) => {
  // Render nothing if no order is provided
  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            لا يوجد طلب محدد للعرض
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Set default values for optional fields
  const {
    transaction_id = '',
    subtotal = order.total_amount,
    discount_amount = 0,
    shipping_fee = 0,
    tax_amount = 0,
    tracking_number = '',
    tracking_url = '',
    order_items = [],
    customer_name = order.user?.full_name || 'غير محدد',
    customer_email = order.user?.email || 'غير محدد',
    customer_phone = order.user?.phone || 'غير محدد',
    payment_status = 'pending',
    notes = '',
    updated_at = order.updated_at || new Date().toISOString(),
    shipping_address: shippingAddress = order.shipping_address || 'غير محدد'
  } = order;

  // Format the shipping address for display
  const formattedShippingAddress = React.useMemo(() => {
    if (!shippingAddress) return 'غير محدد';
    
    if (typeof shippingAddress === 'string') {
      return shippingAddress;
    }
    
    const addressParts = [];
    if (shippingAddress.address) addressParts.push(shippingAddress.address);
    if (shippingAddress.city) addressParts.push(shippingAddress.city);
    
    let result = addressParts.join('، ');
    if (shippingAddress.notes) {
      result += ` (${shippingAddress.notes})`;
    }
    
    return result || 'غير محدد';
  }, [shippingAddress]);
  
  // Format date in Arabic - make sure this is synchronous
  const formatDate = React.useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'تاريخ غير صالح';
      // Use the synchronous format function from date-fns
      return format(date, 'dd MMMM yyyy', { locale: ar });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'تاريخ غير صالح';
    }
  }, []);
  
  // Use the synchronous version from utils

  const statusLabels: Record<OrderStatus, string> = {
    pending: 'قيد المراجعة',
    confirmed: 'تم التأكيد',
    processing: 'قيد التنفيذ',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    returned: 'مرتجع',
  };

  const statusIcons = React.useMemo(() => ({
    pending: <Clock className="h-4 w-4 ml-1" key="pending" />,
    confirmed: <CheckCircle className="h-4 w-4 ml-1 text-blue-500" key="confirmed" />,
    processing: <RefreshCw className="h-4 w-4 ml-1 animate-spin text-purple-500" key="processing" />,
    shipped: <Truck className="h-4 w-4 ml-1 text-indigo-500" key="shipped" />,
    delivered: <CheckCircle className="h-4 w-4 ml-1 text-green-500" key="delivered" />,
    cancelled: <XCircle className="h-4 w-4 ml-1 text-red-500" key="cancelled" />,
    returned: <Package className="h-4 w-4 ml-1 text-gray-500" key="returned" />,
  }), []);

  const statusColors = React.useMemo(() => ({
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    returned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }), []);

  const paymentMethods = React.useMemo(() => ({
    cash_on_delivery: 'الدفع عند الاستلام',
    paymob_card: 'بطاقة ائتمانية',
    paymob_wallet: 'محفظة إلكترونية',
    bank_transfer: 'تحويل بنكي',
  }), []);

  const [isChangingStatus, setIsChangingStatus] = React.useState(false);
  const [currentOrder, setCurrentOrder] = React.useState<ExtendedOrderWithDetails>(order);

  // Update local state when order prop changes
  React.useEffect(() => {
    if (order) {
      setCurrentOrder(order);
    }
  }, [order]);

  const handleStatusChange = React.useCallback(async (newStatus: OrderStatus) => {
    if (!order) return;
    
    try {
      setIsChangingStatus(true);
      const success = await onStatusChange(order.id, newStatus);
      if (success) {
        // Update the local state to reflect the new status
        setCurrentOrder(prev => ({
          ...prev,
          status: newStatus,
          updated_at: new Date().toISOString()
        }));
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setIsChangingStatus(false);
    }
  }, [order, onStatusChange, onOpenChange]);

  // Memoize the dialog content to prevent unnecessary re-renders
  const dialogContent = React.useMemo(() => (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span>تفاصيل الطلب #{order.order_number || 'N/A'}</span>
              <Badge className={`${statusColors[order.status]} mr-2`}>
                {statusIcons[order.status]}
                {statusLabels[order.status]}
              </Badge>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => onOpenChange(false)}
            >
              إغلاق
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* معلومات العميل */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                <User className="h-5 w-5 ml-1 text-gray-500" />
                معلومات العميل
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <span className="text-gray-500 w-24">الاسم:</span>
                  <span className="font-medium">{customer_name}</span>
                </p>
                <p className="text-gray-500">ملاحظات إضافية:</p>
                <p className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  {notes || 'لا توجد ملاحظات'}
                </p>
                {customer_email && (
                  <p className="flex items-center">
                    <Mail className="h-4 w-4 ml-1 text-gray-400" />
                    <span className="text-gray-500 w-20">البريد:</span>
                    <span>{customer_email}</span>
                  </p>
                )}
                {customer_phone && (
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 ml-1 text-gray-400" />
                    <span className="text-gray-500 w-20">الهاتف:</span>
                    <a href={`tel:${customer_phone}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {customer_phone}
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* عنوان الشحن */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                <MapPin className="h-5 w-5 ml-1 text-gray-500" />
                عنوان الشحن
              </h3>
              <div className="space-y-2 text-sm">
                <p>{formattedShippingAddress}</p>
              </div>
            </div>

            {/* معلومات الدفع */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                <CreditCard className="h-5 w-5 ml-1 text-gray-500" />
                معلومات الدفع
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between">
                  <span className="text-gray-500">طريقة الدفع:</span>
                  <span>{paymentMethods[order.payment_method] || order.payment_method}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>حالة الدفع:</span>
                  <Badge 
                    className={payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                  </Badge>
                </p>
                {transaction_id && (
                  <p className="flex justify-between">
                    <span className="text-gray-500">رقم المعاملة:</span>
                    <span className="font-mono">{transaction_id}</span>
                  </p>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="flex justify-between text-base font-medium">
                    <span>المجموع:</span>
                    <span>{formatCurrencySync(Number(order.total_amount) || 0, 'ج.م', 0)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* تغيير حالة الطلب */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">تغيير حالة الطلب</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    className={`w-full mb-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm font-medium ${status === currentOrder.status ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center`}
                    onClick={() => handleStatusChange(status as OrderStatus)}
                    disabled={isUpdating[order.id]}
                  >
                    {statusLabels[status as OrderStatus]}
                    {isUpdating[order.id] && (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* تفاصيل المنتجات */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  المنتجات ({order_items.length || 0})
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order_items.map((item) => {
                  const productName = item.product?.title_ar || 'منتج غير معروف';
                  const imageUrl = item.product?.image_url || '';
                  
                  return (
                    <div key={item.id} className="p-4">
                      <div className="flex">
                        <div className="flex-shrink-0 h-20 w-20 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <Package className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="mr-4 flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {productName}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            الكمية: {item.quantity}
                          </p>
                          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrencySync(item.price)} × {item.quantity} = {formatCurrencySync(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ملخص الطلب */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">المجموع الفرعي:</span>
                    <span>{formatCurrencySync(subtotal)}</span>
                  </div>
                  {discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الخصم:</span>
                      <span className="text-red-500">-{formatCurrencySync(discount_amount)}</span>
                    </div>
                  )}
                  {shipping_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">رسوم الشحن:</span>
                      <span>{formatCurrencySync(shipping_fee)}</span>
                    </div>
                  )}
                  {tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الضريبة:</span>
                      <span>{formatCurrencySync(tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-600 text-base font-medium">
                    <span>الإجمالي:</span>
                    <span>{formatCurrencySync(order.total_amount, 'ر.س', 2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ملاحظات الطلب */}
            {order.notes && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  ملاحظات الطلب
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">{order.notes}</p>
              </div>
            )}

            {/* معلومات إضافية */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                  معلومات إضافية
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">رقم الطلب:</dt>
                    <dd className="font-mono">#{order.order_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">تاريخ الطلب:</dt>
                    <dd>
                      {format(new Date(order.created_at), 'dd/MM/yyyy - hh:mm a', { locale: ar })}
                    </dd>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">آخر تحديث:</dt>
                      <dd>
                        {formatDate(order.updated_at)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                  حالة الشحن
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="mr-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {statusLabels[order.status]}
                      </p>
                      <div className="text-sm text-gray-500">
                        آخر تحديث: {format(new Date(updated_at), 'dd MMM yyyy, hh:mm a', { locale: ar })}
                      </div>
                    </div>
                  </div>
                  {tracking_number && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm">
                        <span className="text-gray-500">رقم التتبع:</span>{' '}
                        <div className="font-medium">{tracking_number || 'لم يتم التحديد بعد'}</div>
                      </p>
                      {tracking_url && (
                        <a
                          href={tracking_url}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1 border border-gray-300 p-1 rounded"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          تتبع الشحنة
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ), [isOpen, onOpenChange, order, isChangingStatus, isUpdating, handleStatusChange]);

  return dialogContent;
};

export const OrderDetailsDialog = React.memo(OrderDetailsDialogComponent);
