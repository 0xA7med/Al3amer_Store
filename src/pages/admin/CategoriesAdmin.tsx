import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Category {
  category_id: string;
  name_ar: string;
  name_en?: string;
  description_ar?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

const CategoriesAdmin: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name_ar: '',
    name_en: '',
    description_ar: '',
    display_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const fetchCategories = async () => {
    if (!isSupabaseConfigured) {
      setCategories([]);
      setLoading(false);
      setError('لا يمكن جلب التصنيفات بدون إعداد Supabase');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // جلب التصنيفات مع عدد المنتجات في كل تصنيف
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          *,
          product_categories(count)
        `)
        .order('name_ar', { ascending: true });
      
      if (categoriesError) throw categoriesError;

      // تحويل البيانات لتشمل عدد المنتجات
      const categoriesWithCount = categoriesData?.map(category => ({
        ...category,
        products_count: (category as any).product_categories?.[0]?.count || 0
      })) || [];
      
      setCategories(categoriesWithCount);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('فشل في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('حفظ التصنيف غير متاح بدون إعداد Supabase');
      return;
    }
    
    if (!formData.name_ar) {
      setError('يرجى إدخال اسم التصنيف بالعربية');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('category_id', editingId);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{ ...formData }]);

        if (error) throw error;
      }

      await fetchCategories();
      setShowForm(false);
      setFormData({
        name_ar: '',
        name_en: '',
        description_ar: '',
        display_order: 0,
        is_active: true,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Error saving category:', err);
      setError('حدث خطأ أثناء حفظ التصنيف');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en || '',
      description_ar: category.description_ar || '',
      display_order: category.display_order,
      is_active: category.is_active,
      image_url: category.image_url,
    });
    setEditingId(category.category_id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;
    if (!isSupabaseConfigured) {
      setError('حذف التصنيف غير متاح بدون إعداد Supabase');
      return;
    }
    
    setLoading(true);
    try {
      // First, update any products that use this category
      const { error: updateError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);

      if (updateError) throw updateError;

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('category_id', id);

      if (error) throw error;

      await fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('لا يمكن حذف التصنيف لأنه مرتبط بمنتجات');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = search
    ? categories.filter(
        cat =>
          cat.name_ar.toLowerCase().includes(search.toLowerCase()) ||
          (cat.name_en && cat.name_en.toLowerCase().includes(search.toLowerCase()))
      )
    : categories;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">إدارة التصنيفات</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => navigate('/admin/products')} 
            variant="outline" 
            className="flex items-center gap-1"
          >
            <span>إدارة المنتجات</span>
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            variant={showForm ? 'outline' : 'default'}
            className="flex items-center gap-1"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                <span>إلغاء</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>إضافة تصنيف جديد</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">اسم التصنيف (عربي) *</Label>
                  <Input
                    id="name_ar"
                    name="name_ar"
                    value={formData.name_ar || ''}
                    onChange={handleInputChange}
                    placeholder="أدخل الاسم بالعربية"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">اسم التصنيف (إنجليزي)</Label>
                  <Input
                    id="name_en"
                    name="name_en"
                    value={formData.name_en || ''}
                    onChange={handleInputChange}
                    placeholder="أدخل الاسم بالإنجليزية"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar">الوصف (اختياري)</Label>
                <textarea
                  id="description_ar"
                  name="description_ar"
                  value={formData.description_ar || ''}
                  onChange={handleInputChange}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="أدخل وصفاً للتصنيف"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">ترتيب العرض</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    value={formData.display_order || 0}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={!!formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-alamer-blue focus:ring-alamer-blue"
                  />
                  <Label htmlFor="is_active" className="!m-0">نشط</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingId ? 'حفظ التغييرات' : 'إضافة التصنيف'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ابحث عن تصنيف..."
            className="pl-10 pr-4 py-2 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !categories.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-alamer-blue"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">لا توجد تصنيفات متاحة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {filteredCategories.map((category) => (
            <Card key={category.category_id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {category.image_url && (
                <div className="h-32 bg-gray-100 overflow-hidden">
                  <img
                    src={category.image_url}
                    alt={category.name_ar}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.name_ar}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? 'default' : 'secondary'} className="whitespace-nowrap">
                      {category.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {category.products_count} منتج
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.description_ar && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {category.description_ar}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t">
                  <span>آخر تحديث: {new Date(category.updated_at).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDelete(category.category_id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesAdmin;
