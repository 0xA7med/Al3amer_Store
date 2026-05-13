import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCategories, useBrands } from '../../hooks/useProducts';
import { useCreateProduct, useUpdateProduct, useAdminProducts } from '../../hooks/useAdmin';
import { useCategories as useCategoriesHook } from '../../hooks/useCategories';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { BrandSelect } from '../../components/admin/BrandSelect';
import { CategoryModal } from './CategoriesManagement';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';
import api from '../../lib/api';


// =========================================================
// Stable ID counter for specs rows (avoids index-as-key bug)
// =========================================================
let _specIdCounter = 0;
function nextSpecId() {
    return ++_specIdCounter;
}

function makeSpec(key = '', value = ''): { _id: number; key: string; value: string } {
    return { _id: nextSpecId(), key, value };
}

// =========================================================
// Category hierarchy helper (defined OUTSIDE component)
// =========================================================
interface CategoryOption {
    value: string;
    label: string;
}

function buildCategoryOptions(list: any[]): CategoryOption[] {
    const opts: CategoryOption[] = [];
    const parents = list.filter((c: any) => !c.parentId && !c.parent_id);
    const children = list.filter((c: any) => c.parentId || c.parent_id);

    for (const p of parents) {
        opts.push({ value: p.id, label: p.name });
        const kids = children.filter((c: any) => (c.parentId || c.parent_id) === p.id);
        for (const k of kids) {
            opts.push({ value: k.id, label: `${p.name} ← ${k.name}` });
        }
    }
    // Orphaned children (parent not in list) — just show then flat
    const covered = new Set(opts.map(o => o.value));
    for (const c of children) {
        if (!covered.has(c.id)) opts.push({ value: c.id, label: c.name });
    }
    return opts;
}


