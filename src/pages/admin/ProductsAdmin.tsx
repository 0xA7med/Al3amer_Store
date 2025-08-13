import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { formatCurrencySync } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Textarea } from '@/components/ui/textarea';

// Types
interface Category {
  category_id: string;
  name_ar: string;
}
interface Product {
  product_id: string;
  title_ar: string;
  title_en?: string;
  price: number;
  original_price?: number;
  categories?: Category[];
  category_ids?: string[];
  stock: number;
  thumbnail_url?: string;
  is_active?: boolean;
  is_featured?: boolean;
  [key: string]: any; // For sorting
}
type ProductFormData = Partial<Omit<Product, 'price' | 'stock' | 'original_price'> & {
  price: string | number;
  stock: string | number;
  original_price?: string | number;
}>;


const PRODUCTS_PER_PAGE = 10;

const ProductsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Filtering and sorting state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch initial data (products and categories)
  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured) {
        setError('Supabase is not configured.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all necessary data in parallel
        const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (productsError) throw productsError;

        const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('category_id, name_ar').eq('is_active', true);
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        const { data: pcData, error: pcError } = await supabase.from('product_categories').select('product_id, category_id');
        if (pcError) throw pcError;

        // Create a map for efficient lookups
        const categoriesMap = new Map(categoriesData.map(c => [c.category_id, c]));
        const productsMap = new Map(productsData.map(p => [p.product_id, { ...p, categories: [] as Category[] }]));

        // Attach categories to products
        pcData.forEach(pc => {
          const product = productsMap.get(pc.product_id);
          const category = categoriesMap.get(pc.category_id);
          if (product && category) {
            product.categories.push(category);
          }
        });

        setProducts(Array.from(productsMap.values()));
      } catch (e: any) {
        setError('Failed to fetch data: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoized filtered and paginated products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const searchLower = search.toLowerCase();
        const matchesSearch = search ? p.title_ar.toLowerCase().includes(searchLower) : true;
        const matchesCategory = filters.category === 'all' || (p.categories || []).some(c => c.category_id === filters.category);
        const matchesStatus = filters.status === 'all' || (filters.status === 'active' ? p.is_active : !p.is_active);
        return matchesSearch && matchesCategory && matchesStatus;
      });
  }, [products, search, filters]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Form handling
  const openFormForNew = () => {
    setEditingProduct(null);
    setFormData({ is_active: true, is_featured: false, price: '', stock: '' });
    setSelectedCategoryIds([]);
    setIsFormOpen(true);
  };

  const openFormForEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setSelectedCategoryIds(product.categories?.map(c => c.category_id) || []);
    setIsFormOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id: 'is_active' | 'is_featured', checked: boolean) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_ar || !formData.price || !selectedCategoryIds.length) {
      alert('Please fill all required fields.');
      return;
    }

    // Prepare product data, removing fields that shouldn't be directly inserted/updated
    const { categories, category_ids, product_id, created_at, ...productData } = formData;

    const finalProductData = {
        ...productData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        original_price: formData.original_price ? Number(formData.original_price) : undefined,
    };

    try {
      let savedProduct: Product;

      if (editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(finalProductData)
          .eq('product_id', editingProduct.product_id)
          .select()
          .single();
        if (error) throw error;
        savedProduct = data;

        // Update categories
        const { error: deleteError } = await supabase.from('product_categories').delete().eq('product_id', editingProduct.product_id);
        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase.from('product_categories').insert(
          selectedCategoryIds.map(catId => ({ product_id: editingProduct.product_id, category_id: catId }))
        );
        if (insertError) throw insertError;

      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(finalProductData)
          .select()
          .single();
        if (error) throw error;
        savedProduct = data;

        // Add categories
        const { error: insertError } = await supabase.from('product_categories').insert(
          selectedCategoryIds.map(catId => ({ product_id: savedProduct.product_id, category_id: catId }))
        );
        if (insertError) throw insertError;
      }

      // Manually update the UI state for the product with its new categories
      const savedProductCategories = categories.filter(c => selectedCategoryIds.includes(c.category_id));
      const productWithCategories = { ...savedProduct, categories: savedProductCategories };

      if (editingProduct) {
        setProducts(products.map(p => p.product_id === editingProduct.product_id ? productWithCategories : p));
      } else {
        setProducts([productWithCategories, ...products]);
      }

      setIsFormOpen(false);
    } catch (e: any) {
      setError('Failed to save product: ' + e.message);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('product_id', productId);
      if (error) throw error;
      setProducts(products.filter(p => p.product_id !== productId));
    } catch (e: any) {
      setError('Failed to delete product: ' + e.message);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <div className="text-center text-red-500 py-12">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">إدارة المنتجات</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/categories')}>
            إدارة التصنيفات
          </Button>
          <Button onClick={openFormForNew}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="max-w-sm"
        />
        <select
          value={filters.category}
          onChange={(e) => { setFilters(f => ({ ...f, category: e.target.value })); setCurrentPage(1); }}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="all">كل التصنيفات</option>
          {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name_ar}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setCurrentPage(1); }}
          className="border rounded px-2 py-2 text-sm bg-white"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        <Badge variant="secondary" className="items-center hidden sm:flex">
          <Filter size={14} className="ml-1" />
          {filteredProducts.length} منتج
        </Badge>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>التصنيفات</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map(product => (
                <TableRow key={product.product_id}>
                  <TableCell>
                    <img src={product.thumbnail_url || '/images/placeholder-product.png'} alt={product.title_ar} className="w-12 h-12 object-cover rounded-md" />
                  </TableCell>
                  <TableCell className="font-medium">{product.title_ar}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(product.categories || []).map(c => <Badge key={c.category_id} variant="secondary">{c.name_ar}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrencySync(product.price, settings.currency_symbol)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'destructive'} className={product.is_active ? 'bg-green-500' : ''}>
                      {product.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openFormForEdit(product)}>
                          <Edit className="ml-2 h-4 w-4" /> تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product.product_id)} className="text-red-500">
                          <Trash2 className="ml-2 h-4 w-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
          <ChevronRight className="h-4 w-4" /> السابق
        </Button>
        <span className="text-sm">
          صفحة {currentPage} من {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          التالي <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="title_ar">اسم المنتج (العربية)</Label>
              <Input id="title_ar" value={formData.title_ar || ''} onChange={handleFormChange} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">السعر</Label>
                <Input id="price" type="number" value={formData.price || ''} onChange={handleFormChange} required />
              </div>
              <div>
                <Label htmlFor="stock">المخزون</Label>
                <Input id="stock" type="number" value={formData.stock || ''} onChange={handleFormChange} required />
              </div>
            </div>
            <div>
              <Label>التصنيفات</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 border p-2 rounded-md max-h-40 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.category_id} className="flex items-center gap-2">
                    <Switch
                      id={`cat-${cat.category_id}`}
                      checked={selectedCategoryIds.includes(cat.category_id)}
                      onCheckedChange={() => handleCategoryToggle(cat.category_id)}
                    />
                    <Label htmlFor={`cat-${cat.category_id}`}>{cat.name_ar}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center space-x-2">
                <Switch id="is_active" checked={!!formData.is_active} onCheckedChange={(c) => handleSwitchChange('is_active', c)} />
                <Label htmlFor="is_active">نشط</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="is_featured" checked={!!formData.is_featured} onCheckedChange={(c) => handleSwitchChange('is_featured', c)} />
                <Label htmlFor="is_featured">مميز</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">إلغاء</Button>
              </DialogClose>
              <Button type="submit">حفظ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsAdmin; 