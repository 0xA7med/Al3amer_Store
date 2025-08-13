import React from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { formatCurrencySync } from '@/lib/utils';
import type { OrderStatus, OrderWithDetails } from '@/types/order';
import { useSettings } from '@/contexts/SettingsContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


// This is a re-export from the main page, so it should be consistent
const statusLabels: Record<OrderStatus, string> = {
    pending: 'قيد المراجعة',
    confirmed: 'تم التأكيد',
    processing: 'قيد التنفيذ',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    returned: 'مرتجع',
};

// Extended type based on OrderWithDetails with additional UI-specific properties
export type ExtendedOrderWithDetails = Omit<OrderWithDetails, 'order_items'> & {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address: { city: string; address: string; notes?: string; } | string;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  tax_amount?: number;
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  order_items: Array<{
    id: string;
    product: { title_ar: string; title_en: string; image_url: string | null; };
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

const OrderDetailsDialogComponent = ({ isOpen, onOpenChange, order, onStatusChange, isUpdating = {} }: OrderDetailsDialogProps) => {
  const { settings } = useSettings();
  if (!order) return null;

  const {
    subtotal = order.total_amount,
    discount_amount = 0,
    shipping_fee = 0,
    customer_name = order.user?.full_name || 'غير محدد',
    customer_email = order.user?.email || 'غير محدد',
    customer_phone = order.user?.phone || 'غير محدد',
    payment_status = 'pending',
    notes = '',
    shipping_address: shippingAddress = order.shipping_address || 'غير محدد'
  } = order;

  const formattedShippingAddress = typeof shippingAddress === 'string' ? shippingAddress : `${shippingAddress.address}, ${shippingAddress.city}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6">
          <DialogTitle>تفاصيل الطلب #{order.id.substring(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>المنتجات</CardTitle></CardHeader>
              <CardContent>
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <img src={item.product?.image_url || '/images/placeholder-product.png'} alt={item.product.title_ar} className="w-16 h-16 rounded-md object-cover" />
                    <div className="flex-grow">
                      <p className="font-medium">{item.product.title_ar}</p>
                      <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrencySync(item.price * item.quantity, settings.currency_symbol)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>ملخص الدفع</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span>{formatCurrencySync(subtotal, settings.currency_symbol)}</span></div>
                    {discount_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">الخصم</span><span className="text-red-500">-{formatCurrencySync(discount_amount, settings.currency_symbol)}</span></div>}
                    {shipping_fee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">رسوم الشحن</span><span>{formatCurrencySync(shipping_fee, settings.currency_symbol)}</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span >الإجمالي</span><span>{formatCurrencySync(order.total_amount, settings.currency_symbol)}</span></div>
                </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>العميل</CardTitle></CardHeader>
                <CardContent className="space-y-1">
                    <p><strong>{customer_name}</strong></p>
                    <p className="text-sm text-muted-foreground">{customer_email}</p>
                    <p className="text-sm text-muted-foreground">{customer_phone}</p>
                    <p className="text-sm pt-2"><strong>عنوان الشحن:</strong> {formattedShippingAddress}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>حالة الطلب</CardTitle></CardHeader>
                <CardContent>
                    <Select onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)} defaultValue={order.status} disabled={isUpdating[order.id]}>
                        <SelectTrigger>
                            <SelectValue placeholder="تغيير الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(statusLabels).map(s => <SelectItem key={s} value={s}>{statusLabels[s as OrderStatus]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
          </div>
        </div>
        <DialogClose className="absolute right-4 top-4" />
      </DialogContent>
    </Dialog>
  );
};

export const OrderDetailsDialog = React.memo(OrderDetailsDialogComponent);
