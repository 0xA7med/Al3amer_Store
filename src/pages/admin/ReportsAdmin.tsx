import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getSiteSettings } from '@/lib/supabase';
import { 
  getMonthlySalesSummary, 
  getProductCountByCategory, 
  getTopSellingProducts,
  getDailySales,
  getInventoryStatus,
} from '@/lib/supabase/reports';
import { getCustomers } from '@/lib/supabase';
import { formatCurrency, formatCurrencySync } from '@/lib/utils';

// تعريف نوع إعدادات الموقع
interface SiteSettings {
  id?: number;
  setting_key: string;
  setting_value?: string | null;
  created_at?: string;
  updated_at?: string;
}

const COLORS = ['#2563eb', '#22c55e', '#f59e42', '#eab308', '#f43f5e', '#a21caf'];

// مكون مساعد لعرض القيم المالية مع رمز العملة
const CurrencyValue: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const [formattedValue, setFormattedValue] = useState('');
  
  useEffect(() => {
    // تحديث القيمة المنسقة بشكل غير متزامن
    const updateCurrency = async () => {
      const formatted = await formatCurrency(value);
      setFormattedValue(formatted);
    };
    
    updateCurrency();
  }, [value]);
  
  return <span className={className}>{formattedValue || formatCurrencySync(value)}</span>;
};

const ReportsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = React.useState([]);
  const [productsData, setProductsData] = React.useState([]);
  const [topProducts, setTopProducts] = React.useState([]);
  const [dailySales, setDailySales] = React.useState([]);
  const [inventoryStatus, setInventoryStatus] = React.useState([]);
  const [customers, setCustomers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('sales');

  React.useEffect(() => {
    if (!localStorage.getItem('isAdminLoggedIn')) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const fetchData = React.useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sales, products, topSelling, daily, inventory, customersData] = await Promise.all([
        getMonthlySalesSummary(from, to),
        getProductCountByCategory(),
        getTopSellingProducts(5, from, to),
        getDailySales(from, to),
        getInventoryStatus(),
        getCustomers(),
      ]);
      
      setSalesData(sales);
      setProductsData(products);
      setTopProducts(topSelling);
      setDailySales(daily);
      setInventoryStatus(inventory);
      setCustomers(customersData);
    } catch (e) {
      console.error('Error fetching reports:', e);
      setError('فشل في تحميل بيانات التقارير. يرجى المحاولة مرة أخرى.');
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(fromDate, toDate);
  };

  const renderDateFilter = () => (
    <form onSubmit={handleFilter} className="flex flex-wrap gap-4 mb-8 items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full dark:bg-gray-700 dark:border-gray-600"
          max={toDate || undefined}
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm w-full dark:bg-gray-700 dark:border-gray-600"
          min={fromDate || undefined}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
      >
        تطبيق الفلتر
      </button>
      <button
        type="button"
        onClick={() => {
          setFromDate('');
          setToDate('');
          fetchData();
        }}
        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition text-sm dark:bg-gray-700 dark:text-gray-200"
      >
        إعادة تعيين
      </button>
    </form>
  );

  // حالة لتخزين إعدادات الموقع
  const [siteSettings, setSiteSettings] = useState<SiteSettings[]>([]);
  
  // جلب إعدادات الموقع عند تحميل المكون
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (error) {
        console.error('Error loading site settings:', error);
      }
    };
    
    loadSiteSettings();
  }, []);

  // Get currency settings
  const getCurrencySymbol = useCallback((): string => {
    const currencySetting = siteSettings.find(s => s.setting_key === 'currency');
    return currencySetting?.setting_value || 'ج.م';
  }, [siteSettings]);

  // Helper function to format tooltip values
  const formatTooltip = useCallback((value: number, name: string) => {
    if (name === 'المبيعات') {
      return formatCurrencySync(value, getCurrencySymbol());
    }
    return value;
  }, [getCurrencySymbol]);

  // Helper function to format Y-axis values
  const formatYAxis = useCallback((tick: number) => {
    return formatCurrencySync(tick, getCurrencySymbol(), 0);
  }, [getCurrencySymbol]);

  const renderSummaryCards = () => {
    const totalSales = salesData.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + (item.orders || 0), 0);
    const totalProducts = productsData.reduce((sum, item) => sum + (item.value || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const currencySymbol = getCurrencySymbol();

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyValue value={totalSales} />
            </div>
            <p className="text-xs text-muted-foreground">
              آخر 30 يومًا
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders.toLocaleString('ar-EG')}</div>
            <p className="text-xs text-muted-foreground">آخر 30 يومًا</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyValue value={avgOrderValue} />
            </div>
            <p className="text-xs text-muted-foreground">آخر 30 يومًا</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTabs = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex space-x-4">
        {['sales', 'products', 'inventory', 'customers'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'sales' && 'المبيعات'}
            {tab === 'products' && 'المنتجات'}
            {tab === 'inventory' && 'المخزون'}
            {tab === 'customers' && 'العملاء'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة التقارير</h1>
      
      {renderDateFilter()}
      {renderSummaryCards()}
      {renderTabs()}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : (
        <div className="space-y-8">
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>المبيعات الشهرية</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => [formatCurrencySync(Number(value), getCurrencySymbol()), name]}
                        labelFormatter={(label) => `الشهر: ${label}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المنتجات حسب الفئة</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={productsData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {productsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">حالة المخزون</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المنتج</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المخزون الحالي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الحد الأدنى</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {inventoryStatus
                      .filter(item => item.currentStock <= item.minStock * 1.5)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-300">{item.name.charAt(0)}</span>
                              </div>
                              <div className="mr-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.currentStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {item.minStock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.currentStock <= item.minStock 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {item.currentStock <= item.minStock ? 'تحتاج طلب' : 'شبه منتهي'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {inventoryStatus.filter(item => item.currentStock <= item.minStock * 1.5).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          لا توجد منتجات تحتاج إلى إعادة طلب حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">تقرير العملاء</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="text-xs text-muted-foreground mb-1">إجمالي العملاء</div>
                    <div className="text-2xl font-bold">{customers.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="text-xs text-muted-foreground mb-1">العملاء الجدد (30 يوم)</div>
                    <div className="text-2xl font-bold">{customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="text-xs text-muted-foreground mb-1">العملاء النشطين</div>
                    <div className="text-2xl font-bold">{customers.filter(c => c.is_active).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="text-xs text-muted-foreground mb-1">الأكثر شراءً</div>
                    <div className="text-2xl font-bold">{customers.length > 0 ? customers.reduce((a, b) => a.total_orders > b.total_orders ? a : b).full_name || '---' : '---'}</div>
                  </CardContent>
                </Card>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الاسم</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">رقم الهاتف</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">البريد الإلكتروني</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المحافظة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">المدينة</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">إجمالي الطلبات</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">إجمالي الإنفاق</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {customers.map((c) => (
                      <tr key={c.customer_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 whitespace-nowrap">{c.full_name || '---'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.phone}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.email || '---'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.governorate || '---'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.city || '---'}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{c.total_orders}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><CurrencyValue value={c.total_spent} /></td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {c.is_active ? <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">نشط</span> : <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs">غير نشط</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsAdmin; 