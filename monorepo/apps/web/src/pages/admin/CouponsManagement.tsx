import { useState } from 'react';

interface Coupon {
    id: number;
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    usageCount: number;
    usageLimit: number;
    minOrder?: number;
    expiryDate: string;
    status: 'active' | 'expired' | 'scheduled';
}

const COUPONS: Coupon[] = [
    { id: 1, code: 'WELCOME10', discount: 10, type: 'percentage', usageCount: 45, usageLimit: 100, minOrder: 500, expiryDate: '2024-12-30', status: 'active' },
    { id: 2, code: 'FLASH50', discount: 50, type: 'fixed', usageCount: 50, usageLimit: 50, minOrder: 1000, expiryDate: '2023-10-20', status: 'expired' },
    { id: 3, code: 'BF2023', discount: 25, type: 'percentage', usageCount: 0, usageLimit: 500, expiryDate: '2023-11-01', status: 'scheduled' },
];

export function CouponsManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Form State (Simplified for UI only)
    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        discount: 0,
        type: 'percentage',
        usageLimit: 100,
        expiryDate: '',
    });

    const handleEdit = (coupon: Coupon) => {
        setFormData(coupon);
        setEditId(coupon.id);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditId(null);
        setFormData({ code: '', discount: 0, type: 'percentage', usageLimit: 100, expiryDate: '' });
    };

    const handleDelete = (id: number) => {
        setCoupons(prev => prev.filter(c => c.id !== id));
    };

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
                        <p className="text-slate-400 text-sm font-medium">مرات الاستخدام (هذا الشهر)</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {coupons.reduce((acc, c) => acc + c.usageCount, 0)} <span className="text-sm font-normal text-slate-500">مرة</span>
                        </h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="absolute top-0 left-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">savings</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الخصومات المقدمة</p>
                        <h3 className="text-2xl font-bold text-white mt-1">12,500 <span className="text-sm font-normal text-slate-500">ج.م</span></h3>
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
                    <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" onSubmit={(e) => e.preventDefault()}>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">رمز الكوبون</label>
                            <div className="flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    className="flex-1 rounded-r-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm h-10 px-3"
                                    placeholder="مثال: SUMMER2024"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                                <button type="button" className="inline-flex items-center px-4 rounded-l-lg border border-l-0 border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors">
                                    توليد تلقائي
                                </button>
                            </div>
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
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">الحد الأدنى للطلب</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">تاريخ البدء</label>
                            <input
                                type="date"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3 [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">تاريخ الانتهاء</label>
                            <input
                                type="date"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3 [color-scheme:dark]"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">نوع الاستخدام</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="∞"
                                value={formData.usageLimit}
                                onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">حد لكل مستخدم</label>
                            <input
                                type="number"
                                className="w-full h-10 rounded-lg bg-[#161b26] border-white/10 text-white placeholder-slate-500 focus:border-primary focus:ring-primary text-sm px-3"
                                placeholder="1"
                            />
                        </div>
                        <div className="lg:col-span-2 flex items-center gap-4 mt-2">
                            <button className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                                {editId ? 'تحديث الكوبون' : 'حفظ الكوبون'}
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
                        <div className="flex bg-[#161b26] rounded-lg p-1 border border-white/5">
                            <button className="px-3 py-1 text-xs font-bold text-white bg-primary rounded shadow-sm">الكل</button>
                            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white">النشطة</button>
                            <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white">المنتهية</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/5">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
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
                            {coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 select-all">
                                                {coupon.code}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white">
                                        {coupon.type === 'percentage' ? `${coupon.discount}%` : `${coupon.discount} ج.م`}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex flex-col text-xs gap-1">
                                            <span>حد أدنى: {coupon.minOrder ? `${coupon.minOrder} ج.م` : 'بدون'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{coupon.expiryDate}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'} transition-all`}
                                                    style={{ width: `${(coupon.usageCount / coupon.usageLimit) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs">{coupon.usageCount}/{coupon.usageLimit}</span>
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
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-1.5 rounded hover:bg-secondary/20 text-slate-400 hover:text-secondary transition-colors"
                                                title="حذف"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
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

export default CouponsManagement;
