import { useState } from 'react';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    location: string;
    orders: number;
    totalSpent: number;
    status: 'active' | 'inactive' | 'blocked';
    joinDate: string;
    lastActive: string;
    avatar: string;
}

const CUSTOMERS: Customer[] = [
    {
        id: 1,
        name: 'أحمد محمد',
        email: 'ahmed@email.com',
        phone: '01012345678',
        location: 'الرياض، السعودية',
        orders: 15,
        totalSpent: 24500,
        status: 'active',
        joinDate: '2024-01-15',
        lastActive: 'منذ 2 ساعة',
        avatar: 'https://i.pravatar.cc/150?u=1'
    },
    {
        id: 2,
        name: 'محمد علي',
        email: 'mohamed@email.com',
        phone: '01098765432',
        location: 'طريق الملك عبدالله، جدة',
        orders: 3,
        totalSpent: 18200,
        status: 'active',
        joinDate: '2024-03-02',
        lastActive: 'منذ يومين',
        avatar: 'https://i.pravatar.cc/150?u=2'
    },
    {
        id: 3,
        name: 'سارة أحمد',
        email: 'sara@email.com',
        phone: '01155566677',
        location: 'دبي، الإمارات',
        orders: 8,
        totalSpent: 45600,
        status: 'active',
        joinDate: '2024-02-20',
        lastActive: 'منذ 5 ساعات',
        avatar: 'https://i.pravatar.cc/150?u=3'
    },
    {
        id: 4,
        name: 'علي حسن',
        email: 'ali@email.com',
        phone: '01234567890',
        location: 'القاهرة، مصر',
        orders: 1,
        totalSpent: 3400,
        status: 'inactive',
        joinDate: '2023-12-01',
        lastActive: 'منذ شهر',
        avatar: 'https://i.pravatar.cc/150?u=4'
    },
    {
        id: 5,
        name: 'فاطمة محمود',
        email: 'fatma@email.com',
        phone: '01111222333',
        location: 'عمان، الأردن',
        orders: 12,
        totalSpent: 78500,
        status: 'blocked',
        joinDate: '2024-04-10',
        lastActive: 'منذ أسبوع',
        avatar: 'https://i.pravatar.cc/150?u=5'
    },
];

export function CustomersManagement() {
    const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');

    const toggleStatus = (id: number) => {
        setCustomers((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
            )
        );
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.includes(searchQuery) || c.email.includes(searchQuery) || c.phone.includes(searchQuery);
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        إدارة العملاء
                        <span className="h-6 w-px bg-white/10 mx-2"></span>
                        <span className="text-slate-400 text-sm font-normal bg-white/5 px-2 py-1 rounded-md">
                            {customers.length} عميل
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">file_download</span>
                        تصدير
                    </button>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        إضافة عميل
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">group</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي العملاء</p>
                        <h3 className="text-2xl font-bold text-white mt-1">1,248</h3>
                        <p className="text-emerald-400 text-xs flex items-center gap-1 mt-1">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            +12% هذا الشهر
                        </p>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">person_add</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">عملاء جدد</p>
                        <h3 className="text-2xl font-bold text-white mt-1">45</h3>
                        <p className="text-slate-500 text-xs mt-1">آخر 7 أيام</p>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">shopping_cart</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">متوسط الطلبات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">3.5</h3>
                        <p className="text-slate-500 text-xs mt-1"> لكل عميل</p>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-red-500">block</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">حسابات محظورة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">12</h3>
                        <p className="text-red-400 text-xs mt-1">يتطلب مراجعة</p>
                    </div>
                </div>
            </div>

            {/* Customers Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-80">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
                                className="w-full h-10 bg-[#161b26] border border-white/10 rounded-lg pr-10 pl-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder-slate-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex bg-[#161b26] rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            الكل
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            النشطة
                        </button>
                        <button
                            onClick={() => setFilterStatus('blocked')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'blocked' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            المحظورة
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap">معلومات الاتصال</th>
                                <th className="px-6 py-4 whitespace-nowrap">الموقع</th>
                                <th className="px-6 py-4 whitespace-nowrap">الطلبات</th>
                                <th className="px-6 py-4 whitespace-nowrap">إجمالي المشتريات</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-slate-700 bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${customer.avatar})` }}></div>
                                            <div>
                                                <p className="font-bold text-white">{customer.name}</p>
                                                <p className="text-xs text-slate-500 mt-1">انضم {customer.joinDate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <span className="material-symbols-outlined text-[16px] text-slate-500">mail</span>
                                                <span className="text-xs font-mono">{customer.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <span className="material-symbols-outlined text-[16px] text-slate-500">call</span>
                                                <span className="text-xs font-mono dir-ltr">{customer.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                                            {customer.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{customer.orders}</span>
                                            <span className="text-xs text-slate-500">طلب</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-emerald-400 font-bold font-mono">{customer.totalSpent.toLocaleString()} ج.م</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${customer.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : customer.status === 'blocked'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                            }`}>
                                            <span className={`size-1.5 rounded-full ${customer.status === 'active' ? 'bg-emerald-400' :
                                                    customer.status === 'blocked' ? 'bg-red-400' : 'bg-slate-400'
                                                }`}></span>
                                            {customer.status === 'active' ? 'نشط' : customer.status === 'blocked' ? 'محظور' : 'غير نشط'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleStatus(customer.id)}
                                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                title={customer.status === 'active' ? 'حظر' : 'تنشيط'}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] ${customer.status === 'active' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {customer.status === 'active' ? 'block' : 'check_circle'}
                                                </span>
                                            </button>
                                            <button className="p-1.5 rounded hover:bg-primary/20 text-slate-400 hover:text-primary transition-colors" title="عرض التفاصيل">
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                            <button className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="مراسلة">
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">عرض 1-5 من أصل {customers.length} عميل</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1 text-slate-500 hover:text-white disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <button className="size-7 flex items-center justify-center rounded bg-primary text-white text-xs font-bold">1</button>
                        <button className="size-7 flex items-center justify-center rounded bg-transparent hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">2</button>
                        <button className="size-7 flex items-center justify-center rounded bg-transparent hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">3</button>
                        <button className="p-1 text-slate-500 hover:text-white">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomersManagement;
