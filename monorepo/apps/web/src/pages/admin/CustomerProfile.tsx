import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomerOrders, useCustomers } from '../../hooks/useCustomers';
import OrdersTable from '../../components/admin/OrdersTable';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
];

export default function CustomerProfile() {
    const { phone } = useParams<{ phone: string }>();
    const navigate = useNavigate();
    const { data: orders, isLoading, error } = useCustomerOrders(phone || '');
    const { updateStatus, updateCustomer, deleteCustomer } = useCustomers();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>(null);

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
    const customerId = latestOrder?.user?.id || `guest_${phone}`;
    const customerStatus = latestOrder?.user?.status || 'active';
    const customerName = latestOrder?.fullName || latestOrder?.user?.name || 'زائر';
    const customerEmail = latestOrder?.email || latestOrder?.user?.email;
    const totalSpent = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total || '0'), 0);
    const joinDate = orders.length > 0 ? new Date(orders[orders.length - 1].createdAt).toLocaleDateString('ar-EG') : 'غير معروف';

    const handleEdit = () => {
        setEditForm({
            id: customerId,
            name: customerName,
            email: customerEmail || '',
            phone: latestOrder?.user?.phone || latestOrder?.phone || phone || '',
            phone2: latestOrder?.user?.phone2 || latestOrder?.phone2 || '',
            address: latestOrder?.address || '',
            governorate: latestOrder?.governorate || '',
            city: latestOrder?.city || '',
        });
        setIsEditing(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateCustomer(customerId, editForm);
        setIsEditing(false);
    };

    const handleToggleStatus = async () => {
        const newStatus = customerStatus === 'active' ? 'blocked' : 'active';
        await updateStatus(customerId, newStatus);
    };

    const handleDelete = async () => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل وجميع طلباته نهائياً؟')) {
            await deleteCustomer(customerId);
            navigate('/admin/customers');
        }
    };

    const handleWhatsApp = () => {
        const waPhone = phone?.startsWith('0') ? '2' + phone : phone;
        window.open(`https://wa.me/${waPhone}`, '_blank');
    };

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
                             <div className="flex gap-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${customerStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {customerStatus === 'active' ? 'نشط' : 'محظور'}
                                </span>
                                {latestOrder?.user?.role === 'trader' && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/20 text-blue-400">
                                        تاجر (Reseller)
                                    </span>
                                )}
                             </div>
                         </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => navigate(`/admin/orders?createOrderFor=${phone}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                        إنشاء طلب
                    </button>
                    {latestOrder?.user?.role !== 'trader' ? (
                        <button 
                            onClick={async () => {
                                if (window.confirm('بعد التحويل لتاجر، ستتمكن من ضبط خصومات خاصة له. هل تريد المتابعة؟')) {
                                    await updateCustomer(customerId, { ...latestOrder.user, role: 'trader' });
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold transition-all border border-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            تحويل لتاجر
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)} // reuse editing for trader config
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold transition-all border border-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-lg">settings</span>
                            خصومات التاجر
                        </button>
                    )}
                    <button 
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        تعديل
                    </button>
                    <button 
                        onClick={handleToggleStatus}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${customerStatus === 'active' ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'}`}
                    >
                        <span className="material-symbols-outlined text-lg">{customerStatus === 'active' ? 'block' : 'check_circle'}</span>
                        {customerStatus === 'active' ? 'حظر' : 'تنشيط'}
                    </button>
                    <button 
                        onClick={handleWhatsApp}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">chat</span>
                        مراسلة
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        حذف
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">location_on</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">العنوان</p>
                        <h3 className="text-lg font-bold text-white mt-1">
                            {latestOrder?.governorate || 'غير محدد'} {latestOrder?.city ? `(${latestOrder.city})` : ''}
                        </h3>
                        {latestOrder?.address && <p className="text-xs text-slate-500 mt-1">{latestOrder?.address}</p>}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
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

            {/* Modals */}
            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                />
            )}

            {isEditing && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e2330] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">تعديل بيانات العميل</h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">الاسم الكامل</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">رقم الهاتف الأساسي</label>
                                    <input
                                        type="tel"
                                        required
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all text-left"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1">رقم هاتف إضافي</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone2}
                                        onChange={e => setEditForm({ ...editForm, phone2: e.target.value })}
                                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 mb-1">المحافظة</label>
                                    <select
                                        value={editForm.governorate}
                                        onChange={e => setEditForm({ ...editForm, governorate: e.target.value })}
                                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                    >
                                        <option value="">اختر المحافظة...</option>
                                        {GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 mb-1">المدينة/المركز</label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                        placeholder="مثلاً: اجا، المنصورة..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">العنوان بالتفصيل</label>
                                <input
                                    type="text"
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 h-11 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] h-11 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold"
                                >
                                    حفظ التغييرات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
