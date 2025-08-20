import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Tag,
  Package,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Settings,
  MoreHorizontal,
  Grid3X3,
  List
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
  product_count?: number;
  parent_id?: string;
  sort_order?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  parent_id?: string;
  sort_order: number;
}

const CategoriesAdmin: React.FC = () => {
  const { i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    parent_id: '',
    sort_order: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    withProducts: 0,
    withoutProducts: 0,
  });

  // جلب التصنيفات
  const fetchCategories = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      setLoading(true);
      
      // جلب التصنيفات مع عدد المنتجات
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          *,
          products:products(count)
        `)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        const processedCategories = data.map(category => ({
          ...category,
          product_count: category.products?.[0]?.count || 0,
        }));
        
        setCategories(processedCategories);
        updateStats(processedCategories);
      }
    } catch (error) {
      console.error('خطأ في جلب التصنيفات:', error);
      toast.error('فشل في جلب التصنيفات');
    } finally {
      setLoading(false);
    }
  }, []);

  // تحديث الإحصائيات
  const updateStats = useCallback((categoriesList: Category[]) => {
    const total = categoriesList.length;
    const active = categoriesList.filter(c => c.is_active).length;
    const inactive = total - active;
    const featured = categoriesList.filter(c => c.is_featured).length;
    const withProducts = categoriesList.filter(c => (c.product_count || 0) > 0).length;
    const withoutProducts = total - withProducts;

    setStats({
      total,
      active,
      inactive,
      featured,
      withProducts,
      withoutProducts,
    });
  }, []);

  // إضافة تصنيف جديد
  const addCategory = async () => {
    if (!isSupabaseConfigured) {
      toast.error('قاعدة البيانات غير متاحة');
      return;
    }

    try {
      const { error } = await supabase
        .from('product_categories')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success('تم إضافة التصنيف بنجاح');
      setShowAddDialog(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('خطأ في إضافة التصنيف:', error);
      toast.error('فشل في إضافة التصنيف');
    }
  };

  // تحديث تصنيف
  const updateCategory = async () => {
    if (!editingCategory || !isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast.success('تم تحديث التصنيف بنجاح');
      setShowEditDialog(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('خطأ في تحديث التصنيف:', error);
      toast.error('فشل في تحديث التصنيف');
    }
  };

  // حذف تصنيف
  const deleteCategory = async (categoryId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      // التحقق من وجود منتجات في التصنيف
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category', categoryId)
        .limit(1);

      if (productsError) throw productsError;

      if (products && products.length > 0) {
        toast.error('لا يمكن حذف التصنيف لوجود منتجات مرتبطة به');
        return;
      }

      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('تم حذف التصنيف بنجاح');
      fetchCategories();
    } catch (error) {
      console.error('خطأ في حذف التصنيف:', error);
      toast.error('فشل في حذف التصنيف');
    }
  };

  // تغيير حالة التصنيف
  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(`تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} التصنيف`);
      fetchCategories();
    } catch (error) {
      console.error('خطأ في تغيير حالة التصنيف:', error);
      toast.error('فشل في تغيير حالة التصنيف');
    }
  };

  // تغيير حالة التميز
  const toggleFeatured = async (categoryId: string, isFeatured: boolean) => {
    if (!isSupabaseConfigured) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .update({ 
          is_featured: isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);

      if (error) throw error;

      toast.success(`تم ${isFeatured ? 'إضافة' : 'إزالة'} التميز من التصنيف`);
      fetchCategories();
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
      const filePath = `category-images/${fileName}`;

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
      image_url: '',
      is_active: true,
      is_featured: false,
      parent_id: '',
      sort_order: 0,
    });
  };

  // فتح نافذة التعديل
  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active,
      is_featured: category.is_featured,
      parent_id: category.parent_id || '',
      sort_order: category.sort_order || 0,
    });
    setShowEditDialog(true);
  };

  // تصدير البيانات
  const exportData = () => {
    const csvContent = [
      ['اسم التصنيف', 'الوصف', 'عدد المنتجات', 'الحالة', 'مميز', 'تاريخ الإنشاء'],
      ...categories.map(category => [
        category.name,
        category.description || '',
        (category.product_count || 0).toString(),
        category.is_active ? 'نشط' : 'غير نشط',
        category.is_featured ? 'نعم' : 'لا',
        new Date(category.created_at).toLocaleDateString('ar-EG')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // تصفية التصنيفات
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && category.is_active) ||
                         (selectedStatus === 'inactive' && !category.is_active);

    return matchesSearch && matchesStatus;
  });

  // ترتيب التصنيفات
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const [field, direction] = sortBy.split('-');
    
    if (field === 'name') {
      return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (field === 'products') {
      return direction === 'asc' 
        ? (a.product_count || 0) - (b.product_count || 0)
        : (b.product_count || 0) - (a.product_count || 0);
    }
    if (field === 'created') {
      return direction === 'asc' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (field === 'sort') {
      return direction === 'asc' 
        ? (a.sort_order || 0) - (b.sort_order || 0)
        : (b.sort_order || 0) - (a.sort_order || 0);
    }
    
    return 0;
  });

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والأزرار */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة التصنيفات</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة تصنيفات المنتجات وتنظيمها
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
            إضافة تصنيف
          </Button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">إجمالي التصنيفات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">التصنيفات النشطة</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">التصنيفات المميزة</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تصنيفات بها منتجات</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.withProducts}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col lg:flex-row gap-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">البحث</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في التصنيفات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الحالة</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">الترتيب</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">الاسم (أ-ي)</option>
                  <option value="name-desc">الاسم (ي-أ)</option>
                  <option value="products-desc">الأكثر منتجات</option>
                  <option value="products-asc">الأقل منتجات</option>
                  <option value="sort-asc">ترتيب (1-9)</option>
                  <option value="created-desc">الأحدث</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض التصنيفات */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCategories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              لا توجد تصنيفات
            </div>
          ) : (
            sortedCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {category.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        مميز
                      </Badge>
                    )}
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
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
                              onClick={() => toggleFeatured(category.id, !category.is_featured)}
                            >
                              <Tag className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {category.is_featured ? 'إزالة التميز' : 'إضافة التميز'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{category.product_count || 0} منتج</span>
                    <span>ترتيب: {category.sort_order || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* عرض الجدول */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>التصنيفات ({sortedCategories.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
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
                    <TableHead>اسم التصنيف</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المنتجات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        لا توجد تصنيفات
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {category.image_url ? (
                              <img
                                src={category.image_url}
                                alt={category.name}
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
                            <span className="font-medium">{category.name}</span>
                            <span className="text-sm text-gray-500">
                              ترتيب: {category.sort_order || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 line-clamp-2">
                            {category.description || 'لا يوجد وصف'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {category.product_count || 0} منتج
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={category.is_active}
                              onCheckedChange={(checked) => toggleCategoryStatus(category.id, checked)}
                            />
                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                              {category.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                            {category.is_featured && (
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
                                    onClick={() => openEditDialog(category)}
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
                                    onClick={() => toggleFeatured(category.id, !category.is_featured)}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {category.is_featured ? 'إزالة التميز' : 'إضافة التميز'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCategory(category.id)}
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
      )}

      {/* نافذة إضافة تصنيف جديد */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم التصنيف *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم التصنيف"
              />
            </div>

            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
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
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف التصنيف"
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="add-featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="add-featured">تصنيف مميز</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="add-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="add-active">نشط</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={addCategory} disabled={!formData.name}>
              إضافة التصنيف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تعديل التصنيف */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل التصنيف</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم التصنيف *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم التصنيف"
              />
            </div>

            <div className="space-y-2">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
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
            <Label>الوصف</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="وصف التصنيف"
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
              <Label htmlFor="edit-featured">تصنيف مميز</Label>
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
            <Button onClick={updateCategory} disabled={!formData.name}>
              تحديث التصنيف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesAdmin;
