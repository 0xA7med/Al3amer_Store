import { useState } from 'react';
import { useCoupons, type Coupon, type CreateCouponData } from '../../hooks/useCoupons';

interface FormData {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    usageLimit: number;
    minOrder?: number;
    startDate?: string;
    expiryDate: string;
}

const initialFormData: FormData = {
    code: '',
    discount: 0,
    type: 'percentage',
    usageLimit: 100,
    expiryDate: '',
};

export function CouponsManagement() {
    const { coupons, isLoading, createCoupon, updateCoupon, deleteCoupon, isCreating, isUpdating, isDeleting } = useCoupons();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; coupon: Coupon | null }>({ show: false, coupon: null });

    const handleEdit = (coupon: Coupon) => {
        setFormData({
            code: coupon.code,
            discount: parseFloat(coupon.discount),
            type: coupon.type,
            usageLimit: coupon.usageLimit,
            minOrder: coupon.minOrder ? parseFloat(coupon.minOrder) : undefined,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        });
        setEditId(coupon.id);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditId(null);
        setFormData(initialFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data: CreateCouponData = {
                code: formData.code,
                discount: formData.discount,
                type: formData.type,
                usageLimit: formData.usageLimit,
                minOrder: formData.minOrder,
                expiryDate: formData.expiryDate,
            };

            if (editId) {
                await updateCoupon({ id: editId, data });
            } else {
                await createCoupon(data);
            }
            handleCloseForm();
        } catch (error) {
            console.error('Failed to save coupon:', error);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm.coupon) {
            try {
                await deleteCoupon(deleteConfirm.coupon.id);
                setDeleteConfirm({ show: false, coupon: null });
            } catch (error) {
                console.error('Failed to delete coupon:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">جاري تحميل الكوبونات...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        كوبونات الخصم
                        <span className="h-6 w-px bg-white/10 mx-2"></span>
                        <button
                            onClick={() => { setShowForm(true); setEditId(null); }}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            إضافة كوبون جديد
                        </button>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block w-80">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        <input
                            type="text"
                            placeholder="بحث عن رمز الكوبون..."
                            className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#161b26] border-none text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">local_offer</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الكوبونات النشطة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {coupons.filter(c => c.status === 'active').length} <span className="text-sm font-normal text-slate-500">كوبون</span>
                        </h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-emerald-500">check_circle</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">مرات الاستخدام</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)} <span className="text-sm font-normal text-slate-500">مرة</span>
                        </h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">savings</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الكوبونات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{coupons.length} <span className="text-sm font-normal text-slate-500">كوبون</span></h3>
                    </div>
                </div>
            </div>

            {/* Inline Form (Create/Edit) */}
            {showForm && (
                <div className="glass-panel rounded-xl p-6 border-t-4 border-t-primary relative animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">edit_square</span>
                            {editId ? 'تعديل كوبون' : 'إنشاء كوبون جديد'}
                        </h3>
                        <button onClick={handleCloseForm} className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" onSubmit={handleSubmit}>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">رمز الكوبون</label>
                            <input
                                type="text"
                                className="w-full rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm h-10 px-3"
                                placeholder="مثال: SUMMER2024"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">نوع الخصم</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${formData.type === 'percentage' ? 'border-primary bg-primary/10' : 'border-white/10 bg-[#161b26] hover:border-primary/50'}`}>
                                    <input
                                        type="radio"
                                        name="discountType"
                                        className="text-primary bg-slate-800 border-slate-600 focus:ring-primary"
                                        checked={formData.type === 'percentage'}
                                        onChange={() => setFormData({ ...formData, type: 'percentage' })}
                                    />
                                    <span className="text-sm text-white">نسبة مئوية (%)</span>
                                </label>
                                <label className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${formData.type === 'fixed' ? 'border-primary bg-primary/10' : 'border-white/10 bg-[#161b26] hover:border-primary/50'}`}>
                                    <input
                                        type="radio"
                                        name="discountType"
                                        className="text-primary bg-slate-800 border-slate-600 focus:ring-primary"
                                        checked={formData.type === 'fixed'}
                                        onChange={() => setFormData({ ...formData, type: 'fixed' })}
                                    />
                                    <span className="text-sm text-white">مبلغ ثابت (ج.م)</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">قيمة الخصم</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="10"
                                value={formData.discount}
                                onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">الحد الأدنى للطلب</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="0"
                                value={formData.minOrder || ''}
                                onChange={e => setFormData({ ...formData, minOrder: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">تاريخ الانتهاء</label>
                            <input
                                type="date"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3 [color-scheme:dark]"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">حد الاستخدام</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="100"
                                value={formData.usageLimit}
                                onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="lg:col-span-4 flex items-center gap-4 mt-2">
                            <button
                                type="submit"
                                disabled={isCreating || isUpdating}
                                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                {(isCreating || isUpdating) ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    editId ? 'تحديث الكوبون' : 'حفظ الكوبون'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="px-6 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-bold transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Coupons List */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white">قائمة الكوبونات</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">الكود</th>
                                <th className="px-6 py-4 whitespace-nowrap">قيمة الخصم</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحدود</th>
                                <th className="px-6 py-4 whitespace-nowrap">تاريخ الانتهاء</th>
                                <th className="px-6 py-4 whitespace-nowrap">مرات الاستخدام</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-symbols-outlined text-4xl mb-2">local_offer</span>
                                        <p>لا توجد كوبونات حتى الآن</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 select-all">
                                                    {coupon.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {coupon.type === 'percentage' ? `${parseFloat(coupon.discount)}%` : `${parseFloat(coupon.discount)} ج.م`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <div className="flex flex-col text-xs gap-1">
                                                <span>حد أدنى: {coupon.minOrder ? `${parseFloat(coupon.minOrder)} ج.م` : 'بدون'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {new Date(coupon.expiryDate).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'} transition-all`}
                                                        style={{ width: `${((coupon.usageCount || 0) / (coupon.usageLimit || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs">{coupon.usageCount || 0}/{coupon.usageLimit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${coupon.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : coupon.status === 'expired'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                }`}>
                                                <span className={`size-1.5 rounded-full ${coupon.status === 'active' ? 'bg-emerald-400' :
                                                    coupon.status === 'expired' ? 'bg-red-400' : 'bg-yellow-400'
                                                    }`}></span>
                                                {coupon.status === 'active' ? 'نشط' : coupon.status === 'expired' ? 'منتهي' : 'مجدول'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(coupon)}
                                                    className="p-1.5 rounded hover:bg-primary/20 text-slate-400 hover:text-primary transition-colors"
                                                    title="تعديل"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ show: true, coupon })}
                                                    className="p-1.5 rounded hover:bg-secondary/20 text-slate-400 hover:text-secondary transition-colors"
                                                    title="حذف"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                                <span className="material-symbols-outlined text-[28px]">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">تأكيد الحذف</h3>
                                <p className="text-sm text-slate-400">هل أنت متأكد من حذف هذا الكوبون؟</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 mb-6">
                            <p className="text-white font-mono font-bold">{deleteConfirm.coupon?.code}</p>
                            <p className="text-xs text-slate-500">
                                {deleteConfirm.coupon?.type === 'percentage'
                                    ? `${parseFloat(deleteConfirm.coupon?.discount || '0')}% خصم`
                                    : `${parseFloat(deleteConfirm.coupon?.discount || '0')} ج.م خصم`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الحذف...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        نعم، احذف الكوبون
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm({ show: false, coupon: null })}
                                disabled={isDeleting}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-white/10"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CouponsManagement;
