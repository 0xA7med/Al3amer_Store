import { useState } from 'react';
import { Link } from 'react-router-dom';

export function AddProduct() {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        cost: '',
        sku: '',
        stock: '',
        barcode: '',
        category: '',
        brand: '',
        status: 'active',
        videoUrl: '',
        metaTitle: '',
        metaDescription: '',
    });

    const [specs, setSpecs] = useState([{ key: 'المعالج', value: 'Intel Core i5 11th Gen' }, { key: 'الذاكرة', value: '8GB DDR4' }]);
    const [tags, setTags] = useState(['جديد']);
    const [tagInput, setTagInput] = useState('');
    const [mode, setMode] = useState<'simple' | 'pro'>('pro');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addSpec = () => {
        setSpecs([...specs, { key: '', value: '' }]);
    };

    const removeSpec = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
        const newSpecs = [...specs];
        newSpecs[index][field] = value;
        setSpecs(newSpecs);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/admin/products" className="size-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                        <div>
                            <h2 className="text-white text-lg font-bold tracking-tight">إضافة منتج جديد</h2>
                            <p className="text-slate-500 text-xs">إدارة المنتجات / إضافة</p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center bg-black/20 p-1 rounded-full border border-white/5">
                        <button
                            onClick={() => setMode('simple')}
                            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'simple' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            وضع بسيط
                        </button>
                        <button
                            onClick={() => setMode('pro')}
                            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all border border-transparent ${mode === 'pro' ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 border-white/10' : 'text-slate-400 hover:text-white'}`}
                        >
                            وضع متقدم (Pro)
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all border border-white/10 group relative overflow-hidden">
                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        <span className="material-symbols-outlined text-[20px] text-indigo-400 group-hover:text-indigo-300">auto_fix_high</span>
                        <span>تعبئة تلقائية (AI)</span>
                    </button>
                    <div className="h-6 w-px bg-white/10"></div>
                    <button className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        <span>حفظ</span>
                    </button>
                    <div className="flex items-center gap-3 pr-2">
                        {/* User Avatar */}
                        <div className="size-9 rounded-full bg-slate-700 bg-cover bg-center border border-white/10 ring-2 ring-transparent hover:ring-primary/50 transition-all cursor-pointer" style={{ backgroundImage: `url('https://i.pravatar.cc/150?u=admin')` }}></div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                <form className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

                    {/* Main Content (Left Column) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">

                        {/* AI Input */}
                        <div className="glass-panel rounded-xl p-1 relative">
                            <div className="absolute inset-[-1px] rounded-xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-primary opacity-50 pointer-events-none"></div>
                            <div className="bg-[#161b26]/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-4 relative z-10">
                                <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                </div>
                                <div className="flex-1">
                                    <input className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0" placeholder="الصق رابط منتج أو اكتب اسمه هنا لإنشاء التفاصيل تلقائياً..." type="text" />
                                </div>
                                <button className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md transition-colors" type="button">
                                    توليد
                                </button>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="glass-panel rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">feed</span>
                                    البيانات الأساسية
                                </h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">{mode === 'simple' ? 'وضع بسيط' : 'وضع متقدم'}</span>
                            </div>
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">اسم المنتج <span className="text-secondary">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                            placeholder="مثال: جهاز كاشير لمس 15 بوصة Sunmi T2"
                                        />
                                        <button className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-md text-indigo-400 hover:text-indigo-300 transition-colors" title="تحسين العنوان باستخدام AI" type="button">
                                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                                        <span>وصف المنتج</span>
                                        <span className="text-xs text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">auto_fix_normal</span> كتابة الوصف تلقائياً
                                        </span>
                                    </label>
                                    <div className="rounded-lg bg-white/5 overflow-hidden border border-white/10 focus-within:border-primary/50 transition-colors">
                                        <div className="flex items-center gap-1 p-2 border-b border-white/5 bg-white/5">
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">format_bold</span></button>
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">format_italic</span></button>
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">link</span></button>
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" type="button"><span className="material-symbols-outlined text-[18px]">image</span></button>
                                        </div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="w-full h-40 px-4 py-3 bg-transparent text-white text-sm border-none focus:ring-0 placeholder-slate-600 resize-none leading-relaxed"
                                            placeholder="اكتب وصفاً تفصيلياً ومميزاً للمنتج يشمل المميزات والاستخدامات..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Media */}
                        <div className="glass-panel rounded-xl p-6 relative overflow-hidden group">
                            <div className="absolute inset-0 border-2 border-dashed border-primary/0 group-hover:border-primary/20 transition-all rounded-xl pointer-events-none z-0"></div>
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">perm_media</span>
                                    الوسائط والصور
                                </h3>
                                <div className="flex gap-2">
                                    <button className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded transition-colors border border-white/5" type="button">استيراد من رابط</button>
                                    <button className="text-xs font-bold bg-primary/20 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1" type="button">
                                        <span className="material-symbols-outlined text-[16px]">upload</span> رفع صور
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">الصورة الرئيسية (Main)</label>
                                    <div className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all relative group/main">
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/main:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl backdrop-blur-sm">
                                            <button className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded shadow hover:bg-slate-200" type="button">تغيير الصورة</button>
                                            <button className="text-red-400 text-xs font-bold hover:text-red-300" type="button">حذف</button>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-500 text-4xl">add_a_photo</span>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">معرض الصور (Gallery)</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        <div className="aspect-square rounded-lg border border-white/10 relative group overflow-hidden bg-surface-dark">
                                            {/* Example Image */}
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-xs">IMG 1</div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button className="p-1 bg-white/10 hover:bg-primary text-white rounded" title="تعيين كرئيسية" type="button"><span className="material-symbols-outlined text-[16px]">star</span></button>
                                                <button className="p-1 bg-white/10 hover:bg-red-500 text-white rounded" title="حذف" type="button"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                            </div>
                                        </div>
                                        <div className="aspect-square rounded-lg border border-dashed border-white/10 hover:border-white/30 bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
                                            <span className="material-symbols-outlined text-slate-500 text-[24px]">add_photo_alternate</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">رابط فيديو (YouTube)</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500">
                                                <span className="material-symbols-outlined text-[20px]">play_circle</span>
                                            </span>
                                            <input
                                                name="videoUrl"
                                                value={formData.videoUrl}
                                                onChange={handleInputChange}
                                                className="w-full h-10 pr-10 pl-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-0 focus:border-primary/50 transition-colors"
                                                placeholder="https://youtube.com/watch?v=..."
                                                type="url"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specs & SEO (Split Row) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Technical Specs */}
                            <div className="glass-panel rounded-xl p-6 border-t-2 border-t-primary/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">memory</span>
                                        المواصفات الفنية
                                    </h3>
                                    <button onClick={addSpec} className="text-xs font-bold text-primary hover:text-white transition-colors" type="button">+ إضافة</button>
                                </div>
                                <div className="space-y-2">
                                    {specs.map((spec, index) => (
                                        <div key={index} className="flex items-center gap-2 group">
                                            <div className="p-1 text-slate-500 cursor-move"><span className="material-symbols-outlined text-[16px]">drag_indicator</span></div>
                                            <input
                                                className="w-1/3 h-9 px-3 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:ring-0 focus:border-primary/50"
                                                type="text"
                                                value={spec.key}
                                                onChange={(e) => updateSpec(index, 'key', e.target.value)}
                                            />
                                            <input
                                                className="flex-1 h-9 px-3 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:ring-0 focus:border-primary/50"
                                                type="text"
                                                value={spec.value}
                                                onChange={(e) => updateSpec(index, 'value', e.target.value)}
                                            />
                                            <button onClick={() => removeSpec(index)} className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SEO */}
                            <div className="glass-panel rounded-xl p-6 border-t-2 border-t-purple-500/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                                        تحسين البحث (SEO)
                                    </h3>
                                    <button className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1" type="button">
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span> تحسين
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            name="metaTitle"
                                            value={formData.metaTitle}
                                            onChange={handleInputChange}
                                            className="w-full h-9 px-3 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:ring-0 focus:border-primary/50"
                                            placeholder="عنوان الميتا (Meta Title)"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            name="metaDescription"
                                            value={formData.metaDescription}
                                            onChange={handleInputChange}
                                            className="w-full h-20 px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:ring-0 focus:border-primary/50 resize-none"
                                            placeholder="وصف الميتا (Meta Description)"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="xl:col-span-1 flex flex-col gap-6">

                        {/* Publishing */}
                        <div className="glass-panel rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">النشر والظهور</h3>
                                <div className={`size-2 rounded-full shadow-[0_0_8px] ${formData.status === 'active' ? 'bg-green-500 shadow-green-500/60' : 'bg-slate-500 shadow-slate-500/60'}`}></div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">حالة المنتج</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:ring-0 focus:border-primary/50"
                                    >
                                        <option value="active">نشط (ظاهر في المتجر)</option>
                                        <option value="draft">مسودة</option>
                                        <option value="archived">مؤرشف</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t border-white/5">
                                    <span className="text-sm text-slate-300">عرض في الصفحة الرئيسية</span>
                                    <label className="inline-flex relative items-center cursor-pointer">
                                        <input className="sr-only peer" type="checkbox" />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-[18px]">payments</span>
                                السعر
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">سعر البيع (EGP)</label>
                                    <div className="relative group">
                                        <input
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xl placeholder-slate-600 focus:ring-0 group-hover:border-emerald-500/50 transition-colors"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold text-xs">ج.م</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">سعر الخصم</label>
                                        <input
                                            name="discountPrice"
                                            value={formData.discountPrice}
                                            onChange={handleInputChange}
                                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-0 focus:border-primary/50"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">التكلفة (Pro)</label>
                                        <input
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleInputChange}
                                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-0 focus:border-primary/50"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-slate-400">هامش الربح المتوقع:</span>
                                    <span className="text-emerald-400 font-bold">-- %</span>
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-[18px]">inventory</span>
                                المخزون
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">رقم التخزين (SKU)</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-0 focus:border-primary/50"
                                            placeholder="SKU-12345"
                                            type="text"
                                        />
                                        <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 text-slate-400 hover:text-white transition-colors" title="توليد تلقائي" type="button">
                                            <span className="material-symbols-outlined text-[16px]">refresh</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">الكمية المتوفرة</label>
                                    <input
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-base placeholder-slate-600 focus:ring-0 focus:border-primary/50"
                                        placeholder="0"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">الباركود (ISBN/UPC)</label>
                                    <div className="relative">
                                        <input
                                            name="barcode"
                                            value={formData.barcode}
                                            onChange={handleInputChange}
                                            className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-0 focus:border-primary/50"
                                            placeholder=""
                                            type="text"
                                        />
                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                                            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="glass-panel rounded-xl p-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-[18px]">category</span>
                                التصنيف
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">القسم <span className="text-secondary">*</span></label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:ring-0 focus:border-primary/50"
                                    >
                                        <option value="">اختر القسم...</option>
                                        <option value="pos">أجهزة الكاشير</option>
                                        <option value="scales">الموازين</option>
                                        <option value="scanners">قارئ الباركود</option>
                                        <option value="printers">الطابعات</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">العلامة التجارية</label>
                                    <select
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleInputChange}
                                        className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:ring-0 focus:border-primary/50"
                                    >
                                        <option value="">Samsung</option>
                                        <option value="">Epson</option>
                                        <option value="">Sunmi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">الوسوم (Tags)</label>
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 min-h-[80px] flex flex-wrap content-start gap-2 focus-within:border-primary/50 transition-colors">
                                        {tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1">
                                                {tag} <button onClick={() => removeTag(tag)} className="hover:text-white" type="button">×</button>
                                            </span>
                                        ))}
                                        <input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            className="bg-transparent border-none text-white text-xs p-0 focus:ring-0 w-full placeholder-slate-600 mt-1"
                                            placeholder="اكتب واضغط Enter..."
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
                <div className="h-10"></div>
            </div>
        </div>
    );
}

export default AddProduct;
