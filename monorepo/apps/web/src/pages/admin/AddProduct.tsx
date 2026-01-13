import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCategories } from '../../hooks/useProducts'; // Retrieve details
import { useCreateProduct, useUpdateProduct } from '../../hooks/useAdmin';
import { CustomSelect } from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';

export function AddProduct() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

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
        stock: '',
        barcode: '',
        category: '',
        brand: '',
        status: 'active',
        videoUrl: '',
        videoTitle: '',
        videoDescription: '',
        metaTitle: '',
        metaDescription: '',
    });

    const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
        { key: 'المعالج', value: '' },
        { key: 'الذاكرة', value: '' }
    ]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [mode, setMode] = useState<'simple' | 'pro'>('pro');
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
                stock: String(productData.stock || 0),
                barcode: productData.barcode || '',
                category: productData.categoryId || productData.category?.id || '', // Use categoryId directly if available
                brand: productData.brandId || productData.brand?.id || '',
                status: productData.status === 'archived' ? 'draft' : (productData.status || 'active'),
                videoUrl: productData.videoUrl || '',
                videoTitle: productData.videoTitle || '',
                videoDescription: productData.videoDescription || '',
                metaTitle: productData.metaTitle || '',
                metaDescription: productData.metaDescription || '',
            });

            // Recursive helper to flatten nested {key, value} objects and handle object-to-array conversion
            const flattenSpecs = (s: any): { key: string; value: string }[] => {
                if (!s) return [];

                // If it's a plain object (e.g. {"Key": "Value"}), convert to [{key: "Key", value: "Value"}]
                if (!Array.isArray(s) && typeof s === 'object') {
                    return Object.entries(s).map(([k, v]) => ({
                        key: String(k),
                        value: typeof v === 'string' ? v : JSON.stringify(v)
                    }));
                }

                if (!Array.isArray(s)) return [];

                return s.map(item => {
                    // Handle case where item might be a string (legacy/corruption)
                    if (typeof item === 'string') return { key: 'المواصفة', value: item };

                    let key = String(item.key || '');
                    let value = item.value;

                    // If value is still an object with key/value, unwrap it (recursive fix)
                    while (value && typeof value === 'object' && 'value' in value) {
                        value = value.value;
                    }

                    return { key, value: String(value || '') };
                });
            };

            // Map specifications Safely
            const finalSpecs = flattenSpecs(productData.specifications);
            setSpecs(finalSpecs.length > 0 ? finalSpecs : [
                { key: 'المعالج', value: '' },
                { key: 'الذاكرة', value: '' }
            ]);

            // Extract connectivity and usage from specs
            const connSpec = finalSpecs.find(s => s.key === 'connectivity' || s.key === 'اتصال')?.value;
            if (connSpec) setSelectedConnectivity(connSpec.split(',').map(s => s.trim()));

            const usageSpec = finalSpecs.find(s => s.key === 'usage' || s.key === 'الاستخدام')?.value;
            if (usageSpec) setSelectedUsage(usageSpec.split(',').map(s => s.trim()));

            if (productData.tags) {
                setTags(productData.tags);
            }

            if (productData.images) {
                setImages(productData.images.map((img: any) => ({ url: img.url, isPrimary: img.isPrimary })));
            }
        }
    }, [isEditMode, productData]);

    const showHardwareSpecs = useMemo(() => {
        if (mode === 'pro') return true;
        const cat = categoriesList.find((c: any) => c.id === formData.category);
        const hardwareSlugs = ['pos', 'printers', 'scanners', 'scales', 'drawers', 'pos-systems'];
        return hardwareSlugs.includes(cat?.slug) || cat?.slug?.includes('print') || cat?.slug?.includes('scan');
    }, [formData.category, categoriesList, mode]);

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

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleAIGenerate = async () => {
        if (!formData.name) {
            toast.error('يرجى كتابة اسم المنتج أولاً');
            return;
        }
        setIsGeneratingAI(true);
        try {
            // Mock AI generation for now as requested or call real endpoint
            // The prompt asks to wire to POST /api/products/ai-generate
            // We will do that.
            // For now, let's assume we can call api.post directly.
            // We need to import api first. It is used in hooks but not imported here.
            // Wait, useProduct uses 'api' from hooks/useProducts? No, it imports from ../lib/api
            // I need to import api in this file.

            // Temporary mock to avoid import issues if I can't check imports easily right now? 
            // No, I should import api.
            // But let's check top of file. It imports hooks. I will add api import.

            // Actual Logic:
            const { data } = await import('../../lib/api').then(m => m.default.post('/products/ai-generate', { name: formData.name }));

            setFormData(prev => ({
                ...prev,
                description: data.description || prev.description,
                metaTitle: data.metaTitle || prev.metaTitle,
                metaDescription: data.metaDescription || prev.metaDescription,
            }));
            toast.success('تم توليد المحتوى بنجاح');
        } catch (error) {
            console.error('AI Generate error:', error);
            toast.error('فشل توليد المحتوى');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async () => {
        // Merge manual specs with helper states (Connectivity/Usage)
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
            price: formData.price ? String(formData.price) : '0', // Ensure price is never empty string
            discountPrice: formData.discountPrice || null,
            cost: formData.cost || null,
            specifications: finalSpecs,
            tags: tags,
            images: images,
            categoryId: formData.category || null,
            brandId: formData.brand || null,
            // Clean up UI-only names
            videoUrl: formData.videoUrl || null,
            videoTitle: formData.videoTitle || null,
            videoDescription: formData.videoDescription || null,
            metaTitle: formData.metaTitle || null,
            metaDescription: formData.metaDescription || null,
            sku: formData.sku || null,
        };

        // Exclude internal formData keys that don't exist in DB
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

    return (
        <div className="flex flex-col h-full bg-background-dark overflow-hidden">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Link to="/admin/products" className="size-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                        <div>
                            <h2 className="text-white text-lg font-bold tracking-tight">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                            <p className="text-slate-500 text-xs text-right">إدارة المنتجات / {isEditMode ? 'تعديل' : 'إضافة'}</p>
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
                    <button
                        onClick={handleSubmit}
                        disabled={createProductMutation.isPending || updateProductMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[20px]">save</span>
                        )}
                        <span>{isEditMode ? 'تحديث' : 'حفظ'}</span>
                    </button>
                    <div className="flex items-center gap-3 pr-2">
                        {/* User Avatar */}
                        <div className="size-9 rounded-full bg-slate-700 bg-cover bg-center border border-white/10 ring-2 ring-transparent hover:ring-primary/50 transition-all cursor-pointer" style={{ backgroundImage: `url('https://i.pravatar.cc/150?u=admin')` }}></div>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
                <form className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8" onSubmit={(e) => e.preventDefault()}>

                    {/* Main Content (Left Column) */}
                    <div className="xl:col-span-2 flex flex-col gap-6">

                        {/* AI Input */}
                        {!isEditMode && (
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
                        )}

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
                                        <button
                                            onClick={handleAIGenerate}
                                            disabled={isGeneratingAI}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-md text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                                            title="تحسين العنوان باستخدام AI"
                                            type="button"
                                        >
                                            <span className={`material-symbols-outlined text-[18px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                {isGeneratingAI ? 'autorenew' : 'auto_awesome'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between">
                                        <span>وصف المنتج</span>
                                        <span onClick={handleAIGenerate} className="text-xs text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">
                                            <span className={`material-symbols-outlined text-[14px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                {isGeneratingAI ? 'autorenew' : 'auto_fix_normal'}
                                            </span>
                                            {isGeneratingAI ? 'جاري التوليد...' : 'كتابة الوصف تلقائياً'}
                                        </span>
                                    </label>
                                    <div className="rounded-lg bg-white/5 overflow-hidden border border-white/10 focus-within:border-primary/50 transition-colors">
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
                                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded transition-colors border border-white/5"
                                        type="button"
                                    >
                                        استيراد من رابط
                                    </button>
                                    <button
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="text-xs font-bold bg-primary/20 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1"
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

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            {!img.isPrimary && (
                                                <button
                                                    onClick={() => {
                                                        const newImages = images.map((image, idx) => ({ ...image, isPrimary: i === idx }));
                                                        setImages(newImages);
                                                    }}
                                                    className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                                    title="Set as Main"
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">star</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const newImages = images.filter((_, idx) => idx !== i);
                                                    // If we deleted the primary image, make the first one primary
                                                    if (img.isPrimary && newImages.length > 0) {
                                                        newImages[0].isPrimary = true;
                                                    }
                                                    setImages(newImages);
                                                }}
                                                className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                                title="Delete"
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

                                {/* Add Placeholder if empty */}
                                {images.length === 0 && (
                                    <div
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all"
                                    >
                                        <span className="material-symbols-outlined text-slate-500 text-4xl">add_a_photo</span>
                                        <span className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">إضافة صورة</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Settings */}
                        <div className="glass-panel rounded-xl p-6 border-t-2 border-t-indigo-500/20">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-indigo-400">play_circle</span>
                                إعدادات فيديو شرح الاستخدام
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">رابط فيديو YouTube</label>
                                    <input
                                        type="text"
                                        name="videoUrl"
                                        value={formData.videoUrl}
                                        onChange={handleInputChange}
                                        className="w-full h-11 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                        placeholder="مثال: https://www.youtube.com/watch?v=..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">عنوان بطاقة الفيديو (الظاهر فوق الفيديو)</label>
                                    <input
                                        type="text"
                                        name="videoTitle"
                                        value={formData.videoTitle}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                        placeholder="مثال: شرح الاستخدام"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">نص الوصف (الظاهر تحت الفيديو)</label>
                                    <input
                                        type="text"
                                        name="videoDescription"
                                        value={formData.videoDescription}
                                        onChange={handleInputChange}
                                        className="w-full h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                                        placeholder="مثال: تعرف على كيفية إعداد الجهاز..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Specs & SEO (Split Row) - Pro Mode Only */}
                        {mode === 'pro' && (
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
                        )}
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="xl:col-span-1 flex flex-col gap-6">

                        {/* Publishing */}
                        <div className="glass-panel rounded-xl p-6 relative focus-within:z-40">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">النشر والظهور</h3>
                                <span className={`material-symbols-outlined text-[20px] ${formData.status === 'active' ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {formData.status === 'active' ? 'check_circle' : 'visibility_off'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
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
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="glass-panel rounded-xl p-6 relative focus-within:z-40">
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
                                    {mode === 'pro' && (
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
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="glass-panel rounded-xl p-6 relative focus-within:z-40">
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
                            </div>
                        </div>

                        {/* Hardware Quick Specs (Conditional) */}
                        {showHardwareSpecs && (
                            <div className="glass-panel rounded-xl p-6 relative focus-within:z-40 border-t-2 border-t-blue-500/20">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400 text-[18px]">settings_input_component</span>
                                    خصائص الهاردوير
                                </h3>
                                <div className="space-y-6">
                                    {/* Connectivity */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-3">خيارات الاتصال (Connectivity)</label>
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
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${selectedConnectivity.includes(conn)
                                                        ? 'bg-primary/20 border-primary text-primary'
                                                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                                                        }`}
                                                >
                                                    {conn}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Usage */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-3">نمط الاستخدام (Usage)</label>
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
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${selectedUsage.includes(usage)
                                                        ? 'bg-primary/20 border-primary text-primary'
                                                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
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

                        {/* Category */}
                        <div className="glass-panel rounded-xl p-6 relative focus-within:z-40">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-400 text-[18px]">category</span>
                                التصنيف
                            </h3>
                            <div className="space-y-4">
                                <div>
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
            </div >
        </div >
    );
}

export default AddProduct;
