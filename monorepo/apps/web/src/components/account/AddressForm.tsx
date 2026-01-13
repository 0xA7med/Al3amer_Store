import { useState, useEffect } from 'react';
import type { Address } from '../../hooks/useAddresses';

const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
];

interface AddressFormProps {
    initialData?: Address | null;
    onSubmit: (data: Omit<Address, 'id'>) => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

export function AddressForm({ initialData, onSubmit, onCancel, isLoading }: AddressFormProps) {
    const [formData, setFormData] = useState<Omit<Address, 'id'>>({
        title: '',
        fullName: '',
        phone: '',
        phone2: '', // New field
        governorate: '',
        city: '',
        address: '',
        isDefault: false,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                fullName: initialData.fullName,
                phone: initialData.phone,
                phone2: initialData.phone2 || '',
                governorate: initialData.governorate,
                city: initialData.city,
                address: initialData.address,
                isDefault: initialData.isDefault,
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                {/* Address Label & Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">اسم العنوان (مثل: المنزل، العمل)</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                            placeholder="المنزل"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">الاسم بالكامل</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                            placeholder="اسم المستلم"
                        />
                    </div>
                </div>

                {/* Phones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07] text-left dir-ltr"
                            placeholder="01xxxxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">رقم هاتف إضافي (اختياري)</label>
                        <input
                            type="tel"
                            value={formData.phone2}
                            onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07] text-left dir-ltr"
                            placeholder="رقم بديل"
                        />
                    </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">المحافظة</label>
                        <div className="relative">
                            <select
                                required
                                value={formData.governorate}
                                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:bg-white/[0.07]"
                            >
                                <option value="" className="bg-[#181a20]">اختر المحافظة...</option>
                                {GOVERNORATES.map(gov => (
                                    <option key={gov} value={gov} className="bg-[#181a20]">{gov}</option>
                                ))}
                            </select>
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-lg">expand_more</span>
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">المدينة / الحي</label>
                        <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                            placeholder="المدينة أو المنطقة"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">العنوان بالتفصيل</label>
                    <textarea
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-slate-600 hover:bg-white/[0.07]"
                        placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة..."
                    />
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <input
                        type="checkbox"
                        id="isDefault"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="w-5 h-5 rounded border-white/10 bg-[#181a20] text-primary focus:ring-primary focus:ring-offset-0 accent-primary cursor-pointer"
                    />
                    <label htmlFor="isDefault" className="text-gray-300 cursor-pointer select-none">
                        تعيين كعنوان افتراضي للشحن
                    </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>}
                        {initialData ? 'حفظ التغييرات' : 'إضافة العنوان'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-xl transition-colors border border-white/10"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </form>
    );
}
