import { useState } from 'react';

interface Order {
    id: string;
    customer: {
        name: string;
        phone: string;
        avatar: string;
    };
    products: {
        name: string;
        image: string;
        count: number;
    }[];
    date: string;
    time: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: string;
    total: number;
}

const ORDERS: Order[] = [
    {
        id: 'ORD-00125',
        customer: { name: 'محمود سعيد', phone: '+20 10x xxx xxxx', avatar: 'https://i.pravatar.cc/150?u=1' },
        products: [
            { name: 'طابعة فواتير + 1', image: 'https://placehold.co/100', count: 2 }
        ],
        date: '24 أكتوبر 2023',
        time: '10:30 ص',
        status: 'processing',
        paymentMethod: 'عند الاستلام',
        total: 1250,
    },
    {
        id: 'ORD-00124',
        customer: { name: 'سارة أحمد', phone: '+20 12x xxx xxxx', avatar: 'https://i.pravatar.cc/150?u=2' },
        products: [
            { name: 'قارئ باركود', image: 'https://placehold.co/100', count: 1 }
        ],
        date: '24 أكتوبر 2023',
        time: '09:15 ص',
        status: 'shipped', // mapped to 'shipped' for 'cleaning' or 'delivery'
        paymentMethod: 'فيزا / ماستركارد',
        total: 8200,
    },
    {
        id: 'ORD-00123',
        customer: { name: 'كريم مصطفى', phone: '+20 11x xxx xxxx', avatar: 'https://i.pravatar.cc/150?u=3' },
        products: [
            { name: 'جهاز كاشير كامل', image: 'https://placehold.co/100', count: 1 },
            { name: 'ورق كاشير', image: 'https://placehold.co/100', count: 2 }
        ],
        date: '23 أكتوبر 2023',
        time: '04:45 م',
        status: 'delivered',
        paymentMethod: 'محفظة إلكترونية',
        total: 3200,
    },
    {
        id: 'ORD-00122',
        customer: { name: 'عمر خالد', phone: '+20 15x xxx xxxx', avatar: 'https://i.pravatar.cc/150?u=4' },
        products: [
            { name: 'ورق كاشير حراري', image: 'https://placehold.co/100', count: 5 }
        ],
        date: '23 أكتوبر 2023',
        time: '02:20 م',
        status: 'cancelled',
        paymentMethod: 'عند الاستلام',
        total: 850,
    },
];

const STATUS_CONFIG: Record<string, { color: string; label: string; iconClass: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد الانتظار', iconClass: 'bg-yellow-400' },
    processing: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد المعالجة', iconClass: 'bg-yellow-400 animate-pulse' },
    shipped: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'جاري التوصيل', iconClass: 'bg-blue-400' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مكتمل', iconClass: 'bg-emerald-400' },
    cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'ملغي', iconClass: 'bg-red-400' },
};

export function OrdersManagement() {
    const [orders] = useState(ORDERS);
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">إدارة الطلبات</h2>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                        <span className="text-slate-300 text-xs font-medium">اليوم: 24 أكتوبر 2023</span>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>طلب يدوي</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </div>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">+12%</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">154</h3>
                        <p className="text-slate-400 text-xs font-medium">إجمالي الطلبات هذا الشهر</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse">مطلوب إجراء</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">12</h3>
                        <p className="text-slate-400 text-xs font-medium">قيد المعالجة</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">85% معدل</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">128</h3>
                        <p className="text-slate-400 text-xs font-medium">طلبات مكتملة</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">-2%</span>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">14</h3>
                        <p className="text-slate-400 text-xs font-medium">ملغية / مرتجعة</p>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-5 flex flex-col xl:flex-row items-center gap-5 justify-between border-b border-white/5 backdrop-blur-xl">
                    <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md group">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                type="text"
                                placeholder="بحث برقم الطلب، اسم العميل، الهاتف..."
                                className="block w-full h-11 pr-10 pl-4 rounded-lg bg-[#0f1115]/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary focus:bg-[#0f1115] transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-[#0f1115]/50 rounded-lg border border-white/10 p-1 overflow-x-auto max-w-full no-scrollbar">
                            <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>الكل</button>
                            <button onClick={() => setFilterStatus('processing')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'processing' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>قيد المعالجة</button>
                            <button onClick={() => setFilterStatus('shipped')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'shipped' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>جاري التوصيل</button>
                            <button onClick={() => setFilterStatus('delivered')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'delivered' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>مكتمل</button>
                            <button onClick={() => setFilterStatus('cancelled')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'cancelled' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>ملغي</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1115] border border-white/10 text-slate-300 hover:text-white hover:border-primary/50 transition-all text-sm font-medium">
                            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
                            <span>تصفية</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1115] border border-white/10 text-slate-300 hover:text-white hover:border-primary/50 transition-all text-sm font-medium">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4" />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">رقم الطلب</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">المنتجات</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الدفع</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-300">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition-colors group relative">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">#{order.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-9 rounded-full bg-slate-700 bg-cover bg-center ring-2 ring-white/10" style={{ backgroundImage: `url(${order.customer.avatar})` }}></div>
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold hover:text-primary transition-colors cursor-pointer">{order.customer.name}</span>
                                                <span className="text-xs text-slate-500 font-mono" dir="ltr">{order.customer.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                                                {order.products.slice(0, 2).map((prod, i) => (
                                                    <img key={i} src={prod.image} alt={prod.name} className="inline-block size-8 rounded-full ring-2 ring-[#161b26] bg-white/10 object-cover" />
                                                ))}
                                                {order.products.length > 2 && (
                                                    <div className="inline-flex size-8 items-center justify-center rounded-full ring-2 ring-[#161b26] bg-white/20 text-[10px] text-white font-bold backdrop-blur-sm">+{order.products.length - 2}</div>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{order.products[0].name} {order.products.length > 1 && `+ ${order.products.length - 1}`}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex flex-col">
                                            <span className="text-slate-300 font-medium">{order.date}</span>
                                            <span className="text-xs text-slate-500">{order.time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[order.status]?.color}`}>
                                            <span className={`size-1.5 rounded-full ml-2 ${STATUS_CONFIG[order.status]?.iconClass}`}></span>
                                            {STATUS_CONFIG[order.status]?.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-500 text-[18px]">payments</span>
                                            <span className="text-xs font-medium text-slate-300">{order.paymentMethod}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white font-mono text-base">{order.total.toLocaleString()} ج.م</td>
                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/20 hover:text-primary text-slate-400 transition-all" title="تعديل">
                                                <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                            </button>
                                            <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all" title="طباعة الفاتورة">
                                                <span className="material-symbols-outlined text-[18px]">print</span>
                                            </button>
                                            <button className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary hover:text-white text-slate-300 border border-white/10 transition-all shadow-sm" title="عرض التفاصيل">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default OrdersManagement;
