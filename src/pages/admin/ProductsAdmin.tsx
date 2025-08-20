import React, { useState, useEffect, useCallback } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { formatCurrencySync } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  stock_quantity: number;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  sku?: string;
  weight?: number;
  dimensions?: string;
  specifications?: Record<string, any>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  stock_quantity: number;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  sku?: string;
  weight?: number;
  dimensions?: string;
  specifications?: Record<string, any>;
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
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    original_price: 0,
    category: '',
    stock_quantity: 0,
    image_url: '',
    is_featured: false,
    is_active: true,
    sku: '',
    weight: 0,
    dimensions: '',
    specifications: {},
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0,
    featured: 0,
    totalValue: 0,
  });

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
        setProducts(data);
        updateStats(data);
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
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      if (data) {
        setCategories(data);
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
      const { error } = await supabase
        .from('products')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

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
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

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
        .eq('id', productId);

      if (error) throw error;

      toast.success('تم حذف المنتج بنجاح');
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
        .eq('id', productId);

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
        .eq('id', productId);

      if (error) throw error;

      toast.success(`تم ${isFeatured ? 'إضافة' : 'إزالة'} التميز من المنتج`);
      fetchProducts();
    } catch (error) {
      console.error('خطأ في تغيير حالة التميز:', error);
      toast.error('فشل في تغيير حالة التميز');
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

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
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
      description: '',
      price: 0,
      original_price: 0,
      category: '',
      stock_quantity: 0,
      image_url: '',
      is_featured: false,
      is_active: true,
      sku: '',
      weight: 0,
      dimensions: '',
      specifications: {},
    });
  };

  // فتح نافذة التعديل
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price || 0,
      category: product.category,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || '',
      is_featured: product.is_featured,
      is_active: product.is_active,
      sku: product.sku || '',
      weight: product.weight || 0,
      dimensions: product.dimensions || '',
      specifications: product.specifications || {},
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
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && product.is_active) ||
                         (selectedStatus === 'inactive' && !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ترتيب المنتجات
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const [field, direction] = sortBy.split('-');
    
    if (field === 'name') {
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
                  {formatCurrencySync(stats.totalValue, i18n.language)}
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
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
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
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
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
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatCurrencySync(product.price, i18n.language)}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrencySync(product.original_price, i18n.language)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={product.stock_quantity < 10 ? 'text-red-600 font-medium' : ''}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity < 10 && (
                            <Badge variant="destructive" className="text-xs">منخفض</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={(checked) => toggleProductStatus(product.id, checked)}
                          />
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                          {product.is_featured && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              مميز
                            </Badge>
                          )}
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
                                  onClick={() => toggleFeatured(product.id, !product.is_featured)}
                                >
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {product.is_featured ? 'إزالة التميز' : 'إضافة التميز'}
                              </TooltipContent>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج"
              />
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="رمز المنتج"
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
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
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
              <Label>السعر الأصلي</Label>
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
              <Label>الأبعاد</Label>
              <Input
                value={formData.dimensions}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                placeholder="الطول × العرض × الارتفاع"
              />
            </div>

            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="رابط الصورة"
              />
            </div>

            <div className="space-y-2">
              <Label>رفع صورة</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
                disabled={uploadingImage}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="featured">منتج مميز</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="active">نشط</Label>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المنتج *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج"
              />
            </div>

            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="رمز المنتج"
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
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
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
              <Label>السعر الأصلي</Label>
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
              <Label>الأبعاد</Label>
              <Input
                value={formData.dimensions}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                placeholder="الطول × العرض × الارتفاع"
              />
            </div>

            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="رابط الصورة"
              />
            </div>

            <div className="space-y-2">
              <Label>رفع صورة</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
                disabled={uploadingImage}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف المنتج"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-4">
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