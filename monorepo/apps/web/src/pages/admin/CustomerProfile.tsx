import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerOrders } from '../../hooks/useCustomers';
import OrdersTable from '../../components/admin/OrdersTable';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

export default function CustomerProfile() {
    const { phone } = useParams<{ phone: string }>();
    const navigate = useNavigate();
    const { data: orders, isLoading, error } = useCustomerOrders(phone);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !orders) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-4">error</span>
                <p>حدث خطأ أثناء تحميل بيانات العميل</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary hover:underline">العودة</button>
            </div>
        );
    }

    // Derive customer info from the most recent order (if any exist)
    const latestOrder = orders[0];
    const customerName = latestOrder?.fullName || latestOrder?.user?.name || 'زائر';
    const customerEmail = latestOrder?.email || latestOrder?.user?.email;
    const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || '0'), 0);
    const joinDate = orders.length > 0 ? new Date(orders[orders.length - 1].createdAt).toLocaleDateString('ar-EG') : 'غير معروف';

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/customers')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            الملف الشخصي: {customerName}
                            <span className="h-6 w-px bg-white/10 mx-2"></span>
                            <span className="text-slate-400 text-sm font-normal bg-white/5 px-2 py-1 rounded-md font-mono">
                                {phone}
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">receipt_long</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الطلبات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{orders.length}</h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">payments</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي المشتريات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{totalSpent.toLocaleString('ar-EG')} ج.م</h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">calendar_month</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">أول طلب</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{joinDate}</h3>
                        {customerEmail && <p className="text-xs text-slate-500 mt-1 font-mono">{customerEmail}</p>}
                    </div>
                </div>
            </div>

            {/* Orders Map (using shared component) */}
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-white">الطلبات السابقة</h2>
                {orders.length > 0 ? (
                    <OrdersTable orders={orders} onViewDetails={(order) => setSelectedOrder(order)} />
                ) : (
                    <div className="glass-panel rounded-xl p-8 text-center text-slate-400">
                        لا توجد طلبات سابقة لهذا العميل.
                    </div>
                )}
            </div>

            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                />
            )}
        </div>
    );
}
