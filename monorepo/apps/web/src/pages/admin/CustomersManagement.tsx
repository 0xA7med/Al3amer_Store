import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';

export function CustomersManagement() {
    const { customers, isLoading, updateStatus, createCustomer } = useCustomers();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

    const toggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        // @ts-ignore
        updateStatus(id, newStatus as 'active' | 'inactive' | 'blocked');
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery);
        const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

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
                    <button
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
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
                        <h3 className="text-2xl font-bold text-white mt-1">{customers.length}</h3>
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
                        <h3 className="text-2xl font-bold text-white mt-1">{customers.filter(c => new Date(c.joinDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</h3>
                        <p className="text-slate-500 text-xs mt-1">آخر 30 يوم</p>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">shopping_cart</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">متوسط الطلبات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {customers.length ? (customers.reduce((acc, c) => acc + c.orders, 0) / customers.length).toFixed(1) : 0}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1"> لكل عميل</p>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-red-500">block</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">حسابات محظورة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{customers.filter(c => c.status === 'blocked').length}</h3>
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
                                <tr
                                    key={customer.id}
                                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                                    onClick={() => navigate(`/admin/customers/${customer.phone}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-slate-400">person</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-white">{customer.name}</p>
                                                    {customer.type === 'guest' && (
                                                        <span className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded border border-slate-500/20">زائر</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-mono dir-ltr">{customer.joinDate}</p>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStatus(customer.id, customer.status);
                                                }}
                                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                title={customer.status === 'active' ? 'حظر' : 'تنشيط'}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] ${customer.status === 'active' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {customer.status === 'active' ? 'block' : 'check_circle'}
                                                </span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/customers/${customer.phone}`);
                                                }}
                                                className="p-1.5 rounded hover:bg-primary/20 text-slate-400 hover:text-primary transition-colors"
                                                title="ملف العميل"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">person</span>
                                            </button>
                                            <a
                                                href={`mailto:${customer.email}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                                title="مراسلة"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">mail</span>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Static for now) */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">عرض 1-{Math.min(5, customers.length)} من أصل {customers.length} عميل</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1 text-slate-500 hover:text-white disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <button className="size-7 flex items-center justify-center rounded bg-primary text-white text-xs font-bold">1</button>
                        <button className="size-7 flex items-center justify-center rounded bg-transparent hover:bg-white/5 text-slate-400 text-xs font-bold transition-colors">2</button>
                        <button className="p-1 text-slate-500 hover:text-white">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>

            {isAddCustomerOpen && (
                <AddCustomerModal
                    onClose={() => setIsAddCustomerOpen(false)}
                    onCreate={createCustomer}
                />
            )}
        </div>
    );
}

function AddCustomerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => Promise<any> }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        address: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onCreate(formData);
            onClose();
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">إضافة عميل جديد</h3>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-400 hover:text-white">close</span></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">الاسم بالكامل</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">رقم الهاتف</label>
                        <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">كلمة المرور</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">العنوان</label>
                        <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-white/5 font-bold text-sm">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                            {isSubmitting && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            إضافة
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CustomersManagement;