// =========================================================
// Main Component
// =========================================================
export function AddProduct() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;
    const navigate = useNavigate();

    // Drag state (ref — no re-render needed)
    const dragIndexRef = useRef<number | null>(null);

    // Queries & Mutations
    const { data: productData, isLoading: isLoadingProduct } = useProduct(id || '');
    const { data: categoriesData } = useCategories();
    const { data: brandsData } = useBrands();
    const categoriesList: any[] = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || [];
    const brandsList: any[] = Array.isArray(brandsData) ? brandsData : (brandsData as any)?.data || [];
    const createProductMutation = useCreateProduct();
    const updateProductMutation = useUpdateProduct();
    const { createCategory, isCreating: isCreatingCategory } = useCategoriesHook();
    const { data: allProductsData } = useAdminProducts({ limit: 1000 });
    const allProducts = allProductsData?.data || [];

    const getProductNameById = (pid: string) => {
        return allProducts.find(p => p.id === pid)?.name || pid;
    };

    // ---- Form State ----
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        cost: '',
        sku: '',
        external_id: '',
        stock: '',
        barcode: '',
        category: '',
        brand: '',
        status: 'active',
        metaTitle: '',
        metaDescription: '',
        slug: '',
        llmDescription: '',
    });

    const [specs, setSpecs] = useState<{ _id: number; key: string; value: string }[]>([
        makeSpec('المعالج'),
        makeSpec('الذاكرة'),
    ]);
    const [faqs, setFaqs] = useState<{ _id: number; question: string; answer: string }[]>([]);
    const [videos, setVideos] = useState<{ url: string; title: string; is_featured: boolean }[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([]);
    const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
    const [selectedUsage, setSelectedUsage] = useState<string[]>([]);
    const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, string | string[]>>({});
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [generatingSection, setGeneratingSection] = useState<'all' | 'title' | 'description' | 'specs' | 'seo' | 'llm' | 'faq' | 'geo' | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
    const [accessoryProductIds, setAccessoryProductIds] = useState<string[]>([]);
    const [alternativeProductIds, setAlternativeProductIds] = useState<string[]>([]);
    const [isSuggestingRelated, setIsSuggestingRelated] = useState(false);

    // ---- Populate form in edit mode ----
    useEffect(() => {
        if (isEditMode && productData) {
            setFormData({
                name: productData.name || '',
                description: productData.description || '',
                price: productData.price || '',
                discountPrice: productData.discountPrice || '',
                cost: productData.cost || '',
                sku: productData.sku || '',
                external_id: (productData as any).externalId || productData.external_id || '',   // Pro_ID
                stock: String(productData.stock || 0),
                barcode: productData.barcode || '',
                category: productData.categoryId || productData.category?.id || '',
                brand: productData.brand?.name || '', // Use name for the text field
                status: productData.status === 'archived' ? 'draft' : (productData.status || 'active'),
                metaTitle: productData.metaTitle || '',
                metaDescription: productData.metaDescription || '',
                slug: productData.slug || '',
                llmDescription: productData.llmDescription || '',
            });

            if (productData.videos) {
                setVideos(productData.videos as any);
            }

            // Flatten specifications
            const flattenSpecs = (s: any): { _id: number; key: string; value: string }[] => {
                if (!s) return [];
                if (!Array.isArray(s) && typeof s === 'object') {
                    return Object.entries(s).map(([k, v]) => makeSpec(k, typeof v === 'string' ? v : JSON.stringify(v)));
                }
                if (!Array.isArray(s)) return [];
                return s.map(item => {
                    if (typeof item === 'string') return makeSpec('المواصفة', item);
                    let key = String(item.key || '');
                    let value = item.value;
                    while (value && typeof value === 'object' && 'value' in value) value = value.value;
                    return makeSpec(key, String(value || ''));
                });
            };

            const finalSpecs = flattenSpecs(productData.specifications);
            setSpecs(finalSpecs.length > 0 ? finalSpecs : [makeSpec('المعالج'), makeSpec('الذاكرة')]);

            const connSpec = finalSpecs.find(s => s.key === 'connectivity' || s.key === 'اتصال')?.value;
            if (connSpec) setSelectedConnectivity(connSpec.split(',').map(s => s.trim()));

            const usageSpec = finalSpecs.find(s => s.key === 'usage' || s.key === 'الاستخدام')?.value;
            if (usageSpec) setSelectedUsage(usageSpec.split(',').map(s => s.trim()));

            if (productData.dynamicAttributes) {
                setDynamicAttributes(productData.dynamicAttributes);
            }

            if (productData.tags) setTags(productData.tags);
            if (productData.images) {
                setImages(productData.images.map((img: any) => ({ url: img.url, isPrimary: img.isPrimary })));
            }
            if (productData.faq && Array.isArray(productData.faq)) {
                setFaqs(productData.faq.map((f: any) => ({ _id: nextSpecId(), question: f.question || '', answer: f.answer || '' })));
            }

            // Hydrate Relationships
            if ((productData as any).relationships && Array.isArray((productData as any).relationships)) {
                const rels = (productData as any).relationships;
                setRelatedProductIds(rels.filter((r: any) => r.type === 'related').map((r: any) => r.relatedProductId));
                setAccessoryProductIds(rels.filter((r: any) => r.type === 'accessory').map((r: any) => r.relatedProductId));
                setAlternativeProductIds(rels.filter((r: any) => r.type === 'alternative').map((r: any) => r.relatedProductId));
            }
        }
    }, [isEditMode, productData]);

    // ---- Derived ----
    const categoryOptions = useMemo(() => buildCategoryOptions(categoriesList), [categoriesList]);

    const selectedCategoryData = useMemo(() => {
        if (!formData.category) return null;
        return categoriesList.find((c: any) => c.id === formData.category) || null;
    }, [formData.category, categoriesList]);

    const dynamicAttributesSchema = selectedCategoryData?.attributesSchema || [];

    const aiScore = useMemo(() => {
        let score = 0;
        if (formData.name) score += 5;
        if (formData.description && formData.description.length > 50) score += 10;
        if (specs.length >= 3) score += 10;
        if (images.length > 0) score += 10;
        if (formData.metaTitle && formData.metaDescription) score += 10;
        if (formData.llmDescription && formData.llmDescription.length > 50) score += 15;
        if (faqs.length >= 2) score += 15;
        if (relatedProductIds.length > 0 || accessoryProductIds.length > 0 || alternativeProductIds.length > 0) score += 15;
        if (videos.some(v => v.url)) score += 10;
        return score > 100 ? 100 : score;
    }, [formData, specs, images, faqs, relatedProductIds, accessoryProductIds, alternativeProductIds, videos]);

    // ---- Handlers ----
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'name' && !isEditMode) {
                next.slug = value
                    .toLowerCase().trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\u0621-\u064A-]+/g, '')
                    .replace(/--+/g, '-')
                    .replace(/^-+/, '').replace(/-+$/, '');
            }
            return next;
        });
    };

    const addSpec = () => setSpecs(prev => [...prev, makeSpec()]);
    const removeSpec = (id: number) => setSpecs(prev => prev.filter(s => s._id !== id));
    const updateSpec = (id: number, field: 'key' | 'value', value: string) => {
        setSpecs(prev => prev.map(s => s._id === id ? { ...s, [field]: value } : s));
    };

    const addFaq = () => setFaqs(prev => [...prev, { _id: nextSpecId(), question: '', answer: '' }]);
    const removeFaq = (id: number) => setFaqs(prev => prev.filter(f => f._id !== id));
    const updateFaq = (id: number, field: 'question' | 'answer', value: string) => {
        setFaqs(prev => prev.map(f => f._id === id ? { ...f, [field]: value } : f));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) setTags(prev => [...prev, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

    // ---- Videos ----
    const addVideo = () => setVideos(prev => [...prev, { url: '', title: '', is_featured: prev.length === 0 }]);
    const removeVideo = (idx: number) => setVideos(prev => {
        const next = prev.filter((_, i) => i !== idx);
        if (next.length > 0 && !next.some(v => v.is_featured)) next[0].is_featured = true;
        return next;
    });
    const updateVideo = (idx: number, field: 'url' | 'title', value: string) => {
        setVideos(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
    };
    const setFeaturedVideo = (idx: number) => {
        setVideos(prev => prev.map((v, i) => ({ ...v, is_featured: i === idx })));
    };

    // ---- Image Drag & Drop ----
    const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDrop = (idx: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === idx) return;
        setImages(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(idx, 0, moved);
            dragIndexRef.current = null;
            // Always make the first image primary in UI
            return next.map((img, i) => ({ ...img, isPrimary: i === 0 }));
        });
    };

    // ---- AI Generate ----
    const handleAIGenerate = async (section: 'all' | 'title' | 'description' | 'specs' | 'seo' | 'llm' | 'faq' | 'geo' = 'all') => {
        if (!formData.name) { toast.error('يرجى كتابة اسم المنتج أولاً'); return; }
        setGeneratingSection(section);
        setIsGeneratingAI(true);
        try {
            const api = (await import('../../lib/api')).default;
            
            // Resolve Category Name
            const categoryName = categoriesList.find(c => c.id === formData.category)?.name;
            
            // Map 'geo' to 'all' for the backend but with a flag to only update GEO fields if needed
            // Or just handle multiple requests if the backend doesn't support a 'geo' section
            const targetSection = section === 'geo' ? 'all' : section;

            const { data } = await api.post('/products/ai-generate', { 
                name: formData.name, 
                section: targetSection,
                category: categoryName,
                brand: formData.brand 
            });

            // Update fields based on what was returned
            setFormData(prev => {
                const next = { ...prev };
                
                // Content fields
                if (section === 'all' || section === 'title') next.name = data.title || next.name;
                if (section === 'all' || section === 'description') next.description = data.description || next.description;
                if (section === 'all' || section === 'description') next.slug = data.slug || next.slug;
                
                // SEO fields
                if (section === 'all' || section === 'seo' || section === 'geo') {
                    next.metaTitle = data.metaTitle || next.metaTitle;
                    next.metaDescription = data.metaDescription || next.metaDescription;
                }
                
                // GEO fields
                if (section === 'all' || section === 'llm' || section === 'geo') {
                    next.llmDescription = data.llmDescription || next.llmDescription;
                }
                
                return next;
            });

            // Specs: only if 'all' or 'specs' or 'geo'
            if (section === 'all' || section === 'specs' || section === 'geo') {
                const newSpecs = (data.specs || data.specifications || []) as { key: string; value: string }[];
                if (newSpecs.length > 0) {
                    setSpecs(newSpecs.map(s => makeSpec(s.key, s.value)));
                }
            }

            // Tags: only if 'all' or 'seo' or 'geo'
            if (section === 'all' || section === 'seo' || section === 'geo') {
                const aiTags = data.tags || data.seoKeywords || [];
                if (Array.isArray(aiTags) && aiTags.length > 0) {
                    setTags(prev => Array.from(new Set([...prev, ...aiTags])));
                }
            }

            // FAQ: only if 'all' or 'faq' or 'geo'
            if (section === 'all' || section === 'faq' || section === 'geo') {
                if (data.faq && Array.isArray(data.faq) && data.faq.length > 0) {
                    setFaqs(data.faq.map((f: any) => ({ _id: nextSpecId(), question: f.question, answer: f.answer })));
                }
            }

            // Smart Relationships: only if ('geo' OR 'all')
            if (section === 'geo' || section === 'all') {
                if (formData.name) {
                    try {
                        setIsSuggestingRelated(true);
                        const { data: relations } = await api.post(`/products/${id || 'new'}/suggest-related`, {
                            name: formData.name,
                            categoryId: formData.category,
                            brandId: formData.brand
                        });
                        if (relations) {
                            if (relations.related) setRelatedProductIds(relations.related);
                            if (relations.accessories) setAccessoryProductIds(relations.accessories);
                            if (relations.alternatives) setAlternativeProductIds(relations.alternatives);
                            toast.success('🔗 تم تحديث الروابط الذكية تلقائياً');
                        }
                    } catch (e) {
                        console.error('Failed to suggest related products:', e);
                    } finally {
                        setIsSuggestingRelated(false);
                    }
                }
            }

            toast.success('✨ تم إنشاء المحتوى الذكي بنجاح');
        } catch (error: any) {
            console.error('AI Generate error:', error);
            const msg = error.response?.data?.error || 'فشل إنشاء المحتوى. يرجى المحاولة مرة أخرى.';
            toast.error(msg);
        } finally {
            setIsGeneratingAI(false);
            setGeneratingSection(null);
        }
    };

    // ---- Submit ----
    const handleSubmit = async () => {
        const finalSpecs = specs
            .filter(s => s.key && s.value && s.key !== 'connectivity' && s.key !== 'اتصال' && s.key !== 'usage' && s.key !== 'الاستخدام')
            .map(({ key, value }) => ({ key, value }));

        if (selectedConnectivity.length > 0) finalSpecs.push({ key: 'connectivity', value: selectedConnectivity.join(', ') });
        if (selectedUsage.length > 0) finalSpecs.push({ key: 'usage', value: selectedUsage.join(', ') });

        const payload = {
            ...formData,
            // status is sent as-is: 'active' | 'draft'
            stock: Number(formData.stock) || 0,
            price: formData.price ? String(formData.price) : '0',
            discountPrice: formData.discountPrice || null,
            cost: formData.cost || null,
            specifications: finalSpecs,
            dynamicAttributes,
            tags,
            images,
            categoryId: formData.category || null,
            brand: formData.brand || null, // Send name as 'brand' for auto-resolution
            videos: videos.filter(v => v.url.trim()), // Filter empty URLs
            metaTitle: formData.metaTitle || null,
            metaDescription: formData.metaDescription || null,
            sku: formData.sku || null,
            external_id: formData.external_id || null,
            slug: formData.slug || null,
            llmDescription: formData.llmDescription || null,
            faq: faqs.filter(f => f.question && f.answer).map(({ question, answer }) => ({ question, answer })),
            relationships: [
                ...relatedProductIds.map(rid => ({ relatedProductId: rid, type: 'related' })),
                ...accessoryProductIds.map(rid => ({ relatedProductId: rid, type: 'accessory' })),
                ...alternativeProductIds.map(rid => ({ relatedProductId: rid, type: 'alternative' })),
            ],
        };

        const { category, ...finalPayload } = payload;

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

    // ---- Category Created Handler ----
    const handleCategorySaved = (newCategoryId: string) => {
        setShowCategoryModal(false);
        if (newCategoryId) {
            setFormData(prev => ({ ...prev, category: newCategoryId }));
        }
    };

    // ---- Handle Suggest Related Products (AI) ----
    const handleSuggestRelated = async () => {
        if (!formData.name) { toast.error('يرجى إدخال اسم المنتج أولاً'); return; }
        setIsSuggestingRelated(true);
        try {
            const { data } = await api.post(`/products/${id || 'new'}/suggest-related`, {
                name: formData.name,
                categoryId: formData.category,
                brandId: formData.brand
            });
            if (data) {
                if (data.related) setRelatedProductIds(data.related);
                if (data.accessories) setAccessoryProductIds(data.accessories);
                if (data.alternatives) setAlternativeProductIds(data.alternatives);
                toast.success('🔗 تم العثور على روابط ذكية مقترحة');
            }
        } catch (e: any) {
            console.error('Failed to suggest related products:', e);
            toast.error('فشل الحصول على مقترحات الروابط');
        } finally {
            setIsSuggestingRelated(false);
        }
    };

    // ---- Loading state ----
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

    // =========================================================
    // RENDER — Shopify-style 2-column layout
    // Main Column (right in RTL): Basic Info, Media, Specs
    // Side Column (left in RTL): Status, Organization, Pricing, Inventory, SEO
    // =========================================================
    return (
        <div className="flex flex-col h-full bg-background-dark min-h-screen">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-xl border-b border-white/5 shadow-md">
                <div className="h-16 flex items-center justify-between px-6 container mx-auto max-w-7xl">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/products" className="size-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                            <span className="material-symbols-outlined flip-x">arrow_back</span>
                        </Link>
                        <div>
                            <h2 className="text-white text-lg font-bold">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                            <p className="text-slate-500 text-xs hidden sm:block">إدارة المخزون والمنتجات</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleAIGenerate('all')}
                            disabled={isGeneratingAI}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="توليد كافة التفاصيل بالذكاء الاصطناعي"
                            type="button"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                {isGeneratingAI ? 'autorenew' : 'auto_awesome'}
                            </span>
                            <span className="hidden sm:inline">أكمل بالذكاء الاصطناعي</span>
                        </button>
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={createProductMutation.isPending || updateProductMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-primary/40 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                                <div className="size-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">save</span>
                            )}
                            <span>{isEditMode ? 'حفظ التعديلات' : 'نشر المنتج'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="container mx-auto max-w-7xl flex flex-col gap-6 pb-20">

                    {/* ===== AI Quick Input (new products only) ===== */}
                    {!isEditMode && (
                        <div className="glass-card p-1 relative overflow-hidden">
                            <div className="absolute inset-[-1px] rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-primary opacity-50 pointer-events-none"></div>
                            <div className="bg-[#161b26]/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 relative z-10">
                                <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                </div>
                                <div className="flex-1">
                                    <input
                                        className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0"
                                        placeholder="الصق رابط منتج أو اكتب اسمه هنا لإنشاء التفاصيل تلقائياً..."
                                        type="text"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setFormData(prev => ({ ...prev, name: e.currentTarget.value }));
                                                setTimeout(handleAIGenerate, 100);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAIGenerate('all')}
                                    disabled={isGeneratingAI}
                                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    type="button"
                                >
                                    {isGeneratingAI ? (
                                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                    )}
                                    توليد بالذكاء الاصطناعي
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== 2-COLUMN LAYOUT ===== */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                        {/* ========== MAIN COLUMN (Right in RTL) ========== */}
                        <div className="xl:col-span-8 flex flex-col gap-6">
                            {/* ── Basic Info ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-emerald-400">edit_note</span>
                                    <h3>بيانات المنتج الأساسية</h3>
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
                                                className="input-field h-12 text-base font-bold"
                                                placeholder="مثال: جهاز كاشير لمس 15 بوصة Sunmi T2"
                                            />
                                            <button
                                                onClick={() => handleAIGenerate('title')}
                                                disabled={isGeneratingAI}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                                                title="تحسين باستخدام AI"
                                                type="button"
                                            >
                                                <span className={`material-symbols-outlined text-[20px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                    {isGeneratingAI ? 'autorenew' : 'auto_awesome'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="field-label mb-0">وصف المنتج</label>
                                            <button
                                                onClick={() => handleAIGenerate('description')}
                                                disabled={isGeneratingAI}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                                                type="button"
                                            >
                                                <span className={`material-symbols-outlined text-[14px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                    {isGeneratingAI ? 'autorenew' : 'auto_fix_normal'}
                                                </span>
                                                {isGeneratingAI ? 'جاري التحسين...' : 'تحسين الوصف'}
                                            </button>
                                        </div>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="input-field h-64 resize-none leading-relaxed text-sm"
                                            placeholder="اكتب وصفاً تفصيلياً ومميزاً للمنتج..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Media Gallery ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-blue-400">perm_media</span>
                                    <h3>صور وفيديوهات المنتج</h3>
                                    <p className="text-[11px] text-slate-500 mr-auto">اسحب الصور لترتيبها</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                const url = window.prompt('أدخل رابط الصورة:');
                                                if (url) setImages(prev => [...prev, { url, isPrimary: prev.length === 0 }]);
                                            }}
                                            className="btn-secondary text-xs"
                                            type="button"
                                        >
                                            رابط خارجي
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            id="image-upload"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    const files = Array.from(e.target.files);
                                                    for (const file of files) {
                                                        try {
                                                            const compressedBase64 = await compressImage(file);
                                                            setImages(prev => [...prev, { url: compressedBase64, isPrimary: prev.length === 0 }]);
                                                        } catch (error) {
                                                            console.error('Error compressing image:', error);
                                                            // Fallback to raw if compression fails
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                setImages(prev => [...prev, { url: reader.result as string, isPrimary: prev.length === 0 }]);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            className="btn-primary text-xs flex items-center gap-1.5"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">upload</span> رفع صور
                                        </button>
                                    </div>
                                </div>

                                {/* Images Grid with DnD */}
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                                    {images.map((img, i) => (
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={() => handleDragStart(i)}
                                            onDragOver={handleDragOver}
                                            onDrop={() => handleDrop(i)}
                                            className={`aspect-square rounded-xl border-2 bg-white/5 relative group/img overflow-hidden transition-all cursor-grab active:cursor-grabbing ${img.isPrimary ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}
                                        >
                                            <img
                                                src={img.url}
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }}
                                                className="w-full h-full object-cover pointer-events-none"
                                                alt=""
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {!img.isPrimary && (
                                                    <button
                                                        onClick={() => setImages(prev => {
                                                            const next = [...prev];
                                                            const [target] = next.splice(i, 1);
                                                            next.unshift(target);
                                                            return next.map((im, idx) => ({ ...im, isPrimary: idx === 0 }));
                                                        })}
                                                        className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                                                        title="نقل للبداية (تعيين كأساسية)"
                                                        type="button"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">first_page</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setImages(prev => {
                                                            const next = prev.filter((_, idx) => idx !== i);
                                                            return next.map((im, idx) => ({ ...im, isPrimary: idx === 0 }));
                                                        });
                                                    }}
                                                    className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                                    title="حذف"
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                            {img.isPrimary && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-lg">
                                                    أساسية
                                                </div>
                                            )}
                                            {/* Drag handle hint */}
                                            <div className="absolute bottom-1 left-1 text-white/30 group-hover/img:text-white/60 transition-colors">
                                                <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(images.length)}
                                        className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/10"
                                    >
                                        <span className="material-symbols-outlined text-slate-500 text-3xl mb-1">add_a_photo</span>
                                        <span className="text-[10px] text-slate-500 font-medium">إضافة</span>
                                    </div>
                                </div>

                                {/* Videos List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="field-label mb-0">روابط الفيديو (يوتيوب أو فيسبوك)</label>
                                        <button onClick={addVideo} type="button" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            إضافة فيديو
                                        </button>
                                    </div>
                                    {videos.map((video, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl relative">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <input
                                                        type="text"
                                                        value={video.url}
                                                        onChange={(e) => updateVideo(idx, 'url', e.target.value)}
                                                        className="input-field"
                                                        placeholder="رابط الفيديو (https://youtube.com/... أو facebook.com/...)"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={video.title}
                                                        onChange={(e) => updateVideo(idx, 'title', e.target.value)}
                                                        className="input-field"
                                                        placeholder="عنوان توضيحي (اختياري) - مثلاً: شرح الاستخدام"
                                                    />
                                                </div>
                                                <button onClick={() => removeVideo(idx)} type="button" className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors mt-1">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer mt-1 pl-2">
                                                <input
                                                    type="radio"
                                                    name="featured_video"
                                                    checked={video.is_featured}
                                                    onChange={() => setFeaturedVideo(idx)}
                                                    className="w-4 h-4 text-primary focus:ring-primary border-slate-600 bg-slate-800"
                                                />
                                                <span className="text-sm text-slate-300">تعيين كفيديو أساسي (شرح الاستخدام)</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Specifications ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-purple-400">memory</span>
                                    <h3>المواصفات الفنية</h3>
                                    
                                    <div className="mr-auto flex items-center gap-2">
                                        <button
                                            onClick={() => handleAIGenerate('specs')}
                                            disabled={isGeneratingAI}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20"
                                            type="button"
                                        >
                                            <span className={`material-symbols-outlined text-[14px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                                {isGeneratingAI ? 'autorenew' : 'auto_fix_normal'}
                                            </span>
                                            {isGeneratingAI ? 'جاري...' : 'توليد بالذكاء الاصطناعي'}
                                        </button>
                                        <button onClick={addSpec} className="btn-ghost text-xs" type="button">
                                            <span className="material-symbols-outlined text-[16px]">add</span> إضافة مواصفة
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {/* Column headers */}
                                    {specs.length > 0 && (
                                        <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                                            <div className="col-span-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">الخاصية</div>
                                            <div className="col-span-7 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">القيمة</div>
                                        </div>
                                    )}
                                    {specs.map((spec) => (
                                        // Key is stable _id — NOT index — so React doesn't remount on removal
                                        <div key={spec._id} className="grid grid-cols-12 gap-2 items-center group">
                                            <input
                                                className="col-span-4 input-field h-10 text-sm"
                                                type="text"
                                                value={spec.key}
                                                onChange={(e) => updateSpec(spec._id, 'key', e.target.value)}
                                                placeholder="الخاصية، مثلاً: الرام"
                                            />
                                            <input
                                                className="col-span-7 input-field h-10 text-sm"
                                                type="text"
                                                value={spec.value}
                                                onChange={(e) => updateSpec(spec._id, 'value', e.target.value)}
                                                placeholder="القيمة، مثلاً: 4 جيجا"
                                            />
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => removeSpec(spec._id)}
                                                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    type="button"
                                                    title="حذف المواصفة"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {specs.length === 0 && (
                                    <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl">
                                        <p className="text-sm text-slate-500">لا توجد مواصفات مضافة حالياً</p>
                                        <button onClick={addSpec} className="text-indigo-400 text-xs mt-2 hover:underline" type="button">اضغط هنا لإضافة مواصفة يدوياً</button>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Category Attributes */}
                            {dynamicAttributesSchema.length > 0 && (
                                <div className="glass-card border-t-2 border-t-blue-500/30">
                                    <div className="card-header">
                                        <span className="material-symbols-outlined text-blue-400">tune</span>
                                        <h3>خصائص المنتج (حسب القسم)</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {dynamicAttributesSchema.map((schemaBlock: any, idx: number) => {
                                            const isMulti = schemaBlock.type === 'multi-select';
                                            const currentValue = dynamicAttributes[schemaBlock.name];
                                            const selectedArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);
                                            
                                            return (
                                                <div key={idx}>
                                                    <label className="field-label mb-3">{schemaBlock.name} ({isMulti ? 'متعدد' : 'اختيار واحد'})</label>
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                        {schemaBlock.options.map((opt: string) => {
                                                            const isSelected = selectedArray.includes(opt);
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDynamicAttributes(prev => {
                                                                            if (isMulti) {
                                                                                const newArr = isSelected ? selectedArray.filter(x => x !== opt) : [...selectedArray, opt];
                                                                                return { ...prev, [schemaBlock.name]: newArr };
                                                                            } else {
                                                                                return { ...prev, [schemaBlock.name]: isSelected ? '' : opt };
                                                                            }
                                                                        });
                                                                    }}
                                                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── GEO & AI Content ── */}
                            <div className="glass-card border-t-2 border-t-indigo-500/30">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                    <h3>المحتوى المُحسّن للذكاء الاصطناعي (GEO)</h3>
                                    <button
                                        onClick={() => handleAIGenerate('geo')}
                                        disabled={isGeneratingAI}
                                        className="mr-auto text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                                        type="button"
                                    >
                                        <span className={`material-symbols-outlined text-[14px] ${(generatingSection === 'geo' || generatingSection === 'all') ? 'animate-spin' : ''}`}>
                                            {(generatingSection === 'geo' || generatingSection === 'all') ? 'autorenew' : 'auto_awesome'}
                                        </span>
                                        {(generatingSection === 'geo' || generatingSection === 'all') ? 'جاري توليد الكل...' : 'توليد كامل محتوى الـ GEO'}
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="field-label mb-0">وصف تقني مخصص للـ LLM (ChatGPT, Gemini)</label>
                                            <button
                                                onClick={() => handleAIGenerate('llm')}
                                                disabled={isGeneratingAI}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                type="button"
                                            >
                                                <span className={`material-symbols-outlined text-[14px] ${(generatingSection === 'llm' || generatingSection === 'all') ? 'animate-spin' : ''}`}>
                                                    {(generatingSection === 'llm' || generatingSection === 'all') ? 'autorenew' : 'auto_fix_normal'}
                                                </span>
                                                {(generatingSection === 'llm' || generatingSection === 'all') ? 'جاري التوليد...' : 'توليد وصف LLM'}
                                            </button>
                                        </div>
                                        <textarea
                                            name="llmDescription"
                                            value={formData.llmDescription}
                                            onChange={handleInputChange}
                                            className="input-field h-32 resize-none leading-relaxed text-sm font-mono text-slate-300"
                                            placeholder="اكتب وصف تقني مهيكّل بدون جمل تسويقية. هذا الوصف سيقرأه الذكاء الاصطناعي..."
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="field-label mb-0">الأسئلة الشائعة (FAQ) - مهم للـ SEO والـ AI</label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleAIGenerate('faq')}
                                                    disabled={isGeneratingAI}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                    type="button"
                                                >
                                                    <span className={`material-symbols-outlined text-[14px] ${(generatingSection === 'faq' || generatingSection === 'all') ? 'animate-spin' : ''}`}>
                                                        {(generatingSection === 'faq' || generatingSection === 'all') ? 'autorenew' : 'auto_fix_normal'}
                                                    </span>
                                                    {(generatingSection === 'faq' || generatingSection === 'all') ? 'جاري التوليد...' : 'توليد FAQ بالذكاء الاصطناعي'}
                                                </button>
                                                <button onClick={addFaq} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1" type="button">
                                                    <span className="material-symbols-outlined text-[14px]">add</span> سؤال جديد
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {faqs.map((faq, index) => (
                                                <div key={faq._id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex gap-3 relative group">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            className="input-field h-9 text-sm font-bold text-indigo-200 bg-indigo-900/10 border-indigo-500/20"
                                                            type="text"
                                                            value={faq.question}
                                                            onChange={(e) => updateFaq(faq._id, 'question', e.target.value)}
                                                            placeholder={`سؤال ${index + 1}...`}
                                                        />
                                                        <textarea
                                                            className="input-field h-16 resize-none text-xs leading-relaxed"
                                                            value={faq.answer}
                                                            onChange={(e) => updateFaq(faq._id, 'answer', e.target.value)}
                                                            placeholder={`الإجابة الوافية...`}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeFaq(faq._id)}
                                                        className="mt-1 self-start p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
                                                        type="button"
                                                        title="حذف السؤال"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            ))}
                                            {faqs.length === 0 && (
                                                <div className="text-center py-4 border border-dashed border-white/10 rounded-xl">
                                                    <p className="text-xs text-slate-500">لا توجد أسئلة مضافة</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ========== SIDE COLUMN (Left in RTL) ========== */}
                        <div className="xl:col-span-4 flex flex-col gap-6">
                            {/* ── Status ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className={`material-symbols-outlined ${formData.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {formData.status === 'active' ? 'check_circle' : 'visibility_off'}
                                    </span>
                                    <h3>حالة المنتج</h3>
                                </div>
                                <CustomSelect
                                    label=""
                                    value={formData.status}
                                    onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                    options={[
                                        { value: 'active', label: 'نشط (ظاهر في المتجر)' },
                                        { value: 'draft', label: 'غير نشط (مسودة)' },
                                    ]}
                                    placeholder="اختر الحالة..."
                                />
                            </div>

                            {/* ── Organization (Category + Tags) ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-blue-400">category</span>
                                    <h3>التصنيف والتنظيم</h3>
                                </div>
                                <div className="space-y-4">
                                    {/* Category with inline add button */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                القسم (Category) <span className="text-secondary">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowCategoryModal(true)}
                                                className="text-[11px] text-primary hover:text-emerald-300 flex items-center gap-1 transition-colors font-semibold"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                                إضافة تصنيف جديد
                                            </button>
                                        </div>
                                        <CustomSelect
                                            value={formData.category}
                                            onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                                            options={categoryOptions}
                                            placeholder="اختر القسم..."
                                        />
                                    </div>

                                    {/* Brand Selection */}
                                    <BrandSelect
                                        label="العلامة التجارية (Brand)"
                                        value={formData.brand}
                                        onChange={(val) => setFormData(prev => ({ ...prev, brand: val }))}
                                        brands={brandsList}
                                        placeholder="مثال: Sunmi, HP, Canon..."
                                    />

                                    {/* Tags */}
                                    <div>
                                        <label className="field-label">الوسوم (Tags)</label>
                                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 min-h-[80px] flex flex-wrap content-start gap-1.5 focus-within:border-primary/50 transition-colors">
                                            {tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold flex items-center gap-1">
                                                    {tag}
                                                    <button onClick={() => removeTag(tag)} className="hover:text-white" type="button">×</button>
                                                </span>
                                            ))}
                                            <input
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleTagKeyDown}
                                                className="bg-transparent border-none text-white text-xs p-1 focus:ring-0 w-full placeholder-slate-600"
                                                placeholder="اكتب واضغط Enter..."
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Pricing ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-amber-400">payments</span>
                                    <h3>التسعير</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="field-label">سعر البيع <span className="text-secondary">*</span></label>
                                        <div className="relative">
                                            <input
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                className="input-field text-lg font-bold pr-12"
                                                placeholder="0.00"
                                                type="number"
                                            />
                                            <span className="absolute inset-y-0 right-4 flex items-center text-slate-500 font-bold text-xs">EGP</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="field-label">سعر الخصم</label>
                                            <input name="discountPrice" value={formData.discountPrice} onChange={handleInputChange} className="input-field" placeholder="0.00" type="number" />
                                        </div>
                                        <div>
                                            <label className="field-label">التكلفة</label>
                                            <input name="cost" value={formData.cost} onChange={handleInputChange} className="input-field" placeholder="0.00" type="number" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Inventory ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-amber-400">inventory_2</span>
                                    <h3>المخزون</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="field-label">الكمية المتوفرة</label>
                                        <input name="stock" value={formData.stock} onChange={handleInputChange} className="input-field font-bold" placeholder="0" type="number" />
                                    </div>
                                    <div>
                                        <label className="field-label">رقم التخزين (SKU)</label>
                                        <input name="sku" value={formData.sku} onChange={handleInputChange} className="input-field text-xs font-mono" placeholder="SKU-..." type="text" />
                                    </div>
                                    <div>
                                        <label className="field-label">معرف خارجي (Pro_ID)</label>
                                        <input
                                            name="external_id"
                                            value={formData.external_id}
                                            onChange={handleInputChange}
                                            className="input-field text-xs font-mono"
                                            placeholder="للمزامنة مع Excel"
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="field-label">الباركود</label>
                                        <input name="barcode" value={formData.barcode} onChange={handleInputChange} className="input-field text-xs font-mono" placeholder="6923912345..." type="text" />
                                    </div>
                                </div>
                            </div>

                            {/* ── SEO ── */}
                            <div className="glass-card">
                                <div className="card-header">
                                    <span className="material-symbols-outlined text-indigo-400">search</span>
                                    <h3>SEO</h3>
                                    <button
                                        onClick={() => handleAIGenerate('seo')}
                                        disabled={isGeneratingAI}
                                        className="mr-auto text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20"
                                        type="button"
                                    >
                                        <span className={`material-symbols-outlined text-[14px] ${isGeneratingAI ? 'animate-spin' : ''}`}>
                                            {isGeneratingAI ? 'autorenew' : 'auto_fix_normal'}
                                        </span>
                                        {isGeneratingAI ? 'جاري التحسين...' : 'تحسين بالذكاء الاصطناعي'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="field-label">رابط المنتج (Slug)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                className="input-field font-mono text-xs pl-8 truncate"
                                                placeholder="product-slug"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">/</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="field-label">عنوان الميتا</label>
                                        <input
                                            name="metaTitle"
                                            value={formData.metaTitle}
                                            onChange={handleInputChange}
                                            className="input-field text-xs"
                                            placeholder={formData.name || 'عنوان الصفحة'}
                                            type="text"
                                        />
                                    </div>
                                    <div>
                                        <label className="field-label">وصف الميتا</label>
                                        <textarea
                                            name="metaDescription"
                                            value={formData.metaDescription}
                                            onChange={handleInputChange}
                                            className="input-field h-20 resize-none text-xs"
                                            placeholder="وصف مختصر يظهر في جوجل..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── AI Readiness Score ── */}
                            <div className="glass-card bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">temp_preferences_custom</span>
                                        مؤشر جاهزية الـ AI (GEO Score)
                                    </h3>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-black ${aiScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : aiScore >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {aiScore >= 80 ? 'verified' : aiScore >= 50 ? 'warning' : 'error'}
                                        </span>
                                        {aiScore}%
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-1">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${aiScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : aiScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-600 to-red-500'}`}
                                        style={{ width: `${aiScore}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mb-3">
                                    <span>0%</span><span>50%</span><span>100%</span>
                                </div>

                                {/* Checklist */}
                                <div className="space-y-2">
                                    {[
                                        { label: 'اسم المنتج', weight: 10, done: !!formData.name },
                                        { label: 'وصف المنتج (50+ حرف)', weight: 15, done: formData.description.length > 50 },
                                        { label: 'صورة واحدة على الأقل', weight: 10, done: images.length > 0 },
                                        { label: 'مواصفات (3+)', weight: 10, done: specs.filter(s => s.key && s.value).length >= 3 },
                                        { label: 'بيانات ميتا SEO', weight: 15, done: !!(formData.metaTitle && formData.metaDescription) },
                                        { label: 'خلاصة LLM التقنية', weight: 20, done: !!(formData.llmDescription && formData.llmDescription.length > 50) },
                                        { label: 'أسئلة FAQ (2+)', weight: 20, done: faqs.filter(f => f.question && f.answer).length >= 2 },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`material-symbols-outlined text-[13px] flex-shrink-0 ${item.done ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                    {item.done ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                <span className={`text-[11px] ${item.done ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold ${item.done ? 'text-emerald-500' : 'text-slate-700'}`}>+{item.weight}%</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Related Products AI */}
                                <div className="mt-4 pt-4 border-t border-indigo-500/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">device_hub</span>
                                            الربط الذكي بالمنتجات
                                        </h4>
                                        <button
                                            onClick={handleSuggestRelated}
                                            disabled={isSuggestingRelated || !formData.name}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-[11px] font-bold text-indigo-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            title={!formData.name ? 'أدخل اسم المنتج أولاً لتفعيل هذه الميزة' : 'استخدام الذكاء الاصطناعي لاقتراح المنتجات ذات الصلة'}
                                        >
                                            {isSuggestingRelated ? (
                                                <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            )}
                                            {isSuggestingRelated ? 'جاري التحليل...' : 'اقتراح تلقائي'}
                                        </button>
                                    </div>
                                    <div className="space-y-4 mt-4">
                                        {/* Related Products */}
                                        <div className="bg-black/40 rounded-xl p-3 border border-indigo-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">link</span>
                                                    منتجات ذات صلة ({relatedProductIds.length})
                                                </p>
                                                {relatedProductIds.length > 0 && <button onClick={() => setRelatedProductIds([])} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">مسح الكل</button>}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {relatedProductIds.map(rid => (
                                                    <div key={rid} className="group flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full pl-2 pr-1 py-0.5 transition-all">
                                                        <span className="text-[10px] font-medium max-w-[120px] truncate">{getProductNameById(rid)}</span>
                                                        <button onClick={() => setRelatedProductIds(prev => prev.filter(i => i !== rid))} className="material-symbols-outlined text-[14px] text-slate-500 hover:text-red-400 transition-colors">cancel</button>
                                                    </div>
                                                ))}
                                            </div>

                                            <CustomSelect
                                                label=""
                                                value=""
                                                onChange={(val) => { if (val) setRelatedProductIds(prev => Array.from(new Set([...prev, val]))); }}
                                                options={allProducts.filter(p => p.id !== id && !relatedProductIds.includes(p.id)).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                                                placeholder="إضافة منتج ذو صلة..."
                                                searchable
                                            />
                                        </div>

                                        {/* Accessories */}
                                        <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">extension</span>
                                                    إكسسوارات وملحقات ({accessoryProductIds.length})
                                                </p>
                                                {accessoryProductIds.length > 0 && <button onClick={() => setAccessoryProductIds([])} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">مسح الكل</button>}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {accessoryProductIds.map(rid => (
                                                    <div key={rid} className="group flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-full pl-2 pr-1 py-0.5 transition-all">
                                                        <span className="text-[10px] font-medium max-w-[120px] truncate">{getProductNameById(rid)}</span>
                                                        <button onClick={() => setAccessoryProductIds(prev => prev.filter(i => i !== rid))} className="material-symbols-outlined text-[14px] text-slate-500 hover:text-red-400 transition-colors">cancel</button>
                                                    </div>
                                                ))}
                                            </div>

                                            <CustomSelect
                                                label=""
                                                value=""
                                                onChange={(val) => { if (val) setAccessoryProductIds(prev => Array.from(new Set([...prev, val]))); }}
                                                options={allProducts.filter(p => p.id !== id && !accessoryProductIds.includes(p.id)).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                                                placeholder="إضافة إكسسوار..."
                                                searchable
                                            />
                                        </div>

                                        {/* Alternatives */}
                                        <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                                                    بدائل مقترحة ({alternativeProductIds.length})
                                                </p>
                                                {alternativeProductIds.length > 0 && <button onClick={() => setAlternativeProductIds([])} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">مسح الكل</button>}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {alternativeProductIds.map(rid => (
                                                    <div key={rid} className="group flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-full pl-2 pr-1 py-0.5 transition-all">
                                                        <span className="text-[10px] font-medium max-w-[120px] truncate">{getProductNameById(rid)}</span>
                                                        <button onClick={() => setAlternativeProductIds(prev => prev.filter(i => i !== rid))} className="material-symbols-outlined text-[14px] text-slate-500 hover:text-red-400 transition-colors">cancel</button>
                                                    </div>
                                                ))}
                                            </div>

                                            <CustomSelect
                                                label=""
                                                value=""
                                                onChange={(val) => { if (val) setAlternativeProductIds(prev => Array.from(new Set([...prev, val]))); }}
                                                options={allProducts.filter(p => p.id !== id && !alternativeProductIds.includes(p.id)).map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
                                                placeholder="إضافة بديل..."
                                                searchable
                                            />
                                        </div>
                                    </div>
                                    {!formData.name && (
                                        <p className="text-[10px] text-slate-600 mt-2">أدخل اسم المنتج أولاً لتفعيل الربط الذكي.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <CategoryModal
                    category={{ isActive: true, isFeatured: false }}
                    onClose={() => setShowCategoryModal(false)}
                    onSave={async (data) => {
                        try {
                            const result: any = await createCategory(data);
                            toast.success('تم إنشاء التصنيف بنجاح!');
                            const newId = result?.id || result?.data?.id || '';
                            handleCategorySaved(newId);
                        } catch (error) {
                            console.error(error);
                        }
                    }}
                    isSaving={isCreatingCategory}
                />
            )}

            {/* Helper Styles */}
            <style>{`
                .glass-card {
                    background: #1e2532;
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 1rem;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                }
                .card-header h3 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: white;
                }
                .field-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: rgb(148 163 184);
                    margin-bottom: 0.5rem;
                }
                .input-field {
                    width: 100%;
                    padding: 0.6rem 0.8rem;
                    border-radius: 0.5rem;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: white;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    outline: none;
                    border-color: rgba(16, 185, 129, 0.5);
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
                    background: rgba(0,0,0,0.3);
                }
                .btn-secondary {
                    padding: 0.5rem 0.75rem;
                    background: rgba(255,255,255,0.05);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-secondary:hover { background: rgba(255,255,255,0.1); }
                .btn-primary {
                    padding: 0.5rem 1rem;
                    background: rgba(16, 185, 129, 0.1);
                    color: rgb(52, 211, 153);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-primary:hover { background: rgba(16, 185, 129, 0.2); }
                .btn-ghost {
                    padding: 0.4rem 0.75rem;
                    background: transparent;
                    color: rgb(148 163 184);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 0.5rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
                .flip-x { transform: scaleX(-1); }
            `}</style>
        </div >
    );
}

export default AddProduct;
