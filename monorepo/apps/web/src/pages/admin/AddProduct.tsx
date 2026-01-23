import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCategories } from '../../hooks/useProducts';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useAdmin';
import { CustomSelect } from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';

// Tab type definition
type TabKey = 'general' | 'pricing' | 'media' | 'specs' | 'seo';

interface TabItem {
    key: TabKey;
    label: string;
    icon: string;
    color: string;
}

const TABS: TabItem[] = [
    { key: 'general', label: 'بيانات أساسية', icon: 'feed', color: 'text-emerald-400' },
    { key: 'pricing', label: 'السعر والمخزون', icon: 'payments', color: 'text-amber-400' },
    { key: 'media', label: 'الصور والفيديو', icon: 'perm_media', color: 'text-blue-400' },
    { key: 'specs', label: 'المواصفات', icon: 'memory', color: 'text-purple-400' },
    { key: 'seo', label: 'محركات البحث', icon: 'search', color: 'text-indigo-400' },
];

export function AddProduct() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // Active Tab State
    const [activeTab, setActiveTab] = useState<TabKey>('general');

    // Queries & Mutations
    const { data: productData, isLoading: isLoadingProduct } = useProduct(id || '');
    const { data: categoriesData } = useCategories();
    const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || [];
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        cost: '',
        sku: '',
        external_id: '', // Pro_ID for inventory sync
        stock: '',
        barcode: '',
        category: '',
        brand: '',
        status: 'active',
        videoUrl: '',
        metaTitle: '',
        metaDescription: '',
        slug: '',
    });

    const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
        { key: 'المعالج', value: '' },
        { key: 'الذاكرة', value: '' }
    ]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
    const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
    const [selectedUsage, setSelectedUsage] = useState<string[]>([]);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // Populate form data when product data is fetched
    useEffect(() => {
        if (isEditMode && productData) {
            setFormData({
                name: productData.name || '',
                description: productData.description || '',
                price: productData.price || '',
                discountPrice: productData.discountPrice || '',
                cost: productData.cost || '',
                sku: productData.sku || '',
                external_id: productData.external_id || '',
                stock: String(productData.stock || 0),
                barcode: productData.barcode || '',
                category: productData.categoryId || productData.category?.id || '',
                brand: productData.brandId || productData.brand?.id || '',
                status: productData.status === 'archived' ? 'draft' : (productData.status || 'active'),
                videoUrl: productData.videoUrl || '',
                metaTitle: productData.metaTitle || '',
                metaDescription: productData.metaDescription || '',
                slug: productData.slug || '',
            });

            // Recursive helper to flatten nested {key, value} objects
            const flattenSpecs = (s: any): { key: string; value: string }[] => {
                if (!s) return [];
                if (!Array.isArray(s) && typeof s === 'object') {
                    return Object.entries(s).map(([k, v]) => ({
                        key: String(k),
                        value: typeof v === 'string' ? v : JSON.stringify(v)
                    }));
                }
                if (!Array.isArray(s)) return [];
                return s.map(item => {
                    if (typeof item === 'string') return { key: 'المواصفة', value: item };
                    let key = String(item.key || '');
                    let value = item.value;
                    while (value && typeof value === 'object' && 'value' in value) {
                        value = value.value;
                    }
                    return { key, value: String(value || '') };
                });
            };

            const finalSpecs = flattenSpecs(productData.specifications);
            setSpecs(finalSpecs.length > 0 ? finalSpecs : [
                { key: 'المعالج', value: '' },
                { key: 'الذاكرة', value: '' }
            ]);

            const connSpec = finalSpecs.find(s => s.key === 'connectivity' || s.key === 'اتصال')?.value;
            if (connSpec) setSelectedConnectivity(connSpec.split(',').map(s => s.trim()));

            const usageSpec = finalSpecs.find(s => s.key === 'usage' || s.key === 'الاستخدام')?.value;
            if (usageSpec) setSelectedUsage(usageSpec.split(',').map(s => s.trim()));

            if (productData.tags) setTags(productData.tags);
            if (productData.images) {
                setImages(productData.images.map((img: any) => ({ url: img.url, isPrimary: img.isPrimary })));
            }
        }
    }, [isEditMode, productData]);

    const showHardwareSpecs = useMemo(() => {
        const cat = categoriesList.find((c: any) => c.id === formData.category);
        const hardwareSlugs = ['pos', 'printers', 'scanners', 'scales', 'drawers', 'pos-systems'];
        return hardwareSlugs.includes(cat?.slug) || cat?.slug?.includes('print') || cat?.slug?.includes('scan');
    }, [formData.category, categoriesList]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'name' && !isEditMode) {
                newData.slug = value
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\u0621-\u064A-]+/g, '')
                    .replace(/--+/g, '-')
                    .replace(/^-+/, '')
                    .replace(/-+$/, '');
            }
            return newData;
        });
    };

    const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
    const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
    const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
        setSpecs(prev => {
            const newSpecs = [...prev];
            newSpecs[index] = { ...newSpecs[index], [field]: value };
            return newSpecs;
        });
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => setTags(tags.filter(tag => tag !== tagToRemove));

    const handleAIGenerate = async () => {
        if (!formData.name) {
            toast.error('يرجى كتابة اسم المنتج أولاً');
            return;
        }
        setIsGeneratingAI(true);
        try {
            const api = (await import('../../lib/api')).default;
            const { data } = await api.post('/products/ai-generate', { name: formData.name });

            setFormData(prev => ({
                ...prev,
                description: data.description || prev.description,
                metaTitle: data.metaTitle || prev.metaTitle,
                metaDescription: data.metaDescription || prev.metaDescription,
            }));

            if (data.features && Array.isArray(data.features)) {
                const featuresText = data.features.map((f: string) => `- ${f}`).join('\n');
                setFormData(prev => ({
                    ...prev,
                    description: (prev.description ? prev.description + '\n\n' : '') + '### المميزات:\n' + featuresText
                }));
            }
            toast.success('تم توليد المحتوى بنجاح');
        } catch (error) {
            console.error('AI Generate error:', error);
            toast.error('فشل توليد المحتوى');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async () => {
        const finalSpecs = specs.filter(s =>
            s.key &&
            s.value &&
            s.key !== 'connectivity' &&
            s.key !== 'اتصال' &&
            s.key !== 'usage' &&
            s.key !== 'الاستخدام'
        );

        if (selectedConnectivity.length > 0) {
            finalSpecs.push({ key: 'connectivity', value: selectedConnectivity.join(', ') });
        }
        if (selectedUsage.length > 0) {
            finalSpecs.push({ key: 'usage', value: selectedUsage.join(', ') });
        }

        const payload = {
            ...formData,
            stock: Number(formData.stock) || 0,
            price: formData.price ? String(formData.price) : '0',
            discountPrice: formData.discountPrice || null,
            cost: formData.cost || null,
            specifications: finalSpecs,
            tags: tags,
            images: images,
            categoryId: formData.category || null,
            brandId: formData.brand || null,
            videoUrl: formData.videoUrl || null,
            metaTitle: formData.metaTitle || null,
            metaDescription: formData.metaDescription || null,
            sku: formData.sku || null,
            external_id: formData.external_id || null,
            slug: formData.slug || null,
        };

        const { category, brand, ...finalPayload } = payload;

        try {
            if (isEditMode && id) {
                await updateProductMutation.mutateAsync({ productId: id, data: finalPayload as any });
                toast.success('تم تحديث المنتج بنجاح');
            } else {
                await createProductMutation.mutateAsync(finalPayload as any);
                toast.success('تم إنشاء المنتج بنجاح');
            }
            navigate('/admin/products');
        } catch (error) {
            console.error('Failed to save product:', error);
            toast.error('حدث خطأ أثناء حفظ المنتج');
        }
    };

    if (isEditMode && isLoadingProduct) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400">جاري تحميل بيانات المنتج...</p>
                </div>
            </div>
        );
    }

    // ====== TAB CONTENT COMPONENTS ======

    // Tab 1: General (بيانات أساسية)
    const GeneralTab = () => (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-2 flex flex-col gap-6">
                {/* AI Input for new products */}
                {!isEditMode && (
                    <div className="glass-card p-1 relative">
                        <div className="absolute inset-[-1px] rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-primary opacity-50 pointer-events-none"></div>
                        <div className="bg-[#161b26]/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 relative z-10">
                            <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-indigo-400">psychology</span>
                            </div>
                            <div className="flex-1">
                                <input className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0" placeholder="الصق رابط منتج أو اكتب اسمه هنا لإنشاء التفاصيل تلقائياً..." type="text" />
                            </div>
                            <button className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors" type="button">
                                توليد بالذكاء الاصطناعي
                            </button>
                        </div>
                    </div>
                )}

                {/* Product Name & Slug */}
                <div className="glass-card">
                    <div className="card-header">
                        <span className="material-symbols-outlined text-emerald-400">edit_note</span>
                        <h3>اسم المنتج والرابط</h3>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <label className="field-label">اسم المنتج <span className="text-secondary">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input-field h-12 text-base"
                                    placeholder="مثال: جهاز كاشير لمس 15 بوصة Sunmi T2"
                                />
                                <button
                                    onClick={handleAIGenerate}
                                    disabled={isGeneratingAI}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                                    title="تحسين العنوان باستخدام AI"
                                    type="button"
                                >
                                    <span className={`material-symbols-outlined text-[20px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                        {isGeneratingAI ? 'autorenew' : 'auto_awesome'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="field-label">رابط المنتج (Slug / SEO URL)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    className="input-field font-mono"
                                    placeholder="مثال: epson-prt-100"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-black/30 px-2 py-1 rounded border border-white/5">
                                    /product/{formData.slug || '...'}
                                </div>
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500">استخدم الحروف الإنجليزية والأرقام والشرطات (-) فقط</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="glass-card">
                    <div className="card-header">
                        <span className="material-symbols-outlined text-blue-400">description</span>
                        <h3>وصف المنتج</h3>
                        <button
                            onClick={handleAIGenerate}
                            disabled={isGeneratingAI}
                            className="mr-auto text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                            type="button"
                        >
                            <span className={`material-symbols-outlined text-[16px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                {isGeneratingAI ? 'autorenew' : 'auto_fix_normal'}
                            </span>
                            {isGeneratingAI ? 'جاري التوليد...' : 'كتابة تلقائية بالذكاء الاصطناعي'}
                        </button>
                    </div>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="input-field h-48 resize-none leading-relaxed"
                        placeholder="اكتب وصفاً تفصيلياً ومميزاً للمنتج يشمل المميزات والاستخدامات..."
                    />
                </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
                {/* Status */}
                <div className="glass-card">
                    <div className="card-header">
                        <span className={`material-symbols-outlined ${formData.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {formData.status === 'active' ? 'check_circle' : 'visibility_off'}
                        </span>
                        <h3>النشر والظهور</h3>
                    </div>
                    <CustomSelect
                        label="حالة المنتج"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                        options={[
                            { value: 'active', label: 'نشط (ظاهر في المتجر)' },
                            { value: 'draft', label: 'غير نشط (مخفي)' }
                        ]}
                        placeholder="اختر الحالة..."
                    />
                </div>

                {/* Category */}
                <div className="glass-card">
                    <div className="card-header">
                        <span className="material-symbols-outlined text-blue-400">category</span>
                        <h3>التصنيف</h3>
                    </div>
                    <div className="space-y-4">
                        <CustomSelect
                            label="القسم"
                            required
                            value={formData.category}
                            onChange={(val) => setFormData({ ...formData, category: val })}
                            options={categoriesList.map((cat: any) => ({
                                value: cat.id,
                                label: cat.name
                            }))}
                            placeholder="اختر القسم..."
                        />
                        {/* Tags */}
                        <div>
                            <label className="field-label">الوسوم (Tags)</label>
                            <div className="p-3 rounded-xl bg-white/5 border border-white/10 min-h-[90px] flex flex-wrap content-start gap-2 focus-within:border-primary/50 transition-colors">
                                {tags.map((tag, i) => (
                                    <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-white" type="button">×</button>
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
        </div>
    );

    // Tab 2: Pricing & Inventory (السعر والمخزون)
    const PricingTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
            {/* Pricing */}
            <div className="glass-card">
                <div className="card-header">
                    <span className="material-symbols-outlined text-emerald-400">payments</span>
                    <h3>التسعير</h3>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="field-label">سعر البيع (EGP) <span className="text-secondary">*</span></label>
                        <div className="relative">
                            <input
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className="input-field h-14 text-2xl font-bold pr-4"
                                placeholder="0.00"
                                type="number"
                            />
                            <span className="absolute inset-y-0 left-4 flex items-center text-slate-500 font-bold">ج.م</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="field-label">سعر الخصم</label>
                            <input
                                name="discountPrice"
                                value={formData.discountPrice}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="0.00"
                                type="number"
                            />
                        </div>
                        <div>
                            <label className="field-label">التكلفة</label>
                            <input
                                name="cost"
                                value={formData.cost}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="0.00"
                                type="number"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory */}
            <div className="glass-card">
                <div className="card-header">
                    <span className="material-symbols-outlined text-amber-400">inventory</span>
                    <h3>المخزون</h3>
                </div>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="field-label">رقم التخزين (SKU)</label>
                            <input
                                name="sku"
                                value={formData.sku}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="SKU-12345"
                                type="text"
                            />
                        </div>
                        <div>
                            <label className="field-label">رقم المنتج في النظام المحاسبي (Pro_ID)</label>
                            <input
                                name="external_id"
                                value={formData.external_id}
                                onChange={handleInputChange}
                                className="input-field"
                                placeholder="PRO-001"
                                type="text"
                            />
                            <p className="mt-1.5 text-[10px] text-slate-500">لربط المنتج بجدول المخزون من Excel</p>
                        </div>
                    </div>
                    <div>
                        <label className="field-label">الكمية المتوفرة</label>
                        <input
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            className="input-field h-12 text-lg font-bold"
                            placeholder="0"
                            type="number"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    // Tab 3: Media (الصور والفيديو)
    const MediaTab = () => (
        <div className="space-y-6 max-w-6xl">
            {/* Images */}
            <div className="glass-card relative overflow-hidden group">
                <div className="absolute inset-0 border-2 border-dashed border-primary/0 group-hover:border-primary/20 transition-all rounded-2xl pointer-events-none z-0"></div>
                <div className="card-header relative z-10">
                    <span className="material-symbols-outlined text-blue-400">perm_media</span>
                    <h3>صور المنتج</h3>
                    <div className="mr-auto flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="image-upload"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    const files = Array.from(e.target.files);
                                    files.forEach(file => {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const dataUrl = reader.result as string;
                                            setImages(prev => [...prev, {
                                                url: dataUrl,
                                                isPrimary: prev.length === 0
                                            }]);
                                        };
                                        reader.readAsDataURL(file);
                                    });
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                const url = window.prompt('أدخل رابط الصورة:');
                                if (url) setImages([...images, { url, isPrimary: images.length === 0 }]);
                            }}
                            className="btn-secondary text-xs"
                            type="button"
                        >
                            استيراد من رابط
                        </button>
                        <button
                            onClick={() => document.getElementById('image-upload')?.click()}
                            className="btn-primary text-xs flex items-center gap-1.5"
                            type="button"
                        >
                            <span className="material-symbols-outlined text-[16px]">upload</span> رفع صور
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
                    {images.map((img, i) => (
                        <div key={i} className={`aspect-square rounded-xl border-2 bg-white/5 relative group/img overflow-hidden transition-all ${img.isPrimary ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}>
                            <img
                                src={img.url}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {!img.isPrimary && (
                                    <button
                                        onClick={() => {
                                            const newImages = images.map((image, idx) => ({ ...image, isPrimary: i === idx }));
                                            setImages(newImages);
                                        }}
                                        className="size-9 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                        title="تعيين كصورة أساسية"
                                        type="button"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">star</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const newImages = images.filter((_, idx) => idx !== i);
                                        if (img.isPrimary && newImages.length > 0) {
                                            newImages[0].isPrimary = true;
                                        }
                                        setImages(newImages);
                                    }}
                                    className="size-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                    title="حذف"
                                    type="button"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                            {img.isPrimary && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-lg">
                                    أساسية
                                </div>
                            )}
                        </div>
                    ))}
                    {images.length === 0 && (
                        <div
                            onClick={() => document.getElementById('image-upload')?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all col-span-2"
                        >
                            <span className="material-symbols-outlined text-slate-500 text-5xl">add_a_photo</span>
                            <span className="text-sm text-slate-500 mt-3 font-medium">اضغط لإضافة صور</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Video - Simplified */}
            <div className="glass-card max-w-2xl">
                <div className="card-header">
                    <span className="material-symbols-outlined text-red-400">play_circle</span>
                    <h3>فيديو يوتيوب</h3>
                </div>
                <div>
                    <label className="field-label">رابط فيديو YouTube</label>
                    <input
                        type="text"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="mt-2 text-[11px] text-slate-500">الصق رابط فيديو يوتيوب للعرض التوضيحي أو شرح الاستخدام</p>
                </div>
            </div>
        </div>
    );

    // Tab 4: Specifications (المواصفات)
    const SpecsTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
            {/* Technical Specs */}
            <div className="glass-card">
                <div className="card-header">
                    <span className="material-symbols-outlined text-purple-400">memory</span>
                    <h3>المواصفات الفنية</h3>
                    <button onClick={addSpec} className="mr-auto btn-ghost text-xs" type="button">
                        <span className="material-symbols-outlined text-[16px]">add</span> إضافة مواصفة
                    </button>
                </div>
                <div className="space-y-3">
                    {specs.map((spec, index) => (
                        <div key={index} className="flex items-center gap-2 group">
                            <div className="p-1.5 text-slate-500 cursor-move hover:text-slate-300">
                                <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                            </div>
                            <input
                                className="w-1/3 input-field h-10 text-xs"
                                type="text"
                                value={spec.key}
                                onChange={(e) => updateSpec(index, 'key', e.target.value)}
                                placeholder="اسم المواصفة"
                            />
                            <input
                                className="flex-1 input-field h-10 text-xs"
                                type="text"
                                value={spec.value}
                                onChange={(e) => updateSpec(index, 'value', e.target.value)}
                                placeholder="القيمة"
                            />
                            <button
                                onClick={() => removeSpec(index)}
                                className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                type="button"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    ))}
                    {specs.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2">list_alt</span>
                            <p className="text-sm">لا توجد مواصفات. اضغط "إضافة مواصفة" للبدء</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hardware Props */}
            {showHardwareSpecs && (
                <div className="glass-card border-t-2 border-t-blue-500/30">
                    <div className="card-header">
                        <span className="material-symbols-outlined text-blue-400">settings_input_component</span>
                        <h3>خصائص الهاردوير</h3>
                    </div>
                    <div className="space-y-6">
                        {/* Connectivity */}
                        <div>
                            <label className="field-label mb-3">خيارات الاتصال (Connectivity)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['USB', 'Bluetooth', 'Wi-Fi', 'Ethernet'].map(conn => (
                                    <button
                                        key={conn}
                                        type="button"
                                        onClick={() => {
                                            setSelectedConnectivity(prev =>
                                                prev.includes(conn) ? prev.filter(c => c !== conn) : [...prev, conn]
                                            );
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedConnectivity.includes(conn)
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {conn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Usage */}
                        <div>
                            <label className="field-label mb-3">نمط الاستخدام (Usage)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Handheld', 'Desktop', 'Industrial', 'Mobile'].map(usage => (
                                    <button
                                        key={usage}
                                        type="button"
                                        onClick={() => {
                                            setSelectedUsage(prev =>
                                                prev.includes(usage) ? prev.filter(u => u !== usage) : [...prev, usage]
                                            );
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedUsage.includes(usage)
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                                            }`}
                                    >
                                        {usage}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Tab 5: SEO (محركات البحث)
    const SeoTab = () => (
        <div className="max-w-2xl">
            <div className="glass-card">
                <div className="card-header">
                    <span className="material-symbols-outlined text-indigo-400">search</span>
                    <h3>تحسين محركات البحث (SEO)</h3>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="field-label">عنوان الميتا (Meta Title)</label>
                        <input
                            name="metaTitle"
                            value={formData.metaTitle}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="عنوان يظهر في نتائج البحث"
                            type="text"
                        />
                        <p className="mt-1.5 text-[10px] text-slate-500">الحد الأقصى: 60 حرف</p>
                    </div>
                    <div>
                        <label className="field-label">وصف الميتا (Meta Description)</label>
                        <textarea
                            name="metaDescription"
                            value={formData.metaDescription}
                            onChange={handleInputChange}
                            className="input-field h-28 resize-none"
                            placeholder="وصف مختصر يظهر في نتائج البحث..."
                        />
                        <p className="mt-1.5 text-[10px] text-slate-500">الحد الأقصى: 160 حرف</p>
                    </div>

                    {/* Preview */}
                    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">معاينة نتائج البحث</p>
                        <div className="space-y-1">
                            <p className="text-blue-400 text-sm font-medium truncate">
                                {formData.metaTitle || formData.name || 'عنوان المنتج'}
                            </p>
                            <p className="text-emerald-500 text-[11px] truncate">
                                al3amer.com/product/{formData.slug || '...'}
                            </p>
                            <p className="text-slate-400 text-xs line-clamp-2">
                                {formData.metaDescription || formData.description?.substring(0, 150) || 'وصف المنتج سيظهر هنا...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralTab />;
            case 'pricing': return <PricingTab />;
            case 'media': return <MediaTab />;
            case 'specs': return <SpecsTab />;
            case 'seo': return <SeoTab />;
            default: return <GeneralTab />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-xl border-b border-white/5">
                <div className="h-16 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/products" className="size-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                        <div>
                            <h2 className="text-white text-lg font-bold">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                            <p className="text-slate-500 text-xs">إدارة المنتجات</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/admin/products"
                            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            إلغاء
                        </Link>
                        <button
                            onClick={handleSubmit}
                            disabled={createProductMutation.isPending || updateProductMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">save</span>
                            )}
                            <span>{isEditMode ? 'حفظ التعديلات' : 'إنشاء المنتج'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="px-6 pb-0">
                    <nav className="flex gap-1 border-b border-white/5">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? 'text-white'
                                    : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.key ? tab.color : ''}`}>
                                    {tab.icon}
                                </span>
                                <span>{tab.label}</span>
                                {activeTab === tab.key && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-full"></span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <form onSubmit={(e) => e.preventDefault()}>
                    {renderTabContent()}
                </form>
                <div className="h-20"></div>
            </div>

            {/* Custom Styles */}
            <style>{`
                .glass-card {
                    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 1rem;
                    padding: 1.5rem;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .card-header h3 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                }
                .field-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: rgb(148 163 184);
                    margin-bottom: 0.5rem;
                }
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.75rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    border-color: rgba(16, 185, 129, 0.5);
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
                }
                .input-field::placeholder {
                    color: rgb(71 85 105);
                }
                .btn-primary {
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, rgb(16 185 129) 0%, rgb(5 150 105) 100%);
                    color: white;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    filter: brightness(1.1);
                }
                .btn-secondary {
                    padding: 0.5rem 1rem;
                    background: rgba(255,255,255,0.05);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-secondary:hover {
                    background: rgba(255,255,255,0.1);
                }
                .btn-ghost {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.5rem 0.75rem;
                    color: rgb(16 185 129);
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-ghost:hover {
                    background: rgba(16, 185, 129, 0.1);
                }
            `}</style>
        </div>
    );
}

export default AddProduct;
