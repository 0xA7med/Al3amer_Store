import { useState } from 'react';
import { Link } from 'react-router-dom';

type AccountTab = 'overview' | 'orders' | 'profile';

const ORDERS = [
    { id: 'ORD-9921', date: '25 أكتوبر 2024', items: 'طابعة فواتير إبسون، قارئ باركود', status: 'shipping', total: 8450 },
    { id: 'ORD-9855', date: '10 أكتوبر 2024', items: 'صندوق كاشير، ورق حراري', status: 'delivered', total: 3200 },
    { id: 'ORD-8700', date: '28 سبتمبر 2024', items: 'شاشة لمس 15 بوصة', status: 'delivered', total: 12500 },
    { id: 'ORD-8100', date: '15 سبتمبر 2024', items: 'Sunmi V2 Pro', status: 'delivered', total: 5500 },
];

const STATS = [
    { label: 'إجمالي الطلبات', value: '12', icon: 'inventory_2', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'الشحنات النشطة', value: '1', icon: 'local_shipping', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'نقاط الولاء', value: '450', icon: 'loyalty', color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد الانتظار' },
    processing: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'جاري التحضير' },
    shipping: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'قيد التوصيل' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'تم التسليم' },
};

export function AccountPage() {
    const [activeTab, setActiveTab] = useState<AccountTab>('overview');
    const [profileData, setProfileData] = useState({
        name: 'أحمد حسن',
        email: 'ahmed.h@example.com',
        phone: '01001234567',
        address: '15 شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة',
    });

    const tabs = [
        { id: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
        { id: 'orders', label: 'طلباتي', icon: 'shopping_bag' },
        { id: 'profile', label: 'الملف الشخصي', icon: 'person' },
    ];

    return (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">أهلاً بك، {profileData.name.split(' ')[0]} 👋</h1>
                    <p className="text-gray-400">إليك نظرة عامة على حسابك وطلباتك</p>
                </div>
                <Link to="/shop" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined">add_shopping_cart</span>
                    تسوق الآن
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AccountTab)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white/5 text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-8">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {STATS.map((stat) => (
                            <div key={stat.label} className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-2xl -mr-10 -mt-10`}></div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className={`p-3 ${stat.bg} rounded-xl ${stat.color}`}>
                                        <span className="material-symbols-outlined">{stat.icon}</span>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-sm">{stat.label}</p>
                                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Orders */}
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">أحدث الطلبات</h3>
                            <button onClick={() => setActiveTab('orders')} className="text-primary text-sm hover:underline">عرض الكل</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                                    <tr>
                                        <th className="text-right px-6 py-4">رقم الطلب</th>
                                        <th className="text-right px-6 py-4">التاريخ</th>
                                        <th className="text-right px-6 py-4">الحالة</th>
                                        <th className="text-right px-6 py-4">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {ORDERS.slice(0, 3).map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-white font-medium">{order.id}</span>
                                                <div className="text-xs text-gray-500 mt-1">{order.items}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{order.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[order.status].color}`}>
                                                    <span className={`size-1.5 rounded-full ${order.status === 'shipping' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                                                    {STATUS_CONFIG[order.status].label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-bold">{order.total.toLocaleString()} ج.م</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="glass-panel rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white">سجل الطلبات</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="text-right px-6 py-4">رقم الطلب</th>
                                    <th className="text-right px-6 py-4">التاريخ</th>
                                    <th className="text-right px-6 py-4">المنتجات</th>
                                    <th className="text-right px-6 py-4">الحالة</th>
                                    <th className="text-right px-6 py-4">الإجمالي</th>
                                    <th className="text-right px-6 py-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ORDERS.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-primary font-bold">{order.id}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{order.date}</td>
                                        <td className="px-6 py-4 text-white text-sm">{order.items}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[order.status].color}`}>
                                                {STATUS_CONFIG[order.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white font-bold">{order.total.toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4">
                                            <button className="text-gray-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="glass-panel rounded-2xl p-6 max-w-2xl">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        تعديل الملف الشخصي
                    </h3>

                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">الاسم بالكامل</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left dir-ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-left dir-ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">العنوان الافتراضي</label>
                            <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                rows={3}
                                className="w-full bg-[#181a20] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-primary/20">
                                حفظ التغييرات
                            </button>
                            <button type="button" className="bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-xl transition-colors border border-white/10">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default AccountPage;
