import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Download, 
  Upload, 
  Filter,
  Package,
  Tag,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatCurrencySync } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  product_id?: string;
  name: string;
  title_ar?: string;
  title_en?: string;
  short_desc_ar?: string;
  full_desc_ar?: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  category_name?: string;
  category_id?: string;
  stock_quantity: number;
  image_url?: string;
  image_urls?: string[];
  video_review_links?: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  sku?: string;
  code?: string;
  weight?: number;
  dimensions?: string;
  specifications?: Record<string, any>;
  seo_title?: string;
  seo_description?: string;
  whatsapp_message_text?: string;
  tags?: string[];
  technical_specs_ar?: string;
}

interface Category {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  image_url?: string;
}

interface ProductFormData {
  name: string;
  title_ar: string;
  title_en: string;
  short_desc_ar: string;
  full_desc_ar: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  category_name: string;
  stock_quantity: number;
  image_urls: string[];
  video_review_links: string[];
  is_featured: boolean;
  is_active: boolean;
  sku?: string;
  code?: string;
  weight?: number;
  dimensions?: string;
  specifications?: Record<string, any>;
  seo_title?: string;
  seo_description?: string;
  whatsapp_message_text?: string;
  tags?: string[];
  technical_specs_ar?: string;
}

const ProductsAdmin: React.FC = () => {
  const { i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAllFields, setShowAllFields] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    title_ar: '',
    title_en: '',
    short_desc_ar: '',
    full_desc_ar: '',
    description: '',
    price: 0,
    original_price: 0,
    category: '',
    category_name: '',
    stock_quantity: 0,
    image_urls: [],
    video_review_links: [],
    is_featured: false,
    is_active: true,
    sku: '',
    code: '',
    weight: 0,
    dimensions: '',
    specifications: {},
    seo_title: '',
    seo_description: '',
    whatsapp_message_text: '',
    tags: [],
    technical_specs_ar: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, { price?: number; stock?: number }>>({});
  const pendingBulk = useMemo(() => {
    const ids = Object.keys(editingRow).filter(id =>
      (editingRow[id]?.price !== undefined) || (editingRow[id]?.stock !== undefined)
    );
    return ids;
  }, [editingRow]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
    featured: 0,
    totalValue: 0,
  });
  const [aiLoading, setAiLoading] = useState(false);

  // TODO: Move API Key to environment variables
  const API_KEY = "AIzaSyA3kNLnFwOGTbyyVFBF7zIPk6im6IfJoJk";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const generateProductDetails = async () => {
    if (!formData.name) {
      toast.error("يرجى إدخال اسم المنتج أولاً");
      return;
    }
    setAiLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `
        Based on the product name "${formData.name}", generate detailed product information for an e-commerce store in Egypt.
        Provide the output in a clean JSON format. Do not include any text before or after the JSON object.
        The JSON object should have the following keys:
        - title_ar: (string) Arabic title for the product.
        - title_en: (string) English title for the product.
        - short_desc_ar: (string) A short, appealing description in Arabic (around 1-2 sentences).
        - full_desc_ar: (string) A full, detailed description in Arabic (2-3 paragraphs).
        - description: (string) A general, neutral description (can be in English or Arabic, 1-2 paragraphs).
        - price: (number) A realistic market price in EGP.
        - original_price: (number) A slightly higher price to show a discount, can be 0.
        - stock_quantity: (number) A random stock quantity between 50 and 200.
        - tags: (array of strings) Relevant keywords and tags in Arabic.
        - seo_title: (string) An SEO-optimized title.
        - seo_description: (string) An SEO-optimized meta description.
        - technical_specs_ar: (string) Technical specifications, with each spec on a new line (e.g., "اللون: أسود\\nالمادة: بلاستيك").
        - code: (string) A generated product code, like "PROD-XXXX".

        Example for product "طابعة فواتير حرارية":
        {
          "title_ar": "طابعة فواتير حرارية عالية السرعة",
          "title_en": "High-Speed Thermal Receipt Printer",
          "short_desc_ar": "طابعة فواتير حرارية سريعة وموثوقة، مثالية لنقاط البيع والمطاعم. تدعم الطباعة باللغة العربية.",
          "full_desc_ar": "تم تصميم طابعة الفواتير الحرارية هذه لتلبية احتياجات الأعمال التجارية المزدحمة. تتميز بسرعة طباعة تصل إلى 250 مم/ثانية، مما يضمن خدمة سريعة للعملاء.\\n\\nتتوافق الطابعة مع معظم أنظمة نقاط البيع وتدعم مجموعة واسعة من الرموز الشريطية. سهلة التركيب والاستخدام، وتأتي مع قاطع تلقائي لزيادة الكفاءة.",
          "description": "A reliable and fast thermal printer for receipts and invoices.",
          "price": 1850,
          "original_price": 2100,
          "stock_quantity": 120,
          "tags": ["طابعة حرارية", "طابعة فواتير", "نقاط بيع", "كاشير"],
          "seo_title": "شراء طابعة فواتير حرارية سريعة | أفضل سعر في مصر",
          "seo_description": "احصل على أفضل طابعة فواتير حرارية لنشاطك التجاري. سرعة عالية، جودة ممتازة، ودعم فني. اطلب الآن!",
          "technical_specs_ar": "تقنية الطباعة: حراري مباشر\\nسرعة الطباعة: 250 مم/ثانية\\nعرض الورق: 80 مم",
          "code": "PROD-5678"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean the response to get only the JSON
      text = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);

      const jsonData = JSON.parse(text);

      setFormData(prev => ({
        ...prev,
        title_ar: jsonData.title_ar || prev.title_ar,
        title_en: jsonData.title_en || prev.title_en,
        short_desc_ar: jsonData.short_desc_ar || prev.short_desc_ar,
        full_desc_ar: jsonData.full_desc_ar || prev.full_desc_ar,
        description: jsonData.description || prev.description,
        price: jsonData.price || prev.price,
        original_price: jsonData.original_price || prev.original_price,
        stock_quantity: jsonData.stock_quantity || prev.stock_quantity,
        tags: jsonData.tags || prev.tags,
        seo_title: jsonData.seo_title || prev.seo_title,
        seo_description: jsonData.seo_description || prev.seo_description,
        technical_specs_ar: jsonData.technical_specs_ar || prev.technical_specs_ar,
        code: jsonData.code || prev.code,
      }));

      toast.success("تم ملء البيانات بنجاح باستخدام الذكاء الاصطناعي!");

    } catch (error) {
      console.error("خطأ في الملء التلقائي:", error);
      toast.error("فشل الملء التلقائي. يرجى المحاولة مرة أخرى.");
    } finally {
      setAiLoading(false);
    }
  };

  // جلب المنتجات
  const fetchProducts = useCallback(async () => {
      if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
        return;
      }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const base = data.map((p: any) => {
          const firstImage = Array.isArray(p.image_urls) && p.image_urls.length > 0 ? p.image_urls[0] : p.thumbnail_url;
          return {
            ...p,
            id: p.product_id || p.id || p.sku || String(Math.random()),
            name: p.title_ar || p.title_en || p.name || '',
            image_url: firstImage,
            stock_quantity: typeof p.stock === 'number' ? p.stock : (p.stock_quantity ?? 0),
          } as Product & { stock?: number };
        });

        // Load categories for these products from junction table
        const productIds = base.map(p => p.product_id || p.id).filter(Boolean);
        let withCats = base;
        if (productIds.length) {
          const { data: catLinks } = await supabase
            .from('product_categories')
            .select('product_id, categories:category_id (category_id, name_ar, name_en)')
            .in('product_id', productIds as string[]);
          const firstCatByProduct: Record<string, { id: string; name: string }> = {};
          catLinks?.forEach((row: any) => {
            if (!firstCatByProduct[row.product_id] && row.categories) {
              firstCatByProduct[row.product_id] = {
                id: row.categories.category_id,
                name: row.categories.name_ar || row.categories.name_en || 'غير مصنف'
              };
            }
          });
          withCats = base.map(p => ({
            ...p,
            category_id: firstCatByProduct[p.product_id || p.id]?.id,
            category: firstCatByProduct[p.product_id || p.id]?.name || '',
          }));
        }

        setProducts(withCats as Product[]);
        updateStats(withCats as Product[]);
      }
    } catch (error) {
      console.error('خطأ في جلب المنتجات:', error);
      toast.error('فشل في جلب المنتجات');
      } finally {
        setLoading(false);
      }
  }, []);

  // جلب التصنيفات
  const fetchCategories = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, name_ar, name_en, display_order')
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        const mapped = data.map((c: any) => ({
          id: c.category_id,
          name: c.name_ar || c.name_en || 'غير مصنف',
          name_ar: c.name_ar,
          name_en: c.name_en,
        }));
        setCategories(mapped);
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
    }
  }, []);

  // تحديث الإحصائيات
  const updateStats = useCallback((productsList: Product[]) => {
    const total = productsList.length;
    const active = productsList.filter(p => p.is_active).length;
    const inactive = total - active;
    const lowStock = productsList.filter(p => p.stock_quantity < 10).length;
    const featured = productsList.filter(p => p.is_featured).length;
    const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    setStats({
      total,
      active,
      inactive,
      lowStock,
      featured,
      totalValue,
    });
  }, []);

  // إضافة منتج جديد
  const addProduct = async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      const { data: inserted, error } = await supabase
        .from('products')
        .insert([{ 
          title_ar: formData.title_ar || formData.name,
          title_en: formData.title_en || formData.name,
          short_desc_ar: formData.short_desc_ar,
          full_desc_ar: formData.full_desc_ar,
          price: formData.price,
          original_price: formData.original_price || null,
          stock: formData.stock_quantity,
          image_urls: formData.image_urls,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
          sku: formData.sku,
          created_at: new Date().toISOString(),
        }])
        .select('product_id')
        .single();

      if (error) throw error;

      // Link category via junction table if selected
      if (inserted?.product_id && formData.category) {
        await supabase
          .from('product_categories')
          .insert([{ product_id: inserted.product_id, category_id: formData.category }]);
      }

      toast.success('تم إضافة المنتج بنجاح');
      setShowAddDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error);
      toast.error('فشل في إضافة المنتج');
    }
  };

  // تحديث منتج
  const updateProduct = async () => {
    if (!editingProduct || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title_ar: formData.title_ar || formData.name,
          title_en: formData.title_en || formData.name,
          short_desc_ar: formData.short_desc_ar,
          full_desc_ar: formData.full_desc_ar,
          price: formData.price,
          original_price: formData.original_price || null,
          stock: formData.stock_quantity,
          image_urls: formData.image_urls,
          is_featured: formData.is_featured,
          is_active: formData.is_active,
          sku: formData.sku,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', editingProduct.id || editingProduct.product_id);

      if (error) throw error;

      // Update junction mapping
      const pid = editingProduct.id || editingProduct.product_id as string;
      if (pid) {
        await supabase.from('product_categories').delete().eq('product_id', pid);
        if (formData.category) {
          await supabase.from('product_categories').insert([{ product_id: pid, category_id: formData.category }]);
        }
      }

      toast.success('تم تحديث المنتج بنجاح');
      setShowEditDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
      toast.error('فشل في تحديث المنتج');
    }
  };

  // حذف منتج
  const deleteProduct = async (productId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
          .from('products')
        .delete()
        .eq('product_id', productId);

        if (error) {
          // If FK violation, fallback to soft-disable
          if ((error as any).code === '23503') {
            const { error: softErr } = await supabase
              .from('products')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('product_id', productId);
            if (softErr) throw error;
            toast.info('لا يمكن حذف المنتج لوجود طلبات مرتبطة. تم إلغاء تفعيله بدلاً من الحذف.');
          } else {
            throw error;
          }
        }

      if (!(error as any)) {
        toast.success('تم حذف المنتج بنجاح');
      }
      fetchProducts();
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      toast.error('فشل في حذف المنتج');
    }
  };

  // تغيير حالة المنتج
  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
          .from('products')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId);

        if (error) throw error;

      toast.success(`تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} المنتج`);
      fetchProducts();
    } catch (error) {
      console.error('خطأ في تغيير حالة المنتج:', error);
      toast.error('فشل في تغيير حالة المنتج');
    }
  };

  // تغيير حالة التميز
  const toggleFeatured = async (productId: string, isFeatured: boolean) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId);

      if (error) throw error;

      toast.success(`تم ${isFeatured ? 'إضافة' : 'إزالة'} التميز من المنتج`);
      fetchProducts();
    } catch (error) {
      console.error('خطأ في تغيير حالة التميز:', error);
      toast.error('فشل في تغيير حالة التميز');
    }
  };

  // تعديل سريع من الجدول (سعر/كمية)
  const quickUpdateProduct = async (productId: string, fields: Partial<Product>) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...(fields.price !== undefined ? { price: fields.price } : {}),
          ...(fields.stock_quantity !== undefined ? { stock: fields.stock_quantity } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', productId);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('خطأ في التعديل السريع:', error);
      toast.error('فشل في التعديل السريع');
    }
  };

  // رفع صورة
  const uploadImage = async (file: File) => {
    if (!isSupabaseConfigured) return;

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

             setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, publicUrl] }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('خطأ في رفع الصورة:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      title_ar: '',
      title_en: '',
      short_desc_ar: '',
      full_desc_ar: '',
      description: '',
      price: 0,
      original_price: 0,
      category: '',
      category_name: '',
      stock_quantity: 0,
      image_urls: [],
      video_review_links: [],
      is_featured: false,
      is_active: true,
      sku: '',
      code: '',
      weight: 0,
      dimensions: '',
      specifications: {},
      seo_title: '',
      seo_description: '',
      whatsapp_message_text: '',
      tags: [],
      technical_specs_ar: '',
    });
  };

  // فتح نافذة التعديل
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      title_ar: product.title_ar || '',
      title_en: product.title_en || '',
      short_desc_ar: product.short_desc_ar || '',
      full_desc_ar: product.full_desc_ar || '',
      description: product.description,
      price: product.price,
      original_price: product.original_price || 0,
      category: product.category,
      category_name: product.category_name || '',
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls || [],
      video_review_links: product.video_review_links || [],
      is_featured: product.is_featured,
      is_active: product.is_active,
      sku: product.sku || '',
      code: product.code || '',
      weight: product.weight || 0,
      dimensions: product.dimensions || '',
      specifications: product.specifications || {},
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      whatsapp_message_text: product.whatsapp_message_text || '',
      tags: product.tags || [],
      technical_specs_ar: product.technical_specs_ar || '',
    });
    setShowEditDialog(true);
  };

  // تصدير البيانات
  const exportData = () => {
    const csvContent = [
      ['اسم المنتج', 'الوصف', 'السعر', 'السعر الأصلي', 'التصنيف', 'الكمية المتوفرة', 'SKU', 'الحالة'],
      ...products.map(product => [
        product.name,
        product.description,
        product.price.toString(),
        (product.original_price || 0).toString(),
        product.category,
        product.stock_quantity.toString(),
        product.sku || '',
        product.is_active ? 'نشط' : 'غير نشط'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصفية المنتجات
  const filteredProducts = products.filter(product => {
    const name = product.name || '';
    const description = product.description || '';
    const sku = product.sku || '';
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      name.toLowerCase().includes(search) ||
      description.toLowerCase().includes(search) ||
      sku.toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === 'all' ||
      product.category_id === selectedCategory ||
      product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && product.is_active) ||
      (selectedStatus === 'inactive' && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ترتيب المنتجات
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const [field, direction] = sortBy.split('-');
    
    if (field === 'name') {
      if (!a.name || !b.name) return 0;
      return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (field === 'price') {
      return direction === 'asc' ? a.price - b.price : b.price - a.price;
    }
    if (field === 'stock') {
      return direction === 'asc' ? a.stock_quantity - b.stock_quantity : b.stock_quantity - a.stock_quantity;
    }
    if (field === 'created') {
      return direction === 'asc' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    return 0;
  });

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المنتجات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة جميع منتجات المتجر وإعداداتها
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المنتجات النشطة</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المنتجات المميزة</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.featured}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">قيمة المخزون</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                     {formatCurrencySync(stats.totalValue, 'ج.م')}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">البحث</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">التصنيف</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل التصنيفات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_ar || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
      </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الترتيب</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">الاسم (أ-ي)</SelectItem>
                  <SelectItem value="name-desc">الاسم (ي-أ)</SelectItem>
                  <SelectItem value="price-asc">السعر (منخفض-عالي)</SelectItem>
                  <SelectItem value="price-desc">السعر (عالي-منخفض)</SelectItem>
                  <SelectItem value="stock-asc">المخزون (قليل-كثير)</SelectItem>
                  <SelectItem value="created-desc">الأحدث</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول المنتجات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>المنتجات ({sortedProducts.length})</span>
            <div className="flex items-center gap-2">
              {pendingBulk.length > 0 && (
                <>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={async () => {
                    // حفظ مجمّع لكل الصفوف التي بها تغييرات
                    for (const id of pendingBulk) {
                      const changes = editingRow[id] || {};
                      await quickUpdateProduct(id, {
                        ...(changes.price !== undefined ? { price: changes.price } : {}),
                        ...(changes.stock !== undefined ? { stock_quantity: changes.stock } : {}),
                      });
                    }
                    setEditingRow({});
                  }}>حفظ كل التغييرات</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingRow({})}>تراجع عن الكل</Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProducts}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead>الصورة</TableHead>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          {product.sku && (
                            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 h-8"
                          value={(editingRow[product.id]?.price ?? product.price)}
                          onChange={(e) => setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], price: parseFloat(e.target.value) || 0 } }))}
                        />
                        {(editingRow[product.id]?.price !== undefined && editingRow[product.id]?.price !== product.price) && (
                          <div className="flex flex-col gap-1">
                            <Button size="sm" variant="outline" onClick={() => { quickUpdateProduct(product.id, { price: editingRow[product.id]!.price! }); setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], price: undefined } })); }}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], price: undefined } }))}>تراجع</Button>
                          </div>
                        )}
                      </div>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrencySync(product.original_price, 'ج.م')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 h-8"
                          value={(editingRow[product.id]?.stock ?? product.stock_quantity)}
                          onChange={(e) => setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], stock: parseInt(e.target.value) || 0 } }))}
                        />
                        {(editingRow[product.id]?.stock !== undefined && editingRow[product.id]?.stock !== product.stock_quantity) && (
                          <div className="flex flex-col gap-1">
                            <Button size="sm" variant="outline" onClick={() => { quickUpdateProduct(product.id, { stock_quantity: editingRow[product.id]!.stock! }); setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], stock: undefined } })); }}>حفظ</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRow(prev => ({ ...prev, [product.id]: { ...prev[product.id], stock: undefined } }))}>تراجع</Button>
                          </div>
                        )}
                      </div>
                      {product.stock_quantity < 10 && (
                        <Badge variant="destructive" className="text-xs">منخفض</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={product.is_active ? 'default' : 'secondary'}
                        className={product.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}
                        onClick={() => toggleProductStatus(product.id, !product.is_active)}
                      >
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </Button>
                      <Button
                        size="sm"
                        variant={product.is_featured ? 'default' : 'secondary'}
                        className={product.is_featured ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}
                        onClick={() => toggleFeatured(product.id, !product.is_featured)}
                      >
                        {product.is_featured ? 'مميز' : 'غير مميز'}
                      </Button>
                    </div>
                  </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>تعديل</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                        </Button>
                              </TooltipTrigger>
                              <TooltipContent>حذف</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                  </TableCell>
                </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة إضافة منتج جديد */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between my-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-all-fields-add"
                checked={showAllFields}
                onCheckedChange={setShowAllFields}
              />
              <Label htmlFor="show-all-fields-add">عرض كل الحقول</Label>
            </div>
            <Button
              onClick={generateProductDetails}
              disabled={aiLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {aiLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              ملء تلقائي بالذكاء الاصطناعي
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج الأساسي"
              />
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="رمز التخزين التعريفي"
              />
            </div>

            <div className="space-y-2">
              <Label>التصنيف *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_ar || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>السعر *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>السعر الأصلي (قبل الخصم)</Label>
              <Input
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>الكمية المتوفرة *</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2">
                  <Label>الوزن (كجم)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الأبعاد (سم)</Label>
                  <Input
                    value={formData.dimensions}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="الطول×العرض×الارتفاع"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                    placeholder="عنوان المنتج بالعربية (للتوضيح)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>العنوان (انجليزي)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="عنوان المنتج بالإنجليزية (اختياري)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>كود المنتج (Code/Eslam)</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="كود المنتج الإضافي"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>الوصف الرئيسي *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المنتج الرئيسي الذي يظهر في كل مكان"
                rows={3}
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>وصف قصير (عربي)</Label>
                  <Textarea
                    value={formData.short_desc_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_desc_ar: e.target.value }))}
                    placeholder="وصف قصير للمنتج (للملخصات)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>وصف كامل (عربي)</Label>
                  <Textarea
                    value={formData.full_desc_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_desc_ar: e.target.value }))}
                    placeholder="وصف كامل وتفصيلي للمنتج (لصفحة المنتج)"
                    rows={5}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>المواصفات الفنية (عربي)</Label>
                  <Textarea
                    value={formData.technical_specs_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, technical_specs_ar: e.target.value }))}
                    placeholder="كل مواصفة في سطر، مثال: اللون: أزرق"
                    rows={4}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>روابط الصور (كل رابط في سطر)</Label>
              <Textarea
                value={formData.image_urls.join('\n')}
                onChange={(e) => setFormData(prev => ({ ...prev, image_urls: e.target.value.split('\n').map(url => url.trim()).filter(url => url) }))}
                placeholder="رابط الصورة 1&#10;رابط الصورة 2&#10;..."
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>أو رفع صور جديدة</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(file => uploadImage(file));
                  }
                }}
                disabled={uploadingImage}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>روابط فيديو المراجعة (كل رابط في سطر)</Label>
                  <Textarea
                    value={formData.video_review_links.join('\n')}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_review_links: e.target.value.split('\n').map(url => url.trim()).filter(url => url) }))}
                    placeholder="رابط يوتيوب 1&#10;رابط يوتيوب 2&#10;..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>الكلمات المفتاحية (Tags)</Label>
                  <Input
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                    placeholder="اكتب الكلمة ثم اضغط فاصلة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان SEO</Label>
                  <Input
                    value={formData.seo_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="عنوان محسن لمحركات البحث"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف SEO</Label>
                  <Textarea
                    value={formData.seo_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="وصف محسن لمحركات البحث"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>رسالة واتساب مخصصة</Label>
                  <Input
                    value={formData.whatsapp_message_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_message_text: e.target.value }))}
                    placeholder="نص رسالة واتساب عند طلب هذا المنتج"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured-add"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="featured-add">منتج مميز</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active-add"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active-add">نشط</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={addProduct} disabled={!formData.name || !formData.category || formData.price <= 0}>
              إضافة المنتج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل المنتج */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المنتج: {formData.name}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between my-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-all-fields-edit"
                checked={showAllFields}
                onCheckedChange={setShowAllFields}
              />
              <Label htmlFor="show-all-fields-edit">عرض كل الحقول</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج الأساسي"
              />
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="رمز التخزين التعريفي"
              />
            </div>

            <div className="space-y-2">
              <Label>التصنيف *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_ar || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>السعر *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>السعر الأصلي (قبل الخصم)</Label>
              <Input
                type="number"
                value={formData.original_price}
                onChange={(e) => setFormData(prev => ({ ...prev, original_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>الكمية المتوفرة *</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2">
                  <Label>الوزن (كجم)</Label>
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الأبعاد (سم)</Label>
                  <Input
                    value={formData.dimensions}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="الطول×العرض×الارتفاع"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                    placeholder="عنوان المنتج بالعربية (للتوضيح)"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>العنوان (انجليزي)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder="عنوان المنتج بالإنجليزية (اختياري)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>كود المنتج (Code/Eslam)</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="كود المنتج الإضافي"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>الوصف الرئيسي *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المنتج الرئيسي الذي يظهر في كل مكان"
                rows={3}
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>وصف قصير (عربي)</Label>
                  <Textarea
                    value={formData.short_desc_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, short_desc_ar: e.target.value }))}
                    placeholder="وصف قصير للمنتج (للملخصات)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>وصف كامل (عربي)</Label>
                  <Textarea
                    value={formData.full_desc_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_desc_ar: e.target.value }))}
                    placeholder="وصف كامل وتفصيلي للمنتج (لصفحة المنتج)"
                    rows={5}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>المواصفات الفنية (عربي)</Label>
                  <Textarea
                    value={formData.technical_specs_ar}
                    onChange={(e) => setFormData(prev => ({ ...prev, technical_specs_ar: e.target.value }))}
                    placeholder="كل مواصفة في سطر، مثال: اللون: أزرق"
                    rows={4}
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>روابط الصور (كل رابط في سطر)</Label>
              <Textarea
                value={formData.image_urls.join('\n')}
                onChange={(e) => setFormData(prev => ({ ...prev, image_urls: e.target.value.split('\n').map(url => url.trim()).filter(url => url) }))}
                placeholder="رابط الصورة 1&#10;رابط الصورة 2&#10;..."
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>أو رفع صور جديدة</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(file => uploadImage(file));
                  }
                }}
                disabled={uploadingImage}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {showAllFields && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label>روابط فيديو المراجعة (كل رابط في سطر)</Label>
                  <Textarea
                    value={formData.video_review_links.join('\n')}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_review_links: e.target.value.split('\n').map(url => url.trim()).filter(url => url) }))}
                    placeholder="رابط يوتيوب 1&#10;رابط يوتيوب 2&#10;..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>الكلمات المفتاحية (Tags)</Label>
                  <Input
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                    placeholder="اكتب الكلمة ثم اضغط فاصلة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>عنوان SEO</Label>
                  <Input
                    value={formData.seo_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="عنوان محسن لمحركات البحث"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وصف SEO</Label>
                  <Textarea
                    value={formData.seo_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="وصف محسن لمحركات البحث"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>رسالة واتساب مخصصة</Label>
                  <Input
                    value={formData.whatsapp_message_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_message_text: e.target.value }))}
                    placeholder="نص رسالة واتساب عند طلب هذا المنتج"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="edit-featured">منتج مميز</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="edit-active">نشط</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={updateProduct} disabled={!formData.name || !formData.category || formData.price <= 0}>
              تحديث المنتج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsAdmin; 