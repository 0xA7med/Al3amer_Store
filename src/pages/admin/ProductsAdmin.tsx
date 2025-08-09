import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Category {
  category_id: string;
  name_ar: string;
  name_en?: string;
  is_active: boolean;
}

interface Category {
  category_id: string;
  name_ar: string;
  name_en?: string;
  is_active: boolean;
}

interface Product {
  product_id: string;
  title_ar: string;
  title_en?: string;
  price: number | string; // Allow string for form input
  original_price?: number | string; // Allow string for form input
  categories?: Category[];
  category_ids?: string[];
  stock: number | string; // Allow string for form input
  thumbnail_url?: string;
  image_urls?: string[];
  short_desc_ar?: string;
  full_desc_ar?: string;
  sku?: string;
  weight?: string;
  dimensions?: string;
  is_featured?: boolean;
  is_active?: boolean;
}

const ProductsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const renderProductForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">المعلومات الأساسية</h3>
          <div>
            <Label htmlFor="title_ar">اسم المنتج (العربية) *</Label>
            <Input
              id="title_ar"
              value={newProduct.title_ar || ''}
              onChange={(e) => setNewProduct({ ...newProduct, title_ar: e.target.value })}
              placeholder="اسم المنتج بالعربية"
            />
          </div>
          <div>
            <Label htmlFor="title_en">اسم المنتج (الإنجليزية)</Label>
            <Input
              id="title_en"
              value={newProduct.title_en || ''}
              onChange={(e) => setNewProduct({ ...newProduct, title_en: e.target.value })}
              placeholder="اسم المنتج بالإنجليزية"
            />
          </div>
          <div>
            <Label htmlFor="price">السعر (ج.م) *</Label>
            <Input
              id="price"
              type="number"
              value={newProduct.price || ''}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              placeholder="السعر بالجنيه المصري"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="original_price">السعر الأصلي (ج.م)</Label>
            <Input
              id="original_price"
              type="number"
              value={newProduct.original_price || ''}
              onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value || undefined })}
              placeholder="السعر الأصلي (للعروض)"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor="stock">الكمية المتوفرة *</Label>
            <Input
              id="stock"
              type="number"
              value={newProduct.stock || 0}
              onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
              placeholder="الكمية المتوفرة"
              min="0"
            />
          </div>
        </div>
        {/* Categories */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">التصنيفات</h3>
          <div>
            <Label>اختر التصنيفات</Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
              {categories.map((category) => (
                <div key={category.category_id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`cat-${category.category_id}`}
                    checked={selectedCategoryIds.includes(category.category_id)}
                    onChange={() => handleCategoryToggle(category.category_id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor={`cat-${category.category_id}`} className="mr-2">
                    {category.name_ar}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Description */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">الوصف</h3>
        <div>
          <Label htmlFor="short_desc_ar">وصف مختصر</Label>
          <Input
            id="short_desc_ar"
            value={newProduct.short_desc_ar || ''}
            onChange={(e) => setNewProduct({ ...newProduct, short_desc_ar: e.target.value })}
            placeholder="وصف مختصر للمنتج"
          />
        </div>
        <div>
          <Label htmlFor="full_desc_ar">الوصف التفصيلي</Label>
          <textarea
            id="full_desc_ar"
            value={newProduct.full_desc_ar || ''}
            onChange={(e) => setNewProduct({ ...newProduct, full_desc_ar: e.target.value })}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
            placeholder="وصف تفصيلي للمنتج"
            rows={5}
          />
        </div>
      </div>
      {/* Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">الإعدادات</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="featured" className="text-base font-medium">منتج مميز</Label>
              <p className="text-sm text-gray-600 mt-1">عرض المنتج في الصفحة الرئيسية</p>
            </div>
            <Button
              type="button"
              variant={newProduct.is_featured ? "default" : "outline"}
              size="sm"
              onClick={() => setNewProduct({ ...newProduct, is_featured: !newProduct.is_featured })}
              className={`min-w-[60px] ${newProduct.is_featured ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {newProduct.is_featured ? 'نعم' : 'لا'}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="active" className="text-base font-medium">منتج نشط</Label>
              <p className="text-sm text-gray-600 mt-1">إظهار المنتج في المتجر</p>
            </div>
            <Button
              type="button"
              variant={newProduct.is_active ? "default" : "outline"}
              size="sm"
              onClick={() => setNewProduct({ ...newProduct, is_active: !newProduct.is_active })}
              className={`min-w-[60px] ${newProduct.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {newProduct.is_active ? 'نعم' : 'لا'}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <Button onClick={editingProduct ? handleSaveEdit : handleAddProduct} className="flex-1">
          {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="flex-1"
        >
          إلغاء
        </Button>
      </div>
    </div>
  );

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    price: '',
    stock: '',
    is_featured: false,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isSupabaseConfigured) {
        setCategories([]);
        return;
      }
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, name_ar, name_en, is_active')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!error && data) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products from database with categories
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isSupabaseConfigured) {
        setProducts([]);
        setLoading(false);
        setError('لا يمكن جلب المنتجات دون ضبط مفاتيح Supabase محلياً (.env.local)');
        return;
      }
      setLoading(true);
      try {
        // First get all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Then get all product-category relationships
        const { data: productCategoriesData, error: pcError } = await supabase
          .from('product_categories')
          .select('product_id, category_id')
          .order('category_id');

        if (pcError) throw pcError;

        // Then get all categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;

        // Create a map of categories for quick lookup
        const categoriesMap = new Map(categoriesData?.map(cat => [cat.category_id, cat]) || []);

        // Group categories by product
        const categoriesByProduct = productCategoriesData?.reduce((acc, item) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = [];
          }
          const category = categoriesMap.get(item.category_id);
          if (category) {
            acc[item.product_id].push(category);
          }
          return acc;
        }, {} as Record<string, Category[]>);

        // Combine products with their categories
        const productsWithCategories = productsData?.map(product => {
          const productCategories = categoriesByProduct[product.product_id] || [];
          return {
            ...product,
            categories: productCategories,
            category_ids: productCategories.map((c: any) => c.category_id)
          };
        }) || [];

        setProducts(productsWithCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('حدث خطأ أثناء جلب المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // تصفية وفرز المنتجات
  const filtered = products
    .filter(p => {
      if (search && !(
        (p.title_ar || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.categories && p.categories.some(cat => (cat.name_ar || '').toLowerCase().includes(search.toLowerCase()))) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
      )) return false;
      if (filterCategory !== 'all' && !(p.category_ids && p.category_ids.includes(filterCategory))) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !p.is_active) return false;
        if (filterStatus === 'inactive' && p.is_active) return false;
      }
      if (filterFeatured !== 'all') {
        if (filterFeatured === 'featured' && !p.is_featured) return false;
        if (filterFeatured === 'not_featured' && p.is_featured) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // إضافة منتج جديد إلى قاعدة البيانات
  const handleAddProduct = async () => {
    if (!isSupabaseConfigured) {
      setError('إضافة المنتجات غير متاحة بدون إعداد Supabase');
      return;
    }
    if (!newProduct.title_ar || newProduct.price === '' || newProduct.price === undefined || !selectedCategoryIds.length) {
      alert('يرجى ملء الحقول المطلوبة واختيار تصنيف واحد على الأقل');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Start a transaction
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          ...newProduct,
          price: Number(newProduct.price),
          original_price: newProduct.original_price ? Number(newProduct.original_price) : null,
          stock: Number(newProduct.stock) || 0,
          image_urls: newProduct.image_urls || [],
        })
        .select()
        .single();
      
      if (productError) throw productError;
      
      // Add categories
      if (selectedCategoryIds.length > 0) {
        const { error: pcError } = await supabase
          .from('product_categories')
          .insert(selectedCategoryIds.map(categoryId => ({
            product_id: product.product_id,
            category_id: categoryId
          })));
        
        if (pcError) throw pcError;
      }
      
      // Refresh products list
      await fetchProducts();
      
      // Reset form and close edit mode
      setShowAdd(false);
      setEditingProduct(null);
      setExpandedProductId(null);
      setNewProduct({ is_featured: false, is_active: true });
      setSelectedCategoryIds([]);
      
      alert('تمت إضافة المنتج بنجاح');
    } catch (e) {
      console.error('Error adding product:', e);
      setError('فشل في إضافة المنتج: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to fetch products with categories
  const fetchProducts = async () => {
    if (!isSupabaseConfigured) {
      setProducts([]);
      setLoading(false);
      setError('لا يمكن جلب المنتجات بدون إعداد Supabase');
      return;
    }
    setLoading(true);
    try {
      // First get all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Then get all product-category relationships
      const { data: productCategoriesData, error: pcError } = await supabase
        .from('product_categories')
        .select('product_id, categories(category_id, name_ar, name_en, is_active)');

      if (pcError) throw pcError;

      // Group categories by product
      const categoriesByProduct = productCategoriesData?.reduce((acc, item) => {
        if (!acc[item.product_id]) {
          acc[item.product_id] = [];
        }
        if (item.categories) {
          acc[item.product_id].push(item.categories);
        }
        return acc;
      }, {} as Record<string, any[]>);

      // Combine products with their categories
      const productsWithCategories = productsData?.map(product => {
        const productCategories = categoriesByProduct[product.product_id] || [];
        return {
          ...product,
          categories: productCategories,
          category_ids: productCategories.map((c: any) => c.category_id)
        };
      }) || [];

      setProducts(productsWithCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('حدث خطأ أثناء جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      ...product,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      original_price: product.original_price !== undefined ? 
        (typeof product.original_price === 'number' ? product.original_price.toString() : product.original_price) : 
        undefined,
      stock: typeof product.stock === 'number' ? product.stock.toString() : product.stock,
    });
    
    // Set selected categories for editing
    if (product.category_ids && product.category_ids.length > 0) {
      setSelectedCategoryIds([...product.category_ids]);
    } else if (product.categories && product.categories.length > 0) {
      setSelectedCategoryIds(product.categories.map(c => c.category_id));
    } else {
      setSelectedCategoryIds([]);
    }
    
    setExpandedProductId(product.product_id);
    setShowAdd(false);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingProduct(null);
    setExpandedProductId(null);
    setNewProduct({ is_featured: false, is_active: true });
    setSelectedCategoryIds([]);
  };

  // حذف منتج من قاعدة البيانات
  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    if (!isSupabaseConfigured) {
      setError('حذف المنتج غير متاح بدون إعداد Supabase');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('products').delete().eq('product_id', id);
      if (error) throw error;
      // إعادة تحميل المنتجات
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
      alert('تم حذف المنتج بنجاح');
    } catch (e) {
      setError('فشل في حذف المنتج');
    }
    setLoading(false);
  };

  // تعديل منتج في قاعدة البيانات
  const handleSaveEdit = async () => {
    if (!isSupabaseConfigured) {
      setError('تعديل المنتج غير متاح بدون إعداد Supabase');
      return;
    }
    if (!editingProduct || !newProduct.title_ar || newProduct.price === '' || newProduct.price === undefined || !selectedCategoryIds.length) {
      alert('يرجى ملء الحقول المطلوبة واختيار تصنيف واحد على الأقل');
      return;
    }

    setLoading(true);
    try {
      // تحديث المنتج
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title_ar: newProduct.title_ar,
          title_en: newProduct.title_en,
          price: Number(newProduct.price),
          original_price: newProduct.original_price ? Number(newProduct.original_price) : null,
          stock: Number(newProduct.stock),
          short_desc_ar: newProduct.short_desc_ar,
          full_desc_ar: newProduct.full_desc_ar,
          sku: newProduct.sku,
          weight: newProduct.weight,
          dimensions: newProduct.dimensions,
          is_featured: newProduct.is_featured,
          is_active: newProduct.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', editingProduct.product_id);

      if (updateError) throw updateError;

      // حذف العلاقات القديمة
      const { error: deleteError } = await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', editingProduct.product_id);

      if (deleteError) throw deleteError;

      // إضافة العلاقات الجديدة
      if (selectedCategoryIds.length > 0) {
        const { error: pcError } = await supabase
          .from('product_categories')
          .insert(selectedCategoryIds.map(categoryId => ({
            product_id: editingProduct.product_id,
            category_id: categoryId
          })));

        if (pcError) throw pcError;
      }

      // تحديث قائمة المنتجات
      await fetchProducts();

      // إغلاق نموذج التعديل
      setEditingProduct(null);
      setExpandedProductId(null);
      setNewProduct({ is_featured: false, is_active: true });
      setSelectedCategoryIds([]);

      alert('تم تعديل المنتج بنجاح');
    } catch (e) {
      console.error('Error updating product:', e);
      setError('فشل في تعديل المنتج: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/admin/categories')} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            إدارة التصنيفات
          </Button>
          <Button 
            onClick={() => {
              setShowAdd(true);
              setEditingProduct(null);
              setExpandedProductId(null);
              setNewProduct({ is_featured: false, is_active: true });
              setSelectedCategoryIds([]);
            }}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Plus size={16} />
            {loading ? 'جاري التحميل...' : 'إضافة منتج جديد'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input 
            placeholder="بحث بالاسم أو الفئة..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* تصفية حسب الفئة */}
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">كل الفئات</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name_ar}</option>
          ))}
        </select>
        {/* تصفية حسب الحالة */}
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        {/* تصفية حسب المميز */}
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filterFeatured}
          onChange={e => setFilterFeatured(e.target.value)}
        >
          <option value="all">الكل</option>
          <option value="featured">مميز</option>
          <option value="not_featured">غير مميز</option>
        </select>
        {/* فرز */}
        <div className="flex items-center gap-1">
          <span className="text-sm">فرز:</span>
          <button type="button" className={`px-2 py-1 rounded border text-sm ${sortBy==='title_ar' ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`} onClick={() => setSortBy('title_ar')}>الاسم</button>
          <button type="button" className={`px-2 py-1 rounded border text-sm ${sortBy==='price' ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`} onClick={() => setSortBy('price')}>السعر</button>
          <button type="button" className={`px-2 py-1 rounded border text-sm ${sortBy==='stock' ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`} onClick={() => setSortBy('stock')}>المخزون</button>
          <button type="button" className="px-1" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}</button>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Filter size={14} />
          {filtered.length} منتج
        </Badge>
      </div>

      {/* Add/Edit Product Form */}
      {showAdd && !editingProduct && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة منتج جديد</CardTitle>
          </CardHeader>
          <CardContent>
            {renderProductForm()}
          </CardContent>
        </Card>
      )}

      {/* لودر أو رسالة خطأ */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="loading-spinner w-12 h-12"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <div>
          {/* جدول للمتوسط والكبير، بطاقات للموبايل */}
          <div className="hidden sm:block overflow-x-auto px-2 md:px-8 lg:px-12">
            <div className="max-w-screen-2xl mx-auto">
              <table className=" w-full bg-white border rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-right">الصورة</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الفئة</th>
                  <th className="p-3 text-right">السعر</th>
                  <th className="p-3 text-right">المخزون</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <React.Fragment key={product.product_id}>
                    <tr className={`border-b hover:bg-gray-50 ${expandedProductId === product.product_id ? 'bg-blue-50' : ''}`}>
                    <td className="p-3">
                      <img 
                        src={product.thumbnail_url || '/images/placeholder-product.png'} 
                        alt={product.title_ar} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{product.title_ar}</div>
                        {product.sku && <div className="text-sm text-gray-500">{product.sku}</div>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-500 flex flex-wrap gap-1">
                        {product.categories && product.categories.length > 0 ? (
                          product.categories.map(cat => (
                            <span key={cat.category_id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {cat.name_ar}
                            </span>
                          ))
                        ) : (
                          'بدون تصنيف'
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{product.price} ج.م</div>
                        {product.original_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {product.original_price} ج.م
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{product.stock} قطعة</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {product.is_featured && <Badge variant="secondary">مميز</Badge>}
                        {product.is_active ? (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        ) : (
                          <Badge variant="destructive">غير نشط</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(product.product_id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                    </tr>
                    {expandedProductId === product.product_id && (
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="p-4">
                          <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold mb-4">تعديل المنتج: {product.title_ar}</h3>
                            {renderProductForm()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {/* بطاقات للموبايل */}
          <div className="sm:hidden space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد منتجات تطابق البحث
              </div>
            )}
            {filtered.map(product => (
              <Card key={product.product_id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-4 mb-2">
                  <img
                    src={product.thumbnail_url || '/images/placeholder-product.png'}
                    alt={product.title_ar}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg">{product.title_ar}</div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-1 mt-1">
                      {product.categories && product.categories.length > 0 ? (
                        product.categories.map(cat => (
                          <span key={cat.category_id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cat.name_ar}
                          </span>
                        ))
                      ) : (
                        'بدون تصنيف'
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm mb-2">
                  <Badge variant="outline">{product.price} ج.م</Badge>
                  {product.original_price && (
                    <Badge variant="secondary" className="line-through">{product.original_price} ج.م</Badge>
                  )}
                  <Badge>{product.stock} قطعة</Badge>
                  {product.is_featured && <Badge variant="secondary">مميز</Badge>}
                  {product.is_active ? (
                    <Badge className="bg-green-100 text-green-800">نشط</Badge>
                  ) : (
                    <Badge variant="destructive">غير نشط</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product);
                      setShowAdd(true);
                      setNewProduct(product);
                    }}
                    className="flex-1"
                  >
                    <Edit size={14} /> تعديل
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(product.product_id)}
                    className="flex-1"
                  >
                    <Trash2 size={14} /> حذف
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsAdmin; 