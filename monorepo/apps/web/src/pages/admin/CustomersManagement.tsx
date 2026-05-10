import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { GovernorateSelect } from '../../components/shared/GovernorateSelect';

const CustomersManagement = () => {
    const { customers, isLoading, updateStatus, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    const handleDelete = async (customer: any) => {
        const confirmMsg = customer.type === 'guest' 
            ? `هل أنت متأكد من حذف هذا العميل الزائر؟ سيتم حذف جميع طلباته المرتبطة برقم الهاتف (${customer.phone}) نهائياً.`
            : `هل أنت متأكد من حذف العميل (${customer.name})؟ سيتم حذف جميع بياناته وطلباته نهائياً.`;
        
        if (window.confirm(confirmMsg)) {
            await deleteCustomer(customer.id);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;
        await updateCustomer(editingCustomer.id, editingCustomer);
        setEditingCustomer(null);
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
        <div className="flex flex-col gap-4 md:gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        إدارة العملاء
                        <span className="h-6 w-px bg-white/10 mx-2"></span>
                        <span className="text-slate-400 text-xs md:text-sm font-normal bg-white/5 px-2 py-1 rounded-md">
                            {customers.length} عميل
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 transition-colors text-sm">
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">file_download</span>
                        تصدير
                    </button>
                    <button
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="flex-1 sm:flex-none justify-center bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        إضافة عميل
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">group</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">إجمالي العملاء</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{customers.length}</h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">how_to_reg</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">عملاء جدد</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">
                            {customers.filter(c => new Date(c.joinDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                        </h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">shopping_cart_checkout</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">تكرار الشراء</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{customers.filter(c => c.orders > 1).length}</h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">block</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">حسابات محظورة</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{customers.filter(c => c.status === 'blocked').length}</h3>
                    </div>
                </div>
            </div>

            {/* Customers Listing */}
            <div className="flex flex-col gap-4">
                {/* Search & Tabs (Mobile: Collapsible) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between lg:hidden px-1">
                        <p className="text-slate-400 text-xs font-bold">تصفية النتائج</p>
                        <button 
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-bold transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">{isFiltersOpen ? 'expand_less' : 'filter_list'}</span>
                            {isFiltersOpen ? 'إغلاق' : 'فلترة'}
                        </button>
                    </div>

                    <div className={`${isFiltersOpen ? 'flex' : 'hidden md:flex'} glass-panel rounded-xl p-4 flex-col md:flex-row items-stretch md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <div className="relative flex-1 md:max-w-xs">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث بالاسم، الإيميل، أو الهاتف..."
                                className="w-full h-11 bg-[#161b26] border border-white/10 rounded-lg pr-10 pl-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary placeholder-slate-500 transition-all font-bold"
                            />
                        </div>
                        <div className="flex bg-[#161b26] rounded-lg p-1 border border-white/5 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                الكل
                            </button>
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filterStatus === 'active' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                النشطة
                            </button>
                            <button
                                onClick={() => setFilterStatus('blocked')}
                                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filterStatus === 'blocked' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                            >
                                المحظورة
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:block glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white/5 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">العميل</th>
                                    <th className="px-6 py-4 whitespace-nowrap">معلومات الاتصال</th>
                                    <th className="px-6 py-4 whitespace-nowrap">العنوان</th>
                                    <th className="px-6 py-4 whitespace-nowrap">الطلبات</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-left">إجمالي المشتريات</th>
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
                                        <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{customer.name}</td>
                                        <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">{customer.phone}</td>
                                        <td className="px-6 py-4 text-slate-400">{customer.governorate}</td>
                                        <td className="px-6 py-4 font-bold text-white">{customer.orders}</td>
                                        <td className="px-6 py-4 text-left font-bold text-emerald-400 font-mono">{customer.totalSpent.toLocaleString()} ج.م</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                {customer.status === 'active' ? 'نشط' : 'محظور'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => updateStatus(customer.id, customer.status === 'active' ? 'blocked' : 'active')} className="p-1.5 rounded hover:bg-white/5 text-slate-400 transition-all"><span className="material-symbols-outlined text-[18px]">block</span></button>
                                                <button onClick={() => setEditingCustomer(customer)} className="p-1.5 rounded hover:bg-white/5 text-slate-400 transition-all"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                                <button onClick={() => handleDelete(customer)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View (Cards) */}
                <div className="lg:hidden flex flex-col gap-3 pb-4">
                    {filteredCustomers.map((customer) => (
                        <div 
                            key={customer.id} 
                            className="glass-panel rounded-xl p-4 flex flex-col gap-4 relative"
                            onClick={() => navigate(`/admin/customers/${customer.phone}`)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{customer.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{customer.joinDate}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    {customer.status === 'active' ? 'نشط' : 'محظور'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold">الهاتف</span>
                                    <p className="text-xs text-white font-mono">{customer.phone}</p>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold">المحافظة</span>
                                    <p className="text-xs text-white">{customer.governorate || 'غير محدد'}</p>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold">الطلبات</span>
                                    <p className="text-xs text-white font-bold">{customer.orders} طلب</p>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold">الإنفاق</span>
                                    <p className="text-xs text-emerald-400 font-bold">{customer.totalSpent.toLocaleString('ar-EG')} ج.م</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                    <a href={`tel:${customer.phone}`} className="size-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/10">
                                        <span className="material-symbols-outlined text-lg">call</span>
                                    </a>
                                    <button onClick={() => setEditingCustomer(customer)} className="size-9 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center border border-white/10">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>
                                <button onClick={() => handleDelete(customer)} className="size-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/10">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
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

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e2330] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">تعديل بيانات العميل</h3>
                            <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    required
                                    value={editingCustomer.name}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={editingCustomer.email}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">رقم الهاتف</label>
                                <input
                                    type="tel"
                                    required
                                    value={editingCustomer.phone}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">المحافظة</label>
                                    <GovernorateSelect
                                        value={editingCustomer.governorate || ''}
                                        onChange={(v) => setEditingCustomer({ ...editingCustomer, governorate: v })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">العنوان بالتفصيل</label>
                                <input
                                    type="text"
                                    value={editingCustomer.address || ''}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-all"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] h-11 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all"
                                >
                                    حفظ التغييرات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
        governorate: '',
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">المحافظة</label>
                            <GovernorateSelect
                                value={formData.governorate}
                                onChange={(v) => setFormData({ ...formData, governorate: v })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">العنوان بالتفصيل</label>
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
