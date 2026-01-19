import { Link } from 'react-router-dom';
import { useDashboardStats } from '../../hooks/useAnalytics';
import { useUpdateOrderStatus } from '../../hooks/useAdmin';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export function DashboardOverview() {
    const { data, isLoading } = useDashboardStats();
    const updateOrderStatus = useUpdateOrderStatus();

    const handleQuickAction = (orderId: string, action: 'processing' | 'cancelled') => {
        updateOrderStatus.mutate({ orderId, status: action });
    };

    if (isLoading || !data) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري تحميل لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    const { stats, pendingOrders, activityFeed, sparklines } = data;

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* Stats Grid with Mini-Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Stat */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">إجمالي الإيرادات</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {stats.revenue.value.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">ج.م</span>
                            </h3>
                        </div>
                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.revenue.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {stats.revenue.trend === 'up' ? '↗' : '↘'} {stats.revenue.trend === 'up' ? 'ارتفاع' : 'انخفاض'}
                        </span>
                    </div>
                    {/* Sparkline */}
                    <div className="h-10 w-full opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklines}>
                                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Stat */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">إجمالي الطلبات</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {stats.orders.value} <span className="text-sm font-normal text-slate-500">طلب</span>
                            </h3>
                        </div>
                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stats.orders.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {stats.orders.trend === 'up' ? '↗' : '↘'} {stats.orders.trend === 'up' ? 'ارتفاع' : 'انخفاض'}
                        </span>
                    </div>
                    <div className="h-10 w-full opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklines}>
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action Required Widget (Pending Orders) */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-8 rounded-full bg-yellow-500"></span>
                            <h3 className="text-lg font-bold text-white">إجراء مطلوب</h3>
                        </div>
                        <span className="text-xs font-bold bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/20">
                            {pendingOrders.length} طلبات معلقة
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                        {pendingOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                                <p>لا توجد طلبات معلقة. عمل رائع!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                #{order.orderNumber.slice(-4)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{order.fullName}</h4>
                                                <p className="text-xs text-slate-400">
                                                    {order.items.length} منتجات • {parseFloat(order.total).toLocaleString('ar-EG')} ج.م
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleQuickAction(order.id, 'processing')}
                                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                                title="قبول الطلب"
                                            >
                                                <span className="material-symbols-outlined">check</span>
                                            </button>
                                            <button
                                                onClick={() => handleQuickAction(order.id, 'cancelled')}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                title="إلغاء الطلب"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                                title="عرض التفاصيل"
                                            >
                                                <span className="material-symbols-outlined">visibility</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="glass-panel rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">النشاط الحديث</h3>
                    <div className="relative pl-4 border-r border-white/10 space-y-8">
                        {activityFeed.map((activity, index) => (
                            <div key={index} className="relative pr-6">
                                <span className={`absolute -right-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${activity.type === 'order' ? 'bg-blue-500' :
                                        activity.type === 'user' ? 'bg-purple-500' : 'bg-yellow-500'
                                    }`}></span>
                                <p className="text-sm text-slate-300 font-medium mb-1">{activity.message}</p>
                                <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;
